import { IsNotEmpty, IsString, IsOptional, IsEmail, IsInt, IsDecimal, IsUrl, ArrayMinSize, ArrayMaxSize, MaxLength } from 'class-validator';


export class getGymDTO {
    //constructor(name: string, address: string, description: string, contact_email?: string, country_code?: string | null, phone_number?: string | null, latitude?: number, longitude?: number, website_url?: string, logo_url?: string, images_urls?: string[]) {}

    constructor(partial: Partial<getGymDTO>){
        Object.assign(this, partial);
    }

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

    @IsDecimal()
    @IsOptional()
    readonly latitude?: number;

    @IsDecimal()
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
    readonly distance?: number; // Distance in meters

}