import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Request, ForbiddenException, Logger, Inject, NotFoundException } from '@nestjs/common';
import { RegisterGymDTO } from '../../dtos/registerGymDTO';
import { UserRole } from '../../entities/user_gym.entity';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { GymSearchDto } from '../../dtos/gymSearchByDistanceDTO';
import { GymRolesGuard } from '../../entities/auth/gym-roles.guard';
import { RegisterClientDTO } from '../../dtos/registerClientDTO';
import { GymServiceService } from './gym-service.service';
import { GymUserService } from '../gym-user/gym_user.service';
import { firstValueFrom, NotFoundError } from 'rxjs';

@Controller()
export class GymServiceController {
  constructor(
    private readonly gymService: GymServiceService,
    private readonly gymUserService: GymUserService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy
  ) { }

  @MessagePattern('register_gym')
  async registerGym(data: { dto: RegisterGymDTO, userId: number }) {
    try {
      const { dto, userId } = data;
      const gym = await this.gymService.createGym(dto);

      const userValidation = await firstValueFrom(
        this.authClient.send('validate_user_exists', userId)
      );
      if (!userValidation.exists) {
        return { success: false, message: 'User does not exist' };
      }

      await this.gymUserService.associateUserToGym(gym.id, userId, UserRole.GYM_OWNER);

      return { success: true, payload: gym };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('update_gym')
  @UseGuards(GymRolesGuard)
  async updateGym(data: { dto: RegisterGymDTO, gymId: number }) {
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
