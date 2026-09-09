import { publicUserSelect } from '../../users/users.service';

export const teamInviteInclude = () => ({
    invitedUser: {
        select: publicUserSelect,
    },
    inviter: {
        select: publicUserSelect,
    },
});

export const teamInviteWithTeamInclude = () => ({
    ...teamInviteInclude(),
    team: {
        include: {
            tournament: true,
        },
    },
});
