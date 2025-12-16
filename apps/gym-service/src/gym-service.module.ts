import { Module } from '@nestjs/common';
import { GymServiceController } from './gym-service.controller';
import { GymServiceService } from './gym-service.service';

@Module({
  imports: [],
  controllers: [GymServiceController],
  providers: [GymServiceService],
})
export class GymServiceModule {}
