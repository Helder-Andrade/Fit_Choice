import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsEmail,
    IsUrl,
    ArrayMinSize,
    ArrayMaxSize,
    MaxLength,
    IsNumber
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';

export class getGymDTO {
    constructor(partial: Partial<getGymDTO>) {
        Object.assign(this, partial);
    }

    @Expose()
    @IsNumber()
    readonly id: number;

    @Expose()
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @Expose()
    @IsString()
    @IsNotEmpty()
    readonly address: string;

    @Expose()
    @IsString()
    readonly description: string;

    @Expose()
    @IsEmail()
    @IsOptional()
    readonly contact_email?: string;

    @Expose()
    @IsString()
    @IsOptional()
    @MaxLength(10)
    readonly country_code?: string | null;

    @Expose()
    @IsString()
    @IsOptional()
    @MaxLength(20)
    readonly phone_number?: string | null;

    @Expose()
    @Transform(({ obj }) => obj.location?.coordinates[1])
    readonly latitude: number;

    @Expose()
    @Transform(({ obj }) => obj.location?.coordinates[0])
    readonly longitude: number;


    @Expose()
    @IsUrl()
    @IsOptional()
    @MaxLength(255)
    readonly website_url?: string;

    @Expose()
    @IsUrl()
    @IsOptional()
    @MaxLength(255)
    readonly logo_url?: string;

    @Expose()
    @IsUrl(undefined, { each: true })
    @ArrayMinSize(0)
    @ArrayMaxSize(4)
    @IsOptional()
    readonly images_urls?: string[];

    @Expose()
    @IsOptional()
    @IsNumber()
    readonly distance?: number; // Distance in meters
}