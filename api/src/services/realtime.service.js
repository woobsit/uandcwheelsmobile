// services/realtime.service.ts
const { Server } = require('socket.io');

function initRealtime(server) {
  const io = new Server(server);

  io.on('connection', socket => {
    socket.on('joinTrip', tripId => {
      socket.join(`trip-${tripId}`);
    });
  });

  return io;
}

module.exports = { initRealtime };
// In booking controller after successful booking:
// req.app.get('io').to(`trip-${tripId}`).emit('seatBooked', { seats });
