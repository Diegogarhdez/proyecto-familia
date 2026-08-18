import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TaskGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinFamilyRoom')
  handleJoinRoom(client: Socket, familyId: string) {
    client.join(`family_${familyId}`);
    console.log(`Cliente unido a la sala: family_${familyId}`);
  }

  emitTaskListUpdated(familyId: string, tasks: unknown[]) {
    this.server.to(`family_${familyId}`).emit('tasksListUpdated', tasks);
  }
}
