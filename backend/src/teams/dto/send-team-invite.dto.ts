import { IsUUID } from 'class-validator';

export class SendTeamInviteDto {
    @IsUUID()
    invitedUserId!: string;
}
