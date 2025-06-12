import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { DbTaskService } from '../services/dbtask.service';

export const AuthGuard: CanActivateFn = async (route, state) => {
  // Importamos el servicio de base de datos y el router
  // para poder verificar la sesión del usuario.
  const db = inject(DbTaskService);
  const router = inject(Router);

  // Aqui nos aseguramos de que la base de datos esté inicializada
  // y que las tablas necesarias estén creadas.
  await db.init();

  // Verificamos si hay una sesion activa
  // Esto devuelve true si hay una sesión activa y false si no.
  const active = await db.sesionActiva();

  // Si no tenemos una sesion activa, redirigimos al usuario a la pagina de login.
  // Esto es importante para proteger las rutas que requieren autenticación.
  if (!active) {
    router.navigate(['/login']);
  }

  // Devolvemos true si puede pasar y false si no
  return active;
};