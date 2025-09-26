const db = require('../models/index');
const logger = require('../config/logger');
const EmailService = require('../email/email.service');
const { Booking, BusTrip, Passenger } = require('../models');

// controllers/bookingController.js

const createBooking = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      outbound_bus_trip_id,
      return_bus_trip_id,
      passengers,
      payment_method, // This is key
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

    const seatsToReserve = passengers
      .filter(p => p.requires_seat && p.seat_number)
      .map(p => p.seat_number);

    const totalSeatsNeeded = adult_count + seated_child_count;

    if (seatsToReserve.length !== totalSeatsNeeded) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'The number of selected seats does not match the number of passengers requiring a seat.',
      });
    }

    const uniqueSeats = new Set(seatsToReserve);
    if (uniqueSeats.size !== seatsToReserve.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Duplicate seats selected in request.' });
    }

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
        total_amount,
        // Set payment status based on the method
        payment_status: payment_method === 'cash_at_terminal' || payment_method === 'bank_transfer' ? 'pending' : 'paid',
        is_guest,
        guest_email: is_guest ? guest_email : null,
        emergency_contact_name,
        emergency_contact_phone,
        total_seats: totalSeatsNeeded,
        payment_method,
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
        seat_number: passenger.seat_number || null,
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
    
    await transaction.commit(); // Commit the transaction before sending emails

    // 6. Send confirmation email AFTER the transaction is committed
    //  const email = userId ? req.user.email : guest_email;
    //  if (email) {
    //     //You should now use a new dedicated function for this
    //    await EmailService.sendBookingConfirmation(
    //      email,
    //      booking,
    //      outboundBusTrip,
    //      returnBusTrip,
    //      passengerRecords,
    //    );
    //  }

   // await new Promise(resolve => setTimeout(resolve, 60000)); // 60 secs delay

    // 7. Send an internal notification to the company (optional but recommended)
     if (process.env.BOOKING_EMAIL) {
       await EmailService.sendCompanyNotification(
         process.env.BOOKING_EMAIL,
         booking,
         outboundBusTrip,
         returnBusTrip,
         passengerRecords,
       );
     }

    return res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (error) {
   if (transaction && !transaction.finished) {
        await transaction.rollback();
    }
    logger.error('Booking failed', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};


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

module.exports = { createBooking, getUserBookings };
