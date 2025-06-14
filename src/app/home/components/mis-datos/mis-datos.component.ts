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
  async guardar() {

    /**
     * Validamos el formulario antes de guardar.
     * Si el formulario es inválido, mostramos un toast con los campos faltantes.
     */
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
  
    /**
     * Guardamos los datos del formulario en la base de datos.
     * Utilizamos getRawValue() para obtener todos los valores del formulario,
     * incluyendo los que están deshabilitados.
     * Esto es importante para asegurarnos de que todos los campos se guarden correctamente.
     */
    await this.db.guardarMisDatos(this.form.getRawValue());
  
    const { nombre, apellido } = this.form.value;
    const toast = await this.toastCtrl.create({
      message: `¡Datos guardados! Hola ${nombre} ${apellido}`,
      color: 'success',
      duration: 2500,
      position: 'middle',
    });
    await toast.present();

    // Limpiamos el formulario después de guardar
    this.limpiar();
  }
}
