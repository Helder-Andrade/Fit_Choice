import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, IsEmail, IsInt, IsDecimal, IsUrl, ArrayMinSize, ArrayMaxSize } from 'class-validator';


@Entity({ name: 'gyms' })
export class Gym {
    @PrimaryGeneratedColumn()
    id: number;

    @IsString()
    @IsNotEmpty()
    @Column()
    name: string;

    @IsString()
    @IsNotEmpty()
    @Column()
    address: string;

    @IsString()
    @Column({ type: 'text'})
    description: string;

    @IsEmail()
    @IsOptional()
    @Column({ type: 'varchar', length: 255, nullable: true })
    contact_email?: string;

    @IsString()
    @IsOptional()
    @Column({
        type: 'varchar',
        length: 10,
        nullable: true,
    })
    country_code?: string | null;

    @IsString()
    @IsOptional()
    @Column({
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    phone_number?: string | null;

    @IsDecimal()
    @IsOptional()
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude?: number;

    @IsDecimal()
    @IsOptional()
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude?: number;

    @IsUrl()
    @IsOptional()
    @Column({ type: 'varchar', length: 255, nullable: true })
    website_url?: string;

    @IsUrl()
    @IsOptional()
    @Column({ type: 'varchar', length: 255, nullable: true })
    logo_url?: string;

    @IsUrl(undefined, { each: true }) 
    @ArrayMinSize(0) 
    @ArrayMaxSize(4) 
    @IsOptional()
    @Column('text', { array: true, nullable: true }) 
    images_urls?: string[];

    @Column({ type: 'boolean', default: true })
    is_Active:boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

}