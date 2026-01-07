import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, ForbiddenException, Logger } from '@nestjs/common';
import { GymServiceService } from './gym-service.service';
import { RegisterGymDTO } from './dtos/registerGymDTO';
import { UserRole } from './modules/user_gym.entity';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GymSearchDto } from './dtos/gymSearchByDistanceDTO';
import { GymRolesGuard } from './modules/auth/gym-roles.guard';

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

  @MessagePattern('update_gym')
  @UseGuards(GymRolesGuard)
  async updateGym(data: { dto: RegisterGymDTO, gymId:number }){
    try {
      const gym = await this.gymService.updateGym(data.dto, data.gymId);
      return { success: true, payload: gym };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('get_gym_by_id')
  async getGymById(id: number) {
    try {
      const gym = await this.gymService.getGymById(id);
      return { success: true, payload: gym };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('get_all_gyms')
  async getAllGyms() {
    try {
      Logger.log('GymServiceController getAllGyms');
      const gyms = await this.gymService.getGyms();

      return { success: true, payload: gyms };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('search_gyms_by_location')
  async searchGyms(@Payload() data: GymSearchDto) {
    try {
      const gyms = await this.gymService.getGymsByLocation(data);
      return { success: true, payload: gyms };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
