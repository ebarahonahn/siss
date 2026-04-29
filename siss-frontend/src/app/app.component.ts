import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs';
import { NotificationComponent } from './core/components/notification/notification.component';
import { InactivityService } from './core/services/inactivity.service';
import { LoginImagesService } from './core/services/login-images.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private inactivitySvc = inject(InactivityService);
  private titleService = inject(Title);
  private router = inject(Router);
  private configSvc = inject(LoginImagesService);

  private systemSiglas = 'SISS';

  constructor() {
    this.loadSystemConfig();
    this.setupTitleUpdate();
  }

  private loadSystemConfig() {
    this.configSvc.getConfig().subscribe({
      next: (config) => {
        if (config?.siglasSistema) {
          this.systemSiglas = config.siglasSistema;
          // Actualizar título actual si ya cargó una ruta
          const currentTitle = this.titleService.getTitle().split(' | ')[0];
          this.titleService.setTitle(`${currentTitle} | ${this.systemSiglas}`);
        }
      }
    });
  }

  private setupTitleUpdate() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let route = this.router.routerState.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.snapshot.data['title'] || this.systemSiglas;
      })
    ).subscribe((title: string) => {
      this.titleService.setTitle(`${title} | ${this.systemSiglas}`);
    });
  }
}
