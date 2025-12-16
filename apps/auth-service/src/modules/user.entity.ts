import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @IsEmail()
    @IsString()
    @IsNotEmpty()
    @Column({ unique: true })
    email: string;

    @IsString()
    @IsNotEmpty()
    @Column()
    password_hash: string;

    @IsString()
    @IsNotEmpty()
    @Column()
    name: string;

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

    @Column()
    is_Active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

}