import { Injectable, Logger, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Gym } from '../../entities/gym.entity';
import { User_Gym, UserRole } from '../../entities/user_gym.entity'
import { Repository } from 'typeorm';
import { getGymDTO } from '../../dtos/getGymDTO';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GymUserService {
    constructor(
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
        @InjectRepository(User_Gym)
        private gymUserRepository: Repository<User_Gym>,
    ) { }

    async associateUserToGym(gymId: number, userId: number, role: UserRole) {
        Logger.log(`Associating User ID ${userId} with Gym ID ${gymId} as Role ${role}`);
        let userValidation;
        try {
            userValidation = await firstValueFrom(
                this.authClient.send('validate_user_exists', userId)
            );
        } catch (err) {
            throw new RpcException({
                message: `Auth Service communication failed: ${err.message}`,
                status: 503
            });
        }

        if (!userValidation || !userValidation.exists) {
            throw new RpcException({
                message: 'User does not exist in Auth database',
                status: 404
            });
        }

        try {
            const newAssociation = this.gymUserRepository.create({
                gymId: gymId,
                userId: userId,
                role:role,
            });
            return await this.gymUserRepository.save(newAssociation);
        } catch (dbError) {
            throw new RpcException({
                message: `Database error: ${dbError.message}`,
                status: 500
            });
        }
    }


}