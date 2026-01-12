import { NestFactory } from '@nestjs/core';
import { GymServiceModule } from './modules/gym/gym-service.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(GymServiceModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: 3004,
    }
  });

  await app.listen();

  Logger.log('Gym Microservice is listening on port 3004');
}
bootstrap();
