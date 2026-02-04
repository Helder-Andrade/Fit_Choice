import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HyperRpcExceptionFilter } from './filters/rcp-exception.filter';
import { BadRequestException, ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HyperRpcExceptionFilter());

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true, 
    },
    exceptionFactory: (errors) => {
    // This forces the console to print the exact validation error
    console.error(errors); 
    return new BadRequestException(errors);
  }
  }));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 2999);
}
bootstrap();
