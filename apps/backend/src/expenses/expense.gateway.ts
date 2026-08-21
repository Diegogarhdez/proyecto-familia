import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ExpenseGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinFamilyRoom')
  handleJoinRoom(client: Socket, familyId: string) {
    client.join(`family_${familyId}`);
  }

  emitExpensesUpdated(familyId: string, dashboard: unknown) {
    this.server.to(`family_${familyId}`).emit('expensesUpdated', dashboard);
  }
}
