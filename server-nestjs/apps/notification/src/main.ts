import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  const port = process.env.NOTIFICATION_PORT || 3002;
  await app.listen(port);

  console.log(`📨 Notification Service is running on http://localhost:${port}`);
}

bootstrap();
