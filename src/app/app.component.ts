import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { DbTaskService } from './services/dbtask.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(
    private db: DbTaskService,
    private router: Router,
    private menu: MenuController
  ) {}

  /** Cierra sesión: marca active = 0 y navega a /login */
  async logout() {
    /* 1. aseguramos init */
    await this.db.init();

    /* 2. extraemos el usuario almacenado en Storage */
    const ses = await this.db['storage'].get('session');
    const user = ses?.user;

    /* 3. lo marcamos inactivo en BD + Storage */
    if (user) {
      await this.db.actualizarSesion(user, 0);
    } else {
      /* por si no hubiese clave session */
      await this.db['storage'].remove('session');
    }

    /* 4. cerramos menú y navegamos a /login */
    await this.menu.close();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
