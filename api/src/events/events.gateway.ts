import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/events',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: number) {
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} joined room user_${userId}`);
  }

  sendNotification(userId: number, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  sendAppointmentUpdate(userId: number, appointment: any) {
    this.server.to(`user_${userId}`).emit('appointmentUpdate', appointment);
  }

  sendDashboardUpdate(userId: number, data: any) {
    this.server.to(`user_${userId}`).emit('dashboardUpdate', data);
  }

  sendEvent(userId: number, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }
}
