import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { RegisterGymDTO } from './dtos/registerGymDTO';
import { InjectRepository } from '@nestjs/typeorm';
import { Gym } from './modules/gym.entity';
import { User_Gym, UserRole } from './modules/user_gym.entity'

import { Repository } from 'typeorm';
import { getGymDTO } from './dtos/getGymDTO';

@Injectable()
export class GymServiceService {

  constructor(
    @InjectRepository(Gym)
    private gymRepository: Repository<Gym>,
    @InjectRepository(User_Gym)
    private gymUserRepository: Repository<User_Gym>,
  ) { }

  async createGym(RegisterGymDTO: RegisterGymDTO) {
    const { name, address, description, contact_email, country_code, phone_number, latitude, longitude, website_url, logo_url, images_urls } = RegisterGymDTO;

    const exists = await this.gymRepository.findOneBy({ name, address });
    if (exists) {
      throw new UnauthorizedException('Already registered a gym with this name and address');
    }

    const newGym = this.gymRepository.create({
      name,
      address,
      description,
      contact_email,
      country_code,
      phone_number,
      latitude,
      longitude,
      website_url,
      logo_url,
      images_urls,
      is_Active: true,
    })

    return await this.gymRepository.save(newGym);
  }

  async associateUserToGym(gymId: number, userId: number, role: UserRole) {

    const newAssociation = this.gymUserRepository.create({
      gymId,
      userId,
      role: role,
    });

    return await this.gymUserRepository.save(newAssociation);
  }

  async getGymById(gymId: number): Promise<getGymDTO> {
    const gym = await this.gymRepository.findOneBy({ id: gymId });
    if (!gym) {
      throw new UnauthorizedException('Gym not found');
    }

    Logger.log('Gym found:', gym);

    return new getGymDTO({
      name: gym.name,
      address: gym.address,
      description: gym.description,
      contact_email: gym.contact_email,
      country_code: gym.country_code,
      phone_number: gym.phone_number,
      latitude: gym.latitude,
      longitude: gym.longitude,
      website_url: gym.website_url,
      logo_url: gym.logo_url,
      images_urls: gym.images_urls,
    });

  }


}
