import { Module } from '@nestjs/common';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gym } from '../../entities/gym.entity';
import { User_Gym } from '../../entities/user_gym.entity';
import { JwtAuthGuard } from '@app/auth';
import { GymUserServiceModule } from '../gym-user/gym_user.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['ambient_variables.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('GYM_DB_HOST'),
        port: configService.get<number>('GYM_DB_PORT'),
        username: configService.get<string>('GYM_DB_USERNAME'),
        password: configService.get<string>('GYM_DB_PASSWORD'),
        database: configService.get<string>('GYM_DB_NAME'),
        entities: [Gym, User_Gym],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Gym]),
    GymUserServiceModule, 
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3003 },
      },
    ]),
  ],
  controllers: [GymServiceController],
  providers: [GymServiceService, JwtAuthGuard],
  exports: [GymServiceService],
})
export class GymServiceModule { }
