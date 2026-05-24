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
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: number) {
    client.join(`user_${userId}`);
    console.log(`Client ${client.id} joined room user_${userId}`);
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
