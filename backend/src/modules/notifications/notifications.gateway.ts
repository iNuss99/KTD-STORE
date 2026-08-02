import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Guest user browsing site - keep socket connected for public notifications
        return;
      }

      const secret = this.configService.get<string>('JWT_SECRET', 'super_secret_jwt_key_menwear_hub_2026');
      const payload = this.jwtService.verify(token, { secret });

      client.data.user = payload;
      
      if (payload.sub || payload.id) {
        const userId = payload.sub || payload.id;
        client.join(`user_${userId}`);
      }
      if (payload.role) {
        client.join(`role_${payload.role}`);
      }
    } catch (err) {
      // Quietly handle invalid token without crashing connection
    }
  }

  handleDisconnect(client: Socket) {}

  sendToUser(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`user_${userId}`).emit(event, payload);
    }
  }

  sendToRole(role: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`role_${role}`).emit(event, payload);
    }
  }

  broadcast(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}
