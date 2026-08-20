import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class IdeaPlanGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinFamilyRoom')
  handleJoinRoom(client: Socket, familyId: string) {
    client.join(`family_${familyId}`);
  }

  emitIdeaPlanListUpdated(familyId: string, ideasPlans: unknown[]) {
    this.server.to(`family_${familyId}`).emit('ideasPlansListUpdated', ideasPlans);
  }
}
