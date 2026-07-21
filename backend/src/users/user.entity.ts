import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "../common/user-role.enum";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column()
    name!: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.PLAYER })
    role!: UserRole;
}