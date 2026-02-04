import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AbstractGymRoleGuard } from "./abstract-gym-roles.guard";
import { Repository } from "typeorm";
import { User_Gym} from "../entities/user_gym.entity";
import { UserRole } from "@app/shared";

@Injectable()
export class GymOwnerGuard extends AbstractGymRoleGuard {
    constructor(@InjectRepository(User_Gym) gymUserRepository: Repository<User_Gym>) {
        super(gymUserRepository, [UserRole.GYM_OWNER]);
    }
}