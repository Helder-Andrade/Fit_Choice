import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { UserRole } from "@app/shared";

export class RegisterClientDTO {
    @IsNumber()
    @IsNotEmpty()
    readonly userId: number;

    @IsEnum(UserRole)
    @IsNotEmpty()
    readonly role: UserRole = UserRole.CLIENT;

}