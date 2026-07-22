import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "../common/user-role.enum";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ unique: true })
    username!: string;

    @Column({ select: false })
    password!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.PLAYER })
    role!: UserRole;
}
