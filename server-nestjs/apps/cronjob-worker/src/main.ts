import { NestFactory } from '@nestjs/core';
import { CronjobWorkerModule } from './cronjob-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(CronjobWorkerModule);

  const port = process.env.CRONJOB_PORT || 3001;
  await app.listen(port);

  console.log(`🕐 Cronjob Worker is running on http://localhost:${port}`);
}

bootstrap();
