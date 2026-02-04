import { Injectable, Logger, UnauthorizedException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User_Gym} from '../../entities/user_gym.entity'
import { UserRole } from '@app/shared';
import { Repository } from 'typeorm';
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
                role: role,
            });
            return await this.gymUserRepository.save(newAssociation);
        } catch (dbError) {
            throw new RpcException({
                message: `Database error: ${dbError.message}`,
                status: 500
            });
        }
    }

    async removeSpecificRole(gymId: number, userId: number, role: UserRole) {
        const result = await this.gymUserRepository.delete({
            gymId: gymId,
            userId: userId,
            role: role
        });

        if (result.affected === 0) {
            throw new RpcException({
                message: `User does not have the role '${role}' at this gym`,
                status: 404
            });
        }

        return { success: true };
    }

    /**
    * Deletes all user-gym associations for a specific gym.
    * Usually called as part of a cascading delete or a manual gym removal process.
    */
    async removeGymRoles(gymId: number): Promise<{success: boolean}> {
        Logger.log(`Removing all user roles for Gym ID ${gymId}`);

        try {
            const result = await this.gymUserRepository.delete({ gymId: gymId });

            Logger.log(`Successfully removed ${result.affected} role associations for Gym ID ${gymId}`);

            return { success: true };
        } catch (error) {
            throw new RpcException({
                message: `Failed to remove gym roles: ${error.message}`,
                status: 500
            });
        }
    }


    /**
     * Get all staff/members for a specific gym
     */
    async getGymMembers(gymId: number) {
        const members = await this.gymUserRepository.find({
            where: { gymId: gymId }
        });

        if (!members.length) {
            return [];
        }

        // Optional: Call Auth service here to get names/emails for these user IDs
        return members;
    }

    /**
     * Get all gyms a specific user belongs to
     */
    async getUserMemberships(userId: number) {
        return await this.gymUserRepository.find({
            where: { userId: userId, role: UserRole.CLIENT }
        });
    }

    /**
     * Check if a user has a specific role
     */
    async getUserRolesAtGym(gymId: number, userId: number): Promise<UserRole[]> {
        const relations = await this.gymUserRepository.find({
            where: {
                gymId: gymId,
                userId: userId
            }
        });

        // Map the database entities to just the role strings
        return relations.map(rel => rel.role);
    }




}

