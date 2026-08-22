import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

type RealtimeSocket = Socket & { data: { familyId?: string; userId?: string } };

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: RealtimeSocket) {
    const token = this.getToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, familyId: true },
      });

      if (!user) {
        client.disconnect(true);
        return;
      }

      client.data.userId = user.id;
      client.data.familyId = user.familyId;
      await client.join(this.roomName(user.familyId));
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: RealtimeSocket) {
    // Socket.IO removes disconnected clients from their rooms automatically.
  }

  emitShoppingListUpdated(familyId: string, items: unknown[]) {
    this.emitToFamily(familyId, 'shoppingListUpdated', items);
  }

  emitTasksListUpdated(familyId: string, tasks: unknown[]) {
    this.emitToFamily(familyId, 'tasksListUpdated', tasks);
  }

  emitIdeasPlansListUpdated(familyId: string, ideasPlans: unknown[]) {
    this.emitToFamily(familyId, 'ideasPlansListUpdated', ideasPlans);
  }

  emitRecipeListUpdated(familyId: string, recipes: unknown[]) {
    this.emitToFamily(familyId, 'recipeListUpdated', recipes);
  }

  emitExpensesUpdated(familyId: string, dashboard: unknown) {
    this.emitToFamily(familyId, 'expensesUpdated', dashboard);
  }

  emitCalendarEventsUpdated(familyId: string, events: unknown[]) {
    this.emitToFamily(familyId, 'calendarEventsUpdated', events);
  }

  private emitToFamily(familyId: string, event: string, payload: unknown) {
    this.server.to(this.roomName(familyId)).emit(event, payload);
  }

  private roomName(familyId: string) {
    return `family_${familyId}`;
  }

  private getToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string') {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;
    return authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  }
}
