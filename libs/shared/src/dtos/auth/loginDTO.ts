import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, } from "class-validator";


export class LoginDTO {

    @IsEmail()
    @IsNotEmpty()
    readonly email: string;

    @IsNotEmpty()
    readonly password: string;
}