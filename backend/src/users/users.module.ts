import { Module } from "@nestjs/common";
import { UserController, UserSelfController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
    controllers: [UserSelfController, UserController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
