import { Controller, Get, Param, Patch, Request, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../common/user-role.enum';
import { NotificationsService } from './notifications.service';

type AuthenticatedRequest = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findMine(@Request() req: AuthenticatedRequest) {
        return this.notificationsService.findForUser(req.user.id);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Sse('live')
    watchLive(@Request() req: AuthenticatedRequest) {
        return this.notificationsService.watchForUser(req.user.id);
    }
}
