const db = require('../models/index');
const logger = require('../config/logger');
const EmailService = require('../email/email.service');

const createBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { bus_trip_id, return_bus_trip_id, passengers, payment_method, user_email } = req.body;
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

    // 1. Fetch bus trip with related data
    const busTrip = await db.BusTrip.findByPk(bus_trip_id, {
      transaction,
      include: [
        {
          model: db.Bus,
          attributes: ['id', 'brand', 'plate_number', 'capacity'],
        },
        {
          model: db.Trip,
          include: [
            { model: db.Location, as: 'departureLocation' },
            { model: db.Location, as: 'arrivalLocation' }
          ]
        }
      ]
    });

    // Check if bus trip exists
    if (!busTrip) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bus trip not found' });
    }

    // 2. Calculate needed seats
    const seatsNeeded = adults + seatedChildren + Math.ceil(lapChildren / 2);
    
    // Check seat availability
    if (busTrip.available_seats < seatsNeeded) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: `Only ${busTrip.available_seats} seats available, needed: ${seatsNeeded}` 
      });
    }

    // 3. Calculate pricing
    let totalAmount = calculateGroupFare(adults, totalChildren, busTrip.trip.fare);
    
    // Handle return trip if exists
    let returnBusTrip = null;
    if (return_bus_trip_id) {
      returnBusTrip = await db.BusTrip.findByPk(return_bus_trip_id, {
        transaction,
        include: [db.Bus, db.Trip]
      });
      
      if (!returnBusTrip) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Return bus trip not found' });
      }
      
      // Check return trip availability
      if (returnBusTrip.available_seats < seatsNeeded) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: `Only ${returnBusTrip.available_seats} return seats available, needed: ${seatsNeeded}` 
        });
      }
      
      totalAmount += calculateGroupFare(adults, totalChildren, returnBusTrip.trip.fare);
    }

    // 4. Create booking
    const booking = await db.Booking.create(
      {
        user_id: userId,
        bus_trip_id,
        return_bus_trip_id: return_bus_trip_id || null,
        adult_count: adults,
        lap_child_count: lapChildren,
        seated_child_count: seatedChildren,
        total_amount: totalAmount,
        payment_status: 'pending',
        guest_email: userId ? null : user_email,
      },
      { transaction },
    );

    // 5. Create passengers
    const passengerRecords = passengers.map(passenger => {
      let farePaid = 0;
      
      switch(passenger.type) {
        case 'adult':
          farePaid = busTrip.trip.fare;
          break;
        case 'lap-child':
          farePaid = busTrip.trip.fare * 0.5;
          break;
        case 'seated-child':
          farePaid = busTrip.trip.fare;
          break;
      }
      
      if (return_bus_trip_id) {
        farePaid += returnBusTrip.trip.fare * (passenger.type === 'lap-child' ? 0.5 : 1);
      }

      return {
        booking_id: booking.id,
        ...passenger,
        requires_seat: passenger.type !== 'lap-child',
        is_on_lap: passenger.type === 'lap-child',
        fare_paid: farePaid,
      };
    });

    await db.Passenger.bulkCreate(passengerRecords, { transaction });

    // 6. Update available seats
    await busTrip.update({
      available_seats: busTrip.available_seats - seatsNeeded
    }, { transaction });

    if (returnBusTrip) {
      await returnBusTrip.update({
        available_seats: returnBusTrip.available_seats - seatsNeeded
      }, { transaction });
    }

    // 7. Process payment
    await processPaymentMock(booking, payment_method);

    // 8. Send confirmation email
    const email = userId ? req.user.email : user_email;
    if (email) {
      await sendBookingConfirmation(
        email, 
        booking, 
        busTrip, 
        returnBusTrip, 
        passengerRecords
      );
    }

    await transaction.commit();
    return res.status(201).json({ 
      success: true, 
      data: {
        ...booking.toJSON(),
        passengers: passengerRecords
      }
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

// Helper function to send booking confirmation
async function sendBookingConfirmation(email, booking, busTrip, returnBusTrip, passengers) {
  const tripData = {
    departure_location: busTrip.trip.departureLocation.name,
    arrival_location: busTrip.trip.arrivalLocation.name,
    departure_time: busTrip.departure_time,
    bus: {
      brand: busTrip.Bus.brand,
      plate_number: busTrip.Bus.plate_number,
    }
  };

  const returnData = returnBusTrip ? {
    departure_location: returnBusTrip.trip.departureLocation.name,
    arrival_location: returnBusTrip.trip.arrivalLocation.name,
    departure_time: returnBusTrip.departure_time,
    bus: {
      brand: returnBusTrip.Bus.brand,
      plate_number: returnBusTrip.Bus.plate_number,
    }
  } : null;

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
        fare: p.fare_paid
      }))
    }
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
