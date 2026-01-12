import { Column, Entity, PrimaryColumn } from "typeorm";

export enum UserRole {
    CLIENT = 'CLIENT',
    GYM_OWNER = 'GYM_OWNER',
    GYM_STAFF = 'GYM_STAFF',
    ADMIN = 'ADMIN',
}

@Entity({ name: 'user_gym' })
export class User_Gym {
    @PrimaryColumn({ name: 'gym_id' })
    gymId: number;

    @PrimaryColumn({ name: 'user_id' })
    userId: number;

    @PrimaryColumn({
        name: 'role',
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @Column({ name: 'association_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    associationDate: Date;

    
}
