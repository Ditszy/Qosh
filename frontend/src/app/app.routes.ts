import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { PlaceholderPage } from './pages/placeholder-page';

const page = (path: string, title: string, eyebrow: string): Routes[number] => ({
  path,
  component: PlaceholderPage,
  data: { title, eyebrow },
});

export const routes: Routes = [
  page('tournaments', 'Turniri', 'Javni pregled'),
  page('live', 'Mecevi uzivo', 'SSE tokovi'),
  page('rankings', 'Rang lista', 'Statistika'),
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  page('my-team', 'Moj tim', 'Igrac'),
  page('organizer', 'Organizator', 'Kontrola turnira'),
  page('scorer', 'Zapisnicar', 'Live scoring'),
  page('reports', 'Izvestaji', 'Sudija'),
  page('admin', 'Admin', 'Korisnici'),
];
