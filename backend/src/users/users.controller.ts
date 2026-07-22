import { Controller, Get, Param, ParseIntPipe, ParseUUIDPipe } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller('users')
export class UserController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get(':id')
    findById(@Param('id', ParseUUIDPipe) id: number) {
        return this.usersService.findById(id);
    }
}