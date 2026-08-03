import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Habilitamos CORS para que React pueda conectarse sin bloqueos
@WebSocketGateway({ cors: { origin: '*' } })
export class ShoppingGateway {
  @WebSocketServer()
  server: Server;

  // Escuchamos cuando un frontend nos dice "quiero unirme a esta familia"
  @SubscribeMessage('joinFamilyRoom')
  handleJoinRoom(client: Socket, familyId: string) {
    // Metemos al usuario en una sala virtual única para su familia
    client.join(`family_${familyId}`);
    console.log(`Cliente unido a la sala: family_${familyId}`);
  }

  emitShoppingListUpdated(familyId: string, items: unknown[]) {
    this.server.to(`family_${familyId}`).emit('shoppingListUpdated', items);
  }
}
