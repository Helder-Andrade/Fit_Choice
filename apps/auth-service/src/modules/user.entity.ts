import { Cipher } from 'crypto';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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
        type: 'int',
        nullable: true,
    })
    country_code: number | null;

    @Column({
        type: 'int',
        nullable: true,
    })
    phone_number: number | null;

    @Column()
    is_Active: boolean;

}