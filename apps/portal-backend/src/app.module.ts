import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GymController } from './gyms/gym.Controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GymUserControllerPB } from './gyms/gym_user.Controller';
import { StorageController } from './storage/storage.Controller';
import { CommonAuthModule, AuthController } from '@app/auth';
import { StorageModule, StorageService } from '@app/storage';

@Module({
  imports: [
    CommonAuthModule,
    StorageModule,

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
  controllers: [AuthController, GymController, GymUserControllerPB, StorageController],
  providers: [AppService, StorageService],
})
export class AppModule { }
