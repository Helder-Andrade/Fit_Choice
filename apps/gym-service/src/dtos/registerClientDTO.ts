import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { UserRole } from "../entities/user_gym.entity";

export class RegisterClientDTO {
    @IsNumber()
    @IsNotEmpty()
    readonly userId: number;

    @IsEnum(UserRole)
    @IsNotEmpty()
    readonly role: UserRole = UserRole.CLIENT;

}