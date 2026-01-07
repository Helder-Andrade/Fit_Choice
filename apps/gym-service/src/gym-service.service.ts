import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RegisterGymDTO } from './dtos/registerGymDTO';
import { InjectRepository } from '@nestjs/typeorm';
import { Gym } from './modules/gym.entity';
import { User_Gym, UserRole } from './modules/user_gym.entity'
import { Repository } from 'typeorm';
import { getGymDTO } from './dtos/getGymDTO';
import { GymSearchDto } from './dtos/gymSearchByDistanceDTO';

@Injectable()
export class GymServiceService {
  constructor(
    @InjectRepository(Gym)
    private gymRepository: Repository<Gym>,
    @InjectRepository(User_Gym)
    private gymUserRepository: Repository<User_Gym>,
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
        throw new NotFoundException(`Gym with ID ${gymId} not found`);
    }

    
    const updatedGym = this.gymRepository.merge(gym, dto);

    return await this.gymRepository.save(updatedGym);
}


  async getGymById(gymId: number): Promise<getGymDTO> {
    const gym = await this.gymRepository.findOneBy({ id: gymId });
    if (!gym) {
      throw new NotFoundException('Gym not found');
    }
    return this.mapToGetGymDTO(gym);
  }

  async getGyms(): Promise<getGymDTO[]> {
    const gyms = await this.gymRepository.find();
    return gyms.map((gym) => this.mapToGetGymDTO(gym));
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
      return this.mapToGetGymDTO(gym, distValue);
    });
  }

  async associateUserToGym(gymId: number, userId: number, role: UserRole) {
    const newAssociation = this.gymUserRepository.create({
      gymId,
      userId,
      role: role,
    });
    return await this.gymUserRepository.save(newAssociation);
  }






  // Helper method to map Entity to DTO since we now have to extract coords from Point
  private mapToGetGymDTO(gym: Gym, distance?: number): getGymDTO {
    return new getGymDTO({
      name: gym.name,
      address: gym.address,
      description: gym.description,
      contact_email: gym.contact_email,
      country_code: gym.country_code,
      phone_number: gym.phone_number,
      // Extract coordinates: [0] is Longitude, [1] is Latitude
      longitude: gym.location.coordinates[0],
      latitude: gym.location.coordinates[1],
      website_url: gym.website_url,
      logo_url: gym.logo_url,
      images_urls: gym.images_urls,
      distance: distance ? Math.round(distance) : undefined,
    });
  }
}