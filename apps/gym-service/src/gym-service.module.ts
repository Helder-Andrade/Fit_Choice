import { Module } from '@nestjs/common';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from './modules/gym.entity';
import { User_Gym } from './modules/user_gym.entity';
import { JwtAuthGuard } from 'apps/auth-service/src/modules/auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['ambient_variables.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        type: 'postgres',
        host: ConfigService.get<string>('GYM_DB_HOST'),
        port: ConfigService.get<number>('GYM_DB_PORT'),
        username: ConfigService.get<string>('GYM_DB_USERNAME'),
        password: ConfigService.get<string>('GYM_DB_PASSWORD'),
        database: ConfigService.get<string>('GYM_DB_NAME'),
        entities: [Gym, User_Gym],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Gym]),
    TypeOrmModule.forFeature([User_Gym]),
  ],
  controllers: [GymServiceController],
  providers: [GymServiceService, JwtAuthGuard],
  exports: [GymServiceService],
})
export class GymServiceModule { }
