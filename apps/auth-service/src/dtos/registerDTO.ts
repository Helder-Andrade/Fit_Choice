import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString,  } from "class-validator";


export class RegisterUserDTO {
    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsNotEmpty()
    readonly password: string;
    
    @IsString()
    @IsNotEmpty()
    readonly name: string;
    
    @IsOptional()
    readonly country_code?: number;

    @IsOptional()
    readonly phone_number?: number;

    
}