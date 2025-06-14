<a name="readme-top"></a>

<div align="center">

## Aplicacion Mobil SqueletonAPP

SkeletonAPP es una aplicación híbrida desarrollada con Ionic y Angular que permite a los usuarios iniciar sesión y completar un formulario de información adicional. Incluye validaciones, animaciones en campos de entrada y un selector de fecha basado en Angular Material. Tambien contamos con SQLite para el guardado de datos.

</div>

## Características principales

- **Pantalla de login**: Con validación de usuario (3–8 caracteres alfanuméricos) y PIN de 4 dígitos.
- **Navegación**: Desde la pantalla de login a la página principal, pasando el nombre de usuario.
- **Página Home**: Que muestra el nombre de usuario recibido y un formulario adicional con:
1. Campos Nombre y Apellido (animados al limpiar).
2. Selector de Nivel de educación (ion-select).
3. Selector de fecha de nacimiento con MatDatepicker.
- **Components** Incluye un formulario con 3 componentes Mis Datos, Experiencia y Certificaciones.
- **Animación de Desplazamiento** Incluye una animación de desplazamiento horizontal (1s) al presionar "Limpiar".
- **Manejo de Toasts** Tambien usamos Toasts para mensajes de error y confirmación, centrados en pantalla. 

## Para empezar

### Prerequisitos

- Node.js v14 o superior

- NPM

  ```sh
  npm install npm@latest -g
  ```

- Ionic Cli

  ```sh
  npm install @ionic/cli -g
  ```
- Angular

  ```sh
  npm install -g @angular/cli
  ```

### Instalación

1. Clona el repositorio

   ```sh
   git clone https://github.com/benxh7/SkeletonAPP.git
   ```

2. Instala los paquetes de NPM

   ```sh
   npm install
   ```

3. Ejecuta el proyecto

   ```sh
   ionic serve
   ```
   Se abrirá la aplicación en http://localhost:8100/.

## Uso del proyecto

1. Ingresa un nombre de usuario válido y un PIN de 4 dígitos en la pantalla de login.
2. Al enviarlos, serás redirigido a la página Home.
3. Completa el formulario de información adicional.
4. Presiona Limpiar para animar los campos y resetear el formulario.
5. Presiona Mostrar para validar y mostrar un toast de confirmación.

### Estilos y temas

- Paleta de colores oscuros con variables CSS definidas en cada SCSS.
- Estilos de Angular Material adaptados a tema oscuro con ::ng-deep.
- Animaciones definidas en CSS (@keyframes slide-right).

## Contribuciones

¡Bienvenidas! Para contribuir, haz un fork del repositorio, crea una rama con tu feature y envía un pull request.

## Licencia

- MIT © 2025