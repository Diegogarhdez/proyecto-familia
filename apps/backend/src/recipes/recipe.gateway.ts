import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RecipeGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinFamilyRoom')
  handleJoinRoom(client: Socket, familyId: string) {
    client.join(`family_${familyId}`);
  }

  emitRecipeListUpdated(familyId: string, recipes: unknown[]) {
    this.server.to(`family_${familyId}`).emit('recipeListUpdated', recipes);
  }
}
