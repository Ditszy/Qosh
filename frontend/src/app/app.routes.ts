import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/auth.guards';
import { UserRole } from './core/auth/auth';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { OrganizerDashboard } from './features/organizer/organizer-dashboard/organizer-dashboard';
import { MyTeam } from './features/player/my-team/my-team';
import { LiveMatch } from './features/public/live-match/live-match/live-match';
import { TournamentDetail } from './features/public/tournaments/tournament-detail/tournament-detail';
import { TournamentList } from './features/public/tournaments/tournament-list/tournament-list';
import { RefereeReports } from './features/referee/referee-reports/referee-reports';
import { ScorerConsole } from './features/scorer/scorer-console/scorer-console';
import { PlayerProfile } from './features/statistics/player-profile/player-profile';
import { Rankings } from './features/statistics/rankings/rankings';
import { PlaceholderPage } from './pages/placeholder-page';

const page = (path: string, title: string, eyebrow: string): Routes[number] => ({
  path,
  component: PlaceholderPage,
  data: { title, eyebrow },
});

const rolePage = (path: string, title: string, eyebrow: string, roles: UserRole[]): Routes[number] => ({
  ...page(path, title, eyebrow),
  canActivate: [roleGuard],
  data: { title, eyebrow, roles },
});

export const routes: Routes = [
  { path: 'tournaments', component: TournamentList },
  { path: 'tournaments/:id', component: TournamentDetail },
  { path: 'matches/:id/live', component: LiveMatch },
  page('live', 'Mecevi uzivo', 'SSE tokovi'),
  { path: 'rankings', component: Rankings },
  { path: 'profiles/:id', component: PlayerProfile },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'my-team', component: MyTeam, canActivate: [roleGuard], data: { roles: ['PLAYER'] } },
  { path: 'organizer', component: OrganizerDashboard, canActivate: [roleGuard], data: { roles: ['ORGANIZER', 'ADMIN'] } },
  { path: 'scorer', component: ScorerConsole, canActivate: [roleGuard], data: { roles: ['SCORER', 'ADMIN'] } },
  { path: 'reports/:matchId', component: RefereeReports, canActivate: [roleGuard], data: { roles: ['REFEREE', 'ADMIN'] } },
  { path: 'reports', component: RefereeReports, canActivate: [roleGuard], data: { roles: ['REFEREE', 'ADMIN'] } },
  rolePage('admin', 'Admin', 'Korisnici', ['ADMIN']),
];
