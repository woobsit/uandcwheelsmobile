// services/realtime.service.ts
import { Server } from 'socket.io';

export function initRealtime(server: any) {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    socket.on('joinTrip', (tripId) => {
      socket.join(`trip-${tripId}`);
    });
  });

  return io;
}

// In booking controller after successful booking:
// req.app.get('io').to(`trip-${tripId}`).emit('seatBooked', { seats });