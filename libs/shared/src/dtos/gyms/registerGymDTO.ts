import { ArrayMaxSize, ArrayMinSize, IsDecimal, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, Max, MaxLength, maxLength, Min, } from "class-validator";
import { UserRole } from "@app/shared";
import { Type } from "class-transformer";

export class RegisterGymDTO {

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    @IsNotEmpty()
    readonly address: string;

    @IsString()
    readonly description: string;

    @IsEmail()
    @IsOptional()
    readonly contact_email?: string;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    readonly country_code?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(20)
    readonly phone_number?: string | null;

    @IsNumber() 
    @Type(() => Number) 
    @Min(-90)
    @Max(90)
    @IsOptional()
    readonly latitude?: number;

    @IsNumber()
    @Type(() => Number)
    @Min(-180)
    @Max(180)
    @IsOptional()
    readonly longitude?: number;

    @IsUrl()
    @IsOptional()
    @MaxLength(255)
    readonly website_url?: string;

    @IsUrl()
    @IsOptional()
    @MaxLength(255)
    readonly logo_url?: string;

    @IsUrl(undefined, { each: true })
    @ArrayMinSize(0)
    @ArrayMaxSize(4)
    @IsOptional()
    readonly images_urls?: string[];

    @IsOptional()
    @IsEnum(UserRole)
    readonly role: UserRole = UserRole.GYM_OWNER;
}