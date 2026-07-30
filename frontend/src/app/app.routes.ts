import { Routes } from '@angular/router';
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
  page('login', 'Prijava', 'Autentifikacija'),
  page('register', 'Registracija', 'Novi igrac'),
  page('my-team', 'Moj tim', 'Igrac'),
  page('organizer', 'Organizator', 'Kontrola turnira'),
  page('scorer', 'Zapisnicar', 'Live scoring'),
  page('reports', 'Izvestaji', 'Sudija'),
  page('admin', 'Admin', 'Korisnici'),
];
