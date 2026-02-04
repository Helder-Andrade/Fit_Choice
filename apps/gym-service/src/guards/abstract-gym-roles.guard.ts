import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User_Gym } from "../entities/user_gym.entity"
import { UserRole } from "@app/shared";
import { Repository } from "typeorm";
import { RpcException } from "@nestjs/microservices";

@Injectable()
export abstract class AbstractGymRoleGuard implements CanActivate {
    constructor(
        @InjectRepository(User_Gym)
        protected gymUserRepository: Repository<User_Gym>,
        private readonly allowedRoles: UserRole[],
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const data = context.switchToRpc().getData();
        const userId = data.userId;
        const gymId = data.gymId;

        if (!userId || !gymId) {
            throw new RpcException({ message: 'Unauthorized: Missing IDs', status: 401 });
        }

        const userGymRelation = await this.gymUserRepository.findOne({
            where: { userId, gymId: Number(gymId) }
        });

        if (!userGymRelation || !this.allowedRoles.includes(userGymRelation.role as UserRole)) {
            throw new RpcException({ message: 'Forbidden: Insufficient permissions', status: 403 });
        }

        return true;
    }
}