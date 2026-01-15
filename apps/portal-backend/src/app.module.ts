import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth/auth.controller';
import { GymController } from './gyms/gym.Controller';
import { JwtStrategy } from 'apps/auth-service/src/modules/auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GymUserControllerPB } from './gyms/gym_user.Controller';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['ambient_variables.env'],
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' }
      })
    }),



    ClientsModule.register([{
      name: 'AUTH_SERVICE',
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3003,
      }
    },
    ]),
    ClientsModule.register([{
      name: 'GYM_SERVICE',
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3004,
      }
    }]),




  ],
  controllers: [AuthController, GymController, GymUserControllerPB],
  providers: [AppService, JwtStrategy, StorageService],
})
export class AppModule { }
