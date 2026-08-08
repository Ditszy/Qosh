import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiUrlService } from '../../core/api';
import type { PublicUser } from '../public/tournaments/tournament.models';

export type OfficialRole = 'SCORER' | 'REFEREE';
export type OfficialUser = PublicUser & { role: OfficialRole };

export type OfficialSearchOptions = {
  role?: OfficialRole;
};

@Injectable({
  providedIn: 'root',
})
export class OfficialsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService);

  searchOfficials(query: string, options: OfficialSearchOptions = {}): Observable<OfficialUser[]> {
    let params = new HttpParams().set('q', query);

    if (options.role) {
      params = params.set('role', options.role);
    }

    return this.http.get<OfficialUser[]>(this.apiUrl.build('/users/officials'), { params });
  }

  searchScorers(query: string): Observable<OfficialUser[]> {
    return this.searchOfficials(query, { role: 'SCORER' });
  }

  searchReferees(query: string): Observable<OfficialUser[]> {
    return this.searchOfficials(query, { role: 'REFEREE' });
  }
}
