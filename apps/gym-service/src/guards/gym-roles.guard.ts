import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User_Gym } from "../entities/user_gym.entity";
import { UserRole } from "@app/shared";
import { AbstractGymRoleGuard } from "./abstract-gym-roles.guard";

@Injectable()
export class GymStaffGuard extends AbstractGymRoleGuard {
    constructor(@InjectRepository(User_Gym) gymUserRepository: Repository<User_Gym>) {
        super(gymUserRepository, [UserRole.GYM_OWNER, UserRole.GYM_STAFF]);
    }
}