import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Gym } from '../../entities/gym.entity';
import { Repository } from 'typeorm';
import { getGymDTO } from '@app/shared';
import { GymSearchDto, RegisterGymDTO } from '@app/shared';
import { GymUserService } from '../gym-user/gym_user.service';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class GymServiceService {

  constructor(
    @InjectRepository(Gym)
    private gymRepository: Repository<Gym>,
    private readonly gymUserService: GymUserService,
  ) { }

  async createGym(dto: RegisterGymDTO) {
    const { latitude, longitude, ...rest } = dto;

    const exists = await this.gymRepository.findOneBy({
      name: dto.name,
      address: dto.address
    });

    if (exists) {
      throw new UnauthorizedException('Already registered a gym with this name and address');
    }

    // Create a clean object that explicitly matches the Gym Entity structure
    const gymData: Partial<Gym> = {
      ...rest,
      location: {
        type: 'Point',
        coordinates: [longitude ? longitude : 0, latitude ? latitude : 0],
      },
      is_Active: true,
    };

    const newGym = this.gymRepository.create(gymData);
    return await this.gymRepository.save(newGym);
  }

  async updateGym(dto: RegisterGymDTO, gymId: number) {
    const gym = await this.gymRepository.findOneBy({ id: gymId });

    if (!gym) {
      throw new RpcException({
        message: 'Gym with ID ${gymId} not found',
        status: 404
      });
    }


    const updatedGym = this.gymRepository.merge(gym, dto);

    return await this.gymRepository.save(updatedGym);
  }

  async remove(id: number, userId: number) {

    const gym = await this.gymRepository.findOne({ where: { id } });

    if (!gym) throw new Error('Gym not found');

    await this.gymRepository.delete(id);
    const res = await this.gymUserService.removeGymRoles(id);

    if (res.success !== true) {
      throw new RpcException({
        message: 'Failed to remove associated user roles for the gym',
        status: 500
      });
    }
    return { success: true };
  }


  async getGymById(gymId: number): Promise<getGymDTO> {
    const gym = await this.gymRepository.findOneBy({ id: gymId });
    if (!gym) {
      throw new RpcException({
        message: 'Gym not found',
        status: 404
      });
    }
    return new getGymDTO(gym);
  }
  async getGyms(): Promise<getGymDTO[]> {
    try {
      const gyms = await this.gymRepository.find({
        select: ['id', 'name', 'address', 'location'],
      });
      return gyms.map(gym => new getGymDTO(gym));
    } catch (error) {
      throw new RpcException({
        message: 'Error fetching gyms',
        status: 500
      });
    }

  }

  async getGymsByLocation(searchDto: GymSearchDto): Promise<getGymDTO[]> {
    const { latitude, longitude, distanceKm = 25 } = searchDto;
    const distanceMeters = distanceKm * 1000;

    const { entities, raw } = await this.gymRepository
      .createQueryBuilder('gym')
      .addSelect(
        `ST_Distance(gym.location, ST_SetSRID(ST_Point(:lng, :lat), 4326))`,
        'distance'
      )
      .where(
        `ST_DWithin(gym.location, ST_SetSRID(ST_Point(:lng, :lat), 4326), :dist)`,
        { lng: longitude, lat: latitude, dist: distanceMeters }
      )
      .orderBy('distance', 'ASC')
      .getRawAndEntities();

    return entities.map((gym, index) => {
      const distValue = parseFloat(raw[index].distance);
      return new getGymDTO({
        ...gym,
        distance: distValue
      });
    });
  }


  async updateGymMedia(gymId: number, logoUrl?: string, imagesUrls?: string[]) {
    const gym = await this.gymRepository.findOneBy({ id: gymId });

    if (!gym) {
      throw new RpcException({
        message: `Gym with ID ${gymId} not found`,
        status: 404
      });
    }

    // Update logo if a new URL is provided
    if (logoUrl !== undefined) {
      gym.logo_url = logoUrl;
    }

    // Update images if new URLs are provided
    if (imagesUrls !== undefined && imagesUrls.length > 0) {
      // Replaces the existing list with the new one
      gym.images_urls = imagesUrls;
    }

    return await this.gymRepository.save(gym);
  }

  async removeLogo(gymId: number, userId: number) {
    // 1. Find the gym (and verify ownership if needed)
    const gym = await this.gymRepository.findOne({ where: { id: gymId } });

    if (!gym) {
      return { success: false, message: 'Gym not found' };
    }

    // 2. Check ownership (or use your Guard at the controller level)
    

    const oldUrl = gym.logo_url;

    // 3. Update DB
    gym.logo_url = '';
    await this.gymRepository.save(gym);

    // 4. Return the old URL so the Portal knows what to delete from R2
    return { success: true, message: 'Logo removed', deletedUrl: oldUrl };
  }

  async removeGalleryImage(gymId: number, imageUrl: string, userId: number) {
    const gym = await this.gymRepository.findOne({ where: { id: gymId } });

    if (!gym) return { success: false, message: 'Gym not found' };

    // 1. Filter out the image
    // Assuming images_urls is a simple string array (json/simple-array type)
    if (gym.images_urls && gym.images_urls.includes(imageUrl)) {
      gym.images_urls = gym.images_urls.filter(url => url !== imageUrl);

      await this.gymRepository.save(gym);
      return { success: true, message: 'Image deleted' };
    }

    return { success: false, message: 'Image not found in gallery' };
  }
}