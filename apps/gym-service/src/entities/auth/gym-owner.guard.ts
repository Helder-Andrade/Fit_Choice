import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AbstractGymRoleGuard } from "./abstract-gym-roles.guard";
import { Repository } from "typeorm";
import { User_Gym, UserRole } from "../user_gym.entity";

@Injectable()
export class GymOwnerGuard extends AbstractGymRoleGuard {
    constructor(@InjectRepository(User_Gym) gymUserRepository: Repository<User_Gym>) {
        super(gymUserRepository, [UserRole.GYM_OWNER]);
    }
}