import { Controller, Get } from '@nestjs/common';
import { GymServiceService } from './gym-service.service';

@Controller()
export class GymServiceController {
  constructor(private readonly gymServiceService: GymServiceService) {}

  @Get()
  getHello(): string {
    return this.gymServiceService.getHello();
  }
}
