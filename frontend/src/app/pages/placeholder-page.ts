import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  template: `
    <section class="route-placeholder" aria-label="Sledeci ekran">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p>Ovo je samo placeholder.</p>
    </section>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = this.route.snapshot.data['title'];
  protected readonly eyebrow = this.route.snapshot.data['eyebrow'];
}
