import { Component, computed, inject, input } from '@angular/core';

import { ApiUrlService } from '../../../../core/api';

@Component({
  selector: 'app-player-profile-avatar',
  imports: [],
  templateUrl: './player-profile-avatar.html',
  styleUrl: './player-profile-avatar.scss',
})
export class PlayerProfileAvatar {
  private readonly apiUrl = inject(ApiUrlService);

  readonly imageUrl = input<string | null | undefined>(null);
  readonly alt = input('Profilna slika');

  protected readonly resolvedImageUrl = computed(() => this.apiUrl.buildAssetUrl(this.imageUrl()));
}
