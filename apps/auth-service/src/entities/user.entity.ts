import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;


    @Column({ unique: true })
    email: string;

    @Column()
    password_hash: string;


    @Column()
    name: string;

    @Column({
        type: 'varchar',
        length: 10,
        nullable: true,
    })
    country_code?: string | null;

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