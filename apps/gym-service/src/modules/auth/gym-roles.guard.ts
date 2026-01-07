import { CanActivate, ExecutionContext, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User_Gym } from "../user_gym.entity";
import { UserRole } from "../user_gym.entity";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export class GymRolesGuard implements CanActivate {
    constructor(
        @InjectRepository(User_Gym)
        private gymUserRepository: Repository<User_Gym>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const data = context.switchToRpc().getData();
        Logger.log('Received Data:', data);

        const userId = data.userId;
        const gymId = data.gymId;

        if (!userId || !gymId) {
            throw new RpcException({
                message: 'Unauthorized: Missing User ID or Gym ID',
                status: 401
            });
        }

        const userGymRelation = await this.gymUserRepository.findOne({
            where: { userId, gymId: Number(gymId) }
        });

        const allowedRoles = [UserRole.GYM_OWNER, UserRole.GYM_STAFF];

        if (!userGymRelation || !allowedRoles.includes(userGymRelation.role)) {
            throw new RpcException({ message: 'Forbidden: You do not have permission', status: 403 });
        }

        return true;
    }
}