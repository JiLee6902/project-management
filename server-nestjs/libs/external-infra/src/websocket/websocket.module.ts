import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebSocketService } from './websocket.service';
import { AppWebSocketGateway } from './websocket.gateway';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [WebSocketService, AppWebSocketGateway],
  exports: [WebSocketService],
})
export class WebSocketModule {}
