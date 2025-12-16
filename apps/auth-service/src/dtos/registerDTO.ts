import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString,  } from "class-validator";
import { UserRole } from "../modules/user.entity";
import { Transform } from "class-transformer";


export class RegisterUserDTO {
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsNotEmpty()
    readonly password: string;

    @IsNotEmpty()
    @Transform(({ value }) => ("" + value).toUpperCase())
    @IsEnum(UserRole)
    readonly role: UserRole;
    
    @IsString()
    @IsNotEmpty()
    readonly name: string;
    
    @IsOptional()
    readonly country_code?: number;

    @IsOptional()
    readonly phone_number?: number;

    
}