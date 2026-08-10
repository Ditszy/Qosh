import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { UserRole } from "../common/user-role.enum";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CreateUserDto } from "./dto/create-user.dto";

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UserController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @Get('stats')
    getStats() {
        return this.usersService.getStats();
    }

    @Get('players/search')
    @Roles(UserRole.PLAYER, UserRole.ADMIN)
    searchPlayers(@Query('q') query = '') {
        return this.usersService.searchPlayers(query);
    }

    @Get('officials')
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    findOfficials(@Query('q') query = '', @Query('role') role?: UserRole) {
        return this.usersService.findOfficials(query, role);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post('create')
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createByAdmin(createUserDto);
    }
}
