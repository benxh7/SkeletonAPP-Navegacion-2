import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { DbTaskService } from 'src/app/services/dbtask.service';

@Component({
  selector: 'app-mis-datos',
  templateUrl: './mis-datos.component.html',
  styleUrls: ['./mis-datos.component.scss'],
  standalone: false,
})
export class MisDatosComponent implements OnInit {

  @ViewChild('nombreInput', { read: ElementRef }) nombreInput!: ElementRef;
  @ViewChild('apellidoInput', { read: ElementRef }) apellidoInput!: ElementRef;

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    educacion: ['', Validators.required],
    fnac: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private db: DbTaskService,
  ) { }

  async ngOnInit() {
    /* cargar si existen */
    const datos = await this.db.obtenerMisDatos();
    if (datos) this.form.patchValue(datos);
  }

  // Metodo que ejecuta la accion del boton de limpiar
  limpiar() {
    // Animamos los campos de nombre y apellido
    [this.nombreInput, this.apellidoInput].forEach(ref => {
      const el = ref.nativeElement as HTMLElement;
      el.classList.add('slide-animation');
      // Ahora quitamos la clase al acabar la animación
      setTimeout(() => el.classList.remove('slide-animation'), 1000);
    });

    // Una vez acabado limpiamos correctamente el formulario
    setTimeout(() => {
      this.form.reset();
    }, 1000);
  }

  // Metodo que ejecuta la accion del boton de mostrar
  async mostrar() {
    // Si datos vacios, mostraremos un toast de error
    if (this.form.invalid) {
      const missing: string[] = [];
      const ctrl = this.form.controls;

      if (ctrl.nombre.invalid) missing.push('Nombres');
      if (ctrl.apellido.invalid) missing.push('Apellidos');
      if (ctrl.educacion.invalid) missing.push('Nivel de educación');
      if (ctrl.fnac.invalid) missing.push('Fecha de nacimiento');

      const toast = await this.toastCtrl.create({
        message: `Por favor completa: ${missing.join(', ')}`,
        color: 'danger',
        duration: 4000,
        position: 'middle',
      });
      await toast.present();
      return;
    }

    /* 👇 1. guardamos en la BD */
    await this.db.guardarMisDatos(this.form.getRawValue());

    /* 2. toast de confirmación */
    const { nombre, apellido } = this.form.value;
    const toast = await this.toastCtrl.create({
      message: `¡Datos guardados! Hola ${nombre} ${apellido}`,
      color: 'success',
      duration: 2500,
      position: 'middle',
    });
    toast.present();
  }
}
