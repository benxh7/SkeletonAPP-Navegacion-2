import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DbTaskService } from '../../services/dbtask.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {

  loginForm = this.fb.nonNullable.group({
    user: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]{3,8}$')]],
    pin: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private db: DbTaskService, 
  ) { }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    const { user, pin } = this.loginForm.getRawValue();

    /* 1. nos aseguramos de que Storage/SQLite estén listos */
    await this.db. inicioDB();

    /* 2. ¿El usuario ya existe en la BD? */
    const existe = await this.db.validarUsuario(user, pin);

    if (existe) {
      // 🟢 Usuario conocido ⇒ lo marcamos activo
      await this.db.actualizarSesion(user, 1);
    } else {
      // 🆕 Usuario nuevo ⇒ lo registramos y lo dejamos activo
      await this.db.registrarSesion(user, pin);
    }

    /* 3. Ahora sí, ruta protegida /home pasará el guard */
    this.router.navigate(['/home'], { state: { username: user } });
  }

  ngOnInit() {
  }

}
