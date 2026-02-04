import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User_Gym } from '../../entities/user_gym.entity';
import { JwtAuthGuard } from '@app/auth';
import { GymUserService } from './gym_user.service';
import { GymUserController } from './gym_user.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    TypeOrmModule.forFeature([User_Gym]),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { host: '127.0.0.1', port: 3003 }, 
      },
    ]),
  ],
  controllers: [GymUserController],
  providers: [JwtAuthGuard, GymUserService],
  exports: [GymUserService, TypeOrmModule],
})
export class GymUserServiceModule { }
