import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, ForbiddenException, Logger } from '@nestjs/common';
import { GymServiceService } from './gym-service.service';
import { RegisterGymDTO } from './dtos/registerGymDTO';
import { UserRole } from './modules/user_gym.entity';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class GymServiceController {
  constructor(private readonly gymService: GymServiceService) { }

  @MessagePattern('register_gym')
  async registerGym(data: { dto: RegisterGymDTO, userId: number }) {
    try {
      const { dto, userId } = data;

      const gym = await this.gymService.createGym(dto);
      await this.gymService.associateUserToGym(gym.id, userId, UserRole.GYM_OWNER);

      return { success: true, payload: gym };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('get_gym_by_id')
  async getGymById(gymId: number) {
    try {
      Logger.log('GymServiceController', gymId)
      const gym = await this.gymService.getGymById(gymId);
      Logger.log(gym)

      return { success: true, payload: gym };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
