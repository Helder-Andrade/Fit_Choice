import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HyperRpcExceptionFilter } from './filters/rcp-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HyperRpcExceptionFilter());
  await app.listen(process.env.PORT ?? 2999);
}
bootstrap();
