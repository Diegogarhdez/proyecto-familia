import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CalendarEventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinFamilyRoom')
  handleJoinRoom(client: Socket, familyId: string) {
    client.join(`family_${familyId}`);
  }

  emitCalendarEventsUpdated(familyId: string, events: unknown[]) {
    this.server.to(`family_${familyId}`).emit('calendarEventsUpdated', events);
  }
}
