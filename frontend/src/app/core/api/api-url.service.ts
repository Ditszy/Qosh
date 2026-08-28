import { inject, Injectable } from '@angular/core';

import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root',
})
export class ApiUrlService {
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly defaultProfileImagePath = '/uploads/profile-images/default.jpg';

  build(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${this.baseUrl}${normalizedPath}`;
  }

  buildAssetUrl(path: string | null | undefined): string {
    const normalizedPath = path?.trim() || this.defaultProfileImagePath;

    if (normalizedPath.startsWith('/uploads/')) {
      return this.build(normalizedPath);
    }

    return normalizedPath;
  }
}
