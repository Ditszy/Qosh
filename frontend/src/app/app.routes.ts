import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/auth.guards';
import { UserRole } from './core/auth/auth';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { TournamentDetail } from './features/public/tournaments/tournament-detail/tournament-detail';
import { TournamentList } from './features/public/tournaments/tournament-list/tournament-list';
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
  page('live', 'Mecevi uzivo', 'SSE tokovi'),
  page('rankings', 'Rang lista', 'Statistika'),
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  rolePage('my-team', 'Moj tim', 'Igrac', ['PLAYER']),
  rolePage('organizer', 'Organizator', 'Kontrola turnira', ['ORGANIZER', 'ADMIN']),
  rolePage('scorer', 'Zapisnicar', 'Live scoring', ['SCORER', 'ADMIN']),
  rolePage('reports', 'Izvestaji', 'Sudija', ['REFEREE', 'ADMIN']),
  rolePage('admin', 'Admin', 'Korisnici', ['ADMIN']),
];
