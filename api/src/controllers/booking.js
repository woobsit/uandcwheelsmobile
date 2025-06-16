const db =require( '../models/index');
const logger =require( '../config/logger');
const { validationResult } =require( 'express-validator');
const EmailService =require( '../email/email.service');


 const searchTrips = async (req, res, next) => {
  try {
    const { from, to, date } = req.query;
    
    const trips = await db.Trip.findAll({
      where: {
        departure_location: from,
        arrival_location: to,
        departure_time: {
          [db.Sequelize.Op.between]: [
            new Date(date),
            new Date(new Date(date).setDate(new Date(date).getDate() + 1))
          ]
        },
        status: 'scheduled'
      },
      include: [{
        model: db.Bus,
        attributes: ['plate_number', 'brand', 'capacity']
      }]
    });

    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
};

 const createBooking = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const transaction = await db.sequelize.transaction();
  try {
    const { trip_id, seats, payment_method } = req.body;
    
    // 1. Verify trip availability
    const trip = await db.Trip.findByPk(trip_id, { 
      transaction,
      include: [{
        model: db.Bus,
        attributes: ['id', 'brand', 'plate_number']
      }]
    });

    if (!trip || trip.status !== 'scheduled') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Trip not available' });
    }

    // 2. Check seat availability
    const existingBookings = await db.Booking.findAll({ 
      where: { trip_id },
      transaction
    });
    
    const takenSeats = existingBookings.flatMap(b => b.seats);
    if (seats.some((seat) => takenSeats.includes(seat))) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Some seats are already taken' });
    }

    // 3. Create booking
    const booking = await db.Booking.create({
      user_id: req.user.id,
      trip_id,
      seats,
      total_amount: seats.length * trip.fare,
      payment_status: 'pending'
    }, { transaction });

    // 4. Process payment (mock implementation)
    await processPaymentMock(booking, payment_method);

    // 5. Get user details for email
    const user = await db.User.findByPk(req.user.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    // 6. Verify bus details are available
    if (!trip.Bus) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Bus details not found' });
    }

    // 7. Send confirmation email
    await EmailService.sendBookingConfirmation(
      user.email,
      user.name,
      {
        reference: booking.transaction_reference,
        seats,
        total_amount: booking.total_amount,
        trip: {
          departure_location: trip.departure_location,
          arrival_location: trip.arrival_location,
          departure_time: trip.departure_time,
          estimated_arrival: trip.estimated_arrival
        },
        bus: {
          brand: trip.Bus.brand,
          plate_number: trip.Bus.plate_number
        }
      }
    );

    await transaction.commit();
    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    await transaction.rollback();
    logger.error('Booking failed:', error);
    next(error);
  }
};

async function processPaymentMock(booking, method) {
  return new Promise(resolve => setTimeout(() => {
    booking.update({ 
      payment_status: 'paid',
      payment_method: method,
      transaction_reference: `TX-${Date.now()}`
    });
    resolve(true);
  }, 1000));
}

 const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await db.Booking.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: db.Trip,
        include: [{
          model: db.Bus,
          attributes: ['plate_number', 'brand']
        }]
      }]
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

 const getBookingDetails = async (req, res, next) => {
  try {
    const booking = await db.Booking.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      include: [{
        model: db.Trip,
        include: [{
          model: db.Bus,
          attributes: ['plate_number', 'brand']
        }]
      }]
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
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

module.exports = {searchTrips, createBooking, getUserBookings, getBookingDetails}