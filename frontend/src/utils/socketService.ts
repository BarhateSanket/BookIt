import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId || null;
    this.socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      upgrade: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');

      // Join user-specific room if userId is provided
      if (this.userId) {
        this.socket?.emit('join-user-room', this.userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join experience room for real-time availability updates
  joinExperienceRoom(experienceId: string) {
    if (this.socket) {
      this.socket.emit('join-experience-room', experienceId);
    }
  }

  // Leave experience room
  leaveExperienceRoom(experienceId: string) {
    if (this.socket) {
      this.socket.emit('leave-experience-room', experienceId);
    }
  }

  // Listen for booking creation events
  onBookingCreated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('booking-created', callback);
    }
  }

  // Listen for booking cancellation events
  onBookingCancelled(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('booking-cancelled', callback);
    }
  }

  // Listen for availability updates
  onAvailabilityUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('availability-updated', callback);
    }
  }

  // Listen for chat messages
  onChatMessage(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('chat-message', callback);
    }
  }

  // Remove all listeners for a specific event
  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();