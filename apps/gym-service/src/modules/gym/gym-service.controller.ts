import { Controller, UseGuards, Logger, Inject } from '@nestjs/common';
import { UserRole } from '@app/shared';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { GymSearchDto, RegisterGymDTO } from '@app/shared';
import { GymStaffGuard } from '../../guards/gym-roles.guard';
import { GymServiceService } from './gym-service.service';
import { GymUserService } from '../gym-user/gym_user.service';
import { firstValueFrom } from 'rxjs';
import { GymOwnerGuard } from '../../guards/gym-owner.guard';

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


  @MessagePattern('delete_gym')
  @UseGuards(GymOwnerGuard)
  async deleteGym(@Payload() data: { gymId: number, userId: number }) {
    try {
      return await this.gymService.remove(data.gymId, data.userId);
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('update_gym')
  @UseGuards(GymStaffGuard)
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
      return { success: false, message: error.message, status: error.status };
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



  @MessagePattern('update_gym_media')
  async updateGymMedia(data: { gymId: number, logo_url?: string, images_urls?: string[] }) {
    try {
      const gym = await this.gymService.updateGymMedia(data.gymId, data.logo_url, data.images_urls);
      return { success: true, payload: gym };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @MessagePattern('delete_gym_logo')
  @UseGuards(GymOwnerGuard)
  async deleteLogo(@Payload() data: { gymId: number, userId: number }) {
    return this.gymService.removeLogo(data.gymId, data.userId);
  }

  @MessagePattern('delete_gym_gallery_image')
  @UseGuards(GymOwnerGuard)
  async deleteGalleryImage(@Payload() data: { gymId: number, imageUrl: string, userId: number }) {
    return this.gymService.removeGalleryImage(data.gymId, data.imageUrl, data.userId);
  }
}
