const db = require('../models/index');
const logger = require('../config/logger');
const EmailService = require('../email/email.service');

//const { Booking, BusTrip, Passenger } = require('../models');
//const { calculateGroupFare } = require('../utils/priceCalculator');

const createBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      outbound_bus_trip_id,
      return_bus_trip_id,
      passengers,
      payment_method,
      user_email,
      emergency_contact_name,
      emergency_contact_phone,
    } = req.body;

    const userId = req.user ? req.user.id : null;

    // Validate passengers
    const adults = passengers.filter(p => p.type === 'adult').length;
    const lapChildren = passengers.filter(p => p.type === 'lap-child').length;
    const seatedChildren = passengers.filter(p => p.type === 'seated-child').length;
    const totalChildren = lapChildren + seatedChildren;

    // Validation rules
    if (lapChildren > adults) {
      return res.status(400).json({ message: 'Maximum 1 lap child per adult' });
    }

    // Calculate seats needed
    const seatsNeeded = adults + seatedChildren + Math.ceil(lapChildren / 2);

    // 1. Fetch bus trips
    const outboundBusTrip = await BusTrip.findByPk(outbound_bus_trip_id, {
      transaction,
      include: [
        { association: 'bus' },
        {
          association: 'trip',
          include: [
            { association: 'departureLocation', as: 'departureLocation' },
            { association: 'arrivalLocation', as: 'arrivalLocation' },
          ],
        },
      ],
    });

    if (!outboundBusTrip || outboundBusTrip.status !== 'scheduled') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Outbound trip not available' });
    }

    if (outboundBusTrip.available_seats < seatsNeeded) {
      await transaction.rollback();
      return res.status(400).json({
        message: `Only ${outboundBusTrip.available_seats} seats available on outbound trip`,
      });
    }

    let returnBusTrip = null;
    if (return_bus_trip_id) {
      returnBusTrip = await BusTrip.findByPk(return_bus_trip_id, {
        transaction,
        include: [{ association: 'bus' }, { association: 'trip' }],
      });

      if (!returnBusTrip || returnBusTrip.status !== 'scheduled') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Return trip not available' });
      }

      if (returnBusTrip.available_seats < seatsNeeded) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Only ${returnBusTrip.available_seats} seats available on return trip`,
        });
      }
    }

    // 2. Calculate pricing
    const outboundFare = calculateGroupFare(adults, totalChildren, outboundBusTrip.trip.fare);

    let returnFare = 0;
    if (returnBusTrip) {
      returnFare = calculateGroupFare(adults, totalChildren, returnBusTrip.trip.fare);
    }

    const totalAmount = outboundFare + returnFare;

    // 3. Create booking
    const booking = await Booking.create(
      {
        user_id: userId,
        outbound_bus_trip_id,
        return_bus_trip_id: returnBusTrip ? returnBusTrip.id : null,
        adult_count: adults,
        lap_child_count: lapChildren,
        seated_child_count: seatedChildren,
        total_amount: totalAmount,
        payment_status: 'pending',
        is_guest: !userId,
        guest_email: userId ? null : user_email,
        emergency_contact_name,
        emergency_contact_phone,
        total_seats: seatsNeeded,
      },
      { transaction },
    );

    // 4. Create passengers
    const passengerRecords = passengers.map(passenger => {
      return {
        booking_id: booking.id,
        ...passenger,
        requires_seat: passenger.type !== 'lap-child',
        is_on_lap: passenger.type === 'lap-child',
      };
    });

    await Passenger.bulkCreate(passengerRecords, { transaction });

    // 5. Update bus trip seat availability
    await outboundBusTrip.update(
      {
        available_seats: outboundBusTrip.available_seats - seatsNeeded,
      },
      { transaction },
    );

    if (returnBusTrip) {
      await returnBusTrip.update(
        {
          available_seats: returnBusTrip.available_seats - seatsNeeded,
        },
        { transaction },
      );
    }

    // 6. Process payment
    await processPaymentMock(booking, payment_method);

    // 7. Send confirmation
    const email = userId ? req.user.email : user_email;
    if (email) {
      await sendBookingConfirmation(
        email,
        booking,
        outboundBusTrip,
        returnBusTrip,
        passengerRecords,
      );
    }

    await transaction.commit();
    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Booking failed', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const createInitialBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    // Get the bus trip IDs from the request body
    const { outbound_bus_trip_id, return_bus_trip_id } = req.body; // Get the user ID from the authenticated user or set to null for guests
    const userId = req.user ? req.user.id : null; // 1. Validate bus trip availability
    const outboundBusTrip = await db.BusTrip.findByPk(outbound_bus_trip_id, {
      transaction,
    });

    if (!outboundBusTrip || outboundBusTrip.available_seats <= 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Outbound trip not available or no seats left.' });
    } // Check for a return trip if provided

    let returnBusTrip = null;
    if (return_bus_trip_id) {
      returnBusTrip = await db.BusTrip.findByPk(return_bus_trip_id, { transaction });
      if (!returnBusTrip || returnBusTrip.available_seats <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Return trip not available or no seats left.' });
      }
    } // 2. Create the provisional booking

    const booking = await db.Booking.create(
      {
        user_id: userId,
        outbound_bus_trip_id,
        return_bus_trip_id: returnBusTrip ? returnBusTrip.id : null, // Set initial values
        total_seats: 1, // Temporarily reserve one seat to prevent overbooking on the first click
        payment_status: 'pending_details', // New status to indicate details are needed
        status: 'provisional', // New status for initial reservation
        total_amount: 0, // Will be calculated on the next screen
        adult_count: 0,
        lap_child_count: 0,
        seated_child_count: 0,
        is_guest: !userId, // Other fields are null by default
      },
      { transaction },
    ); // 3. Deduct one seat from the available count for the reservation

    await db.BusTrip.update(
      { available_seats: db.sequelize.literal('available_seats - 1') },
      {
        where: { id: outboundBusTrip.id },
        transaction,
      },
    );

    if (returnBusTrip) {
      await db.BusTrip.update(
        { available_seats: db.sequelize.literal('available_seats - 1') },
        {
          where: { id: returnBusTrip.id },
          transaction,
        },
      );
    }

    await transaction.commit();
    return res.status(201).json({
      success: true,
      message: 'Initial booking created successfully.',
      bookingId: booking.id,
      bookingReference: booking.booking_reference,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Initial booking failed', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

async function sendBookingConfirmation(email, booking, outboundBusTrip, returnBusTrip, passengers) {
  const tripData = {
    departure: outboundBusTrip.trip.departureLocation.name,
    arrival: outboundBusTrip.trip.arrivalLocation.name,
    departure_time: outboundBusTrip.departure_time,
    bus: outboundBusTrip.bus,
  };

  const returnData = returnBusTrip
    ? {
        departure: returnBusTrip.trip.departureLocation.name,
        arrival: returnBusTrip.trip.arrivalLocation.name,
        departure_time: returnBusTrip.departure_time,
        bus: returnBusTrip.bus,
      }
    : null;

  await EmailService.sendBookingConfirmation(email, 'Guest', {
    reference: booking.booking_reference,
    total_amount: booking.total_amount,
    outbound: tripData,
    return: returnData,
    passengers: passengers.map(p => ({
      name: p.name,
      type: p.type,
      seat: p.seat_number,
    })),
  });
}

// Helper function to send booking confirmation
async function sendBookingConfirmation(email, booking, busTrip, returnBusTrip, passengers) {
  const tripData = {
    departure_location: busTrip.trip.departureLocation.name,
    arrival_location: busTrip.trip.arrivalLocation.name,
    departure_time: busTrip.departure_time,
    bus: {
      brand: busTrip.Bus.brand,
      plate_number: busTrip.Bus.plate_number,
    },
  };

  const returnData = returnBusTrip
    ? {
        departure_location: returnBusTrip.trip.departureLocation.name,
        arrival_location: returnBusTrip.trip.arrivalLocation.name,
        departure_time: returnBusTrip.departure_time,
        bus: {
          brand: returnBusTrip.Bus.brand,
          plate_number: returnBusTrip.Bus.plate_number,
        },
      }
    : null;

  await EmailService.sendBookingConfirmation(
    email,
    'Guest', // Or fetch user name if registered
    {
      reference: booking.id,
      total_amount: booking.total_amount,
      trip: tripData,
      return_trip: returnData,
      passengers: passengers.map(p => ({
        name: p.name,
        type: p.type,
        seat: p.seat_assignment,
        fare: p.fare_paid,
      })),
    },
  );
}

// async function processPaymentMock(booking, method) {
//   return new Promise(resolve =>
//     setTimeout(() => {
//       booking.update({
//         payment_status: 'paid',
//         payment_method: method,
//         transaction_reference: `TX-${Date.now()}`,
//       });
//       resolve(true);
//     }, 1000),
//   );
// }

const getUserBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { user_id: req.user.id };

    if (status) {
      where.payment_status = status;
    }

    const bookings = await db.Booking.findAll({
      where,
      include: [
        {
          model: db.Trip,
          include: [
            {
              model: db.Bus,
              attributes: ['plate_number', 'brand'],
            },
            {
              model: db.Driver,
              attributes: ['name'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    logger.error('Failed to get user bookings', {
      error: error.message,
      userId: req.user.id,
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// async function processRealPayment(booking: any, method: string, user: User) {
//   const paymentResult = await PaymentGateway.charge({
//     amount: booking.total_amount,
//     currency: 'USD',
//     customer: user.email,
//     payment_method: method
//   });

//   await booking.update({
//     payment_status: paymentResult.success ? 'paid' : 'failed',
//     payment_method: method,
//     transaction_reference: paymentResult.reference
//   });

//   return paymentResult.success;
// }

module.exports = { createBooking, getUserBookings };
