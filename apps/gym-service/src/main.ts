import { NestFactory } from '@nestjs/core';
import { GymServiceModule } from './gym-service.module';

async function bootstrap() {
  const app = await NestFactory.create(GymServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
