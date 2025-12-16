import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthServiceModule } from '../../auth-service/src/auth-service.module';
import { AuthModuleOptions } from '@nestjs/passport';
import { User } from '../../auth-service/src/modules/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['ambient_variables.env'],
    }),
    TypeOrmModule.forRootAsync({
      name: 'authConnection',
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        type: 'postgres',
        host: ConfigService.get<string>('AUTH_DB_HOST'),
        port: ConfigService.get<number>('AUTH_DB_PORT'),
        username: ConfigService.get<string>('AUTH_DB_USERNAME'),
        password: ConfigService.get<string>('AUTH_DB_PASSWORD'),
        database: ConfigService.get<string>('AUTH_DB_NAME'),
        entities: [User],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    /*TypeOrmModule.forRootAsync({
      name: 'CoreConnection',
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        type: 'postgres',
        host: ConfigService.get<string>('CORE_DB_HOST'),
        port: ConfigService.get<number>('CORE_DB_PORT'),
        username: ConfigService.get<string>('CORE_DB_USERNAME'),
        password: ConfigService.get<string>('CORE_DB_PASSWORD'),
        database: ConfigService.get<string>('CORE_DB_NAME'),
        entities: ['*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    */

    AuthServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
