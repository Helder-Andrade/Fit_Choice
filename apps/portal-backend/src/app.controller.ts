import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDTO } from '@app/shared/dtos/auth/loginDTO';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

}
