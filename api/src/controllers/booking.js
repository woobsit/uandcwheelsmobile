const db = require('../models/index');
const logger = require('../config/logger');
const EmailService = require('../email/email.service');
const { Booking, BusTrip, Passenger } = require('../models');

const createBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      outbound_bus_trip_id,
      return_bus_trip_id,
      passengers,
      payment_method,
      is_guest,
      guest_email,
      emergency_contact_name,
      emergency_contact_phone,
      total_amount,
      adult_count,
      lap_child_count,
      seated_child_count,
    } = req.body;

    const userId = req.user ? req.user.id : null;

    // Validate if the user is a guest and provide a guest email
    if (is_guest && !guest_email) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Guest email is required for guest bookings.' });
    }

    // 1. Fetch bus trip and validate availability
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

    if (!outboundBusTrip || outboundBusTrip.status !== 'scheduled' || !outboundBusTrip.bus) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Outbound trip not available or bus details are missing.' });
    }

    // Extract selected seats from the passengers array
    const seatsToReserve = passengers
      .filter(p => p.requires_seat && p.seat_number)
      .map(p => p.seat_number);

    const totalSeatsNeeded = adult_count + seated_child_count;

    // A. Validate that the number of selected seats matches the number of seats needed
    if (seatsToReserve.length !== totalSeatsNeeded) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'The number of selected seats does not match the number of passengers requiring a seat.',
      });
    }

    // B. Check for duplicate seats in the incoming request
    const uniqueSeats = new Set(seatsToReserve);
    if (uniqueSeats.size !== seatsToReserve.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Duplicate seats selected in request.' });
    }

    // C. Validate that the selected seats are not already taken
    const takenSeats = outboundBusTrip.bus.taken_seats || [];
    const isAnySeatTaken = seatsToReserve.some(seat => takenSeats.includes(seat));
    if (isAnySeatTaken) {
      await transaction.rollback();
      return res.status(400).json({ message: 'One or more of the selected seats are already taken.' });
    }

    // 2. Handle return trip if applicable
    let returnBusTrip = null;
    if (return_bus_trip_id) {
      returnBusTrip = await BusTrip.findByPk(return_bus_trip_id, {
        transaction,
        include: [{ association: 'bus' }, { association: 'trip' }],
      });

      if (!returnBusTrip || returnBusTrip.status !== 'scheduled' || !returnBusTrip.bus) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Return trip not available or bus details are missing.' });
      }

      const returnTakenSeats = returnBusTrip.bus.taken_seats || [];
      const isAnyReturnSeatTaken = seatsToReserve.some(seat => returnTakenSeats.includes(seat));
      if (isAnyReturnSeatTaken) {
        await transaction.rollback();
        return res.status(400).json({ message: 'One or more of the selected seats on the return trip are already taken.' });
      }
    }

    // 3. Create the booking
    const booking = await Booking.createBooking(
      {
        user_id: userId,
        outbound_bus_trip_id,
        return_bus_trip_id: returnBusTrip ? returnBusTrip.id : null,
        adult_count,
        lap_child_count,
        seated_child_count,
        total_amount, // Use the amount sent from the client
        payment_status: 'pending',
        is_guest,
        guest_email: is_guest ? guest_email : null,
        emergency_contact_name,
        emergency_contact_phone,
        total_seats: totalSeatsNeeded,
      },
      { transaction },
    );

    // 4. Create passengers in bulk
    const passengerRecords = passengers.map(passenger => {
      return {
        booking_id: booking.id,
        name: passenger.name,
        age: passenger.age,
        type: passenger.type,
        requires_seat: passenger.requires_seat,
        is_on_lap: passenger.is_on_lap,
        is_primary: passenger.is_primary,
        seat_number: passenger.seat_number || null, // Capture the selected seat
        next_of_kin_name: passenger.next_of_kin_name,
        next_of_kin_phone: passenger.next_of_kin_phone,
        next_of_kin_relationship: passenger.next_of_kin_relationship,
      };
    });

    await Passenger.bulkCreate(passengerRecords, { transaction });

    // 5. Update bus trip seat availability and taken seats
    const newOutboundTakenSeats = [...(outboundBusTrip.bus.taken_seats || []), ...seatsToReserve];
    await outboundBusTrip.bus.update(
      {
        available_seats: outboundBusTrip.bus.available_seats - totalSeatsNeeded,
        taken_seats: newOutboundTakenSeats,
      },
      { transaction }
    );

    if (returnBusTrip) {
      const newReturnTakenSeats = [...(returnBusTrip.bus.taken_seats || []), ...seatsToReserve];
      await returnBusTrip.bus.update(
        {
          available_seats: returnBusTrip.bus.available_seats - totalSeatsNeeded,
          taken_seats: newReturnTakenSeats,
        },
        { transaction }
      );
    }
    
    // 6. Process payment (mock)
    // Note: In a real-world app, this would be a more complex process
    // that might involve a payment gateway and webhooks.
    await processPaymentMock(booking, payment_method);

    // 7. Send confirmation
    const email = userId ? req.user.email : guest_email;
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
