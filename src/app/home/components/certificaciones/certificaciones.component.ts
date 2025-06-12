import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DbTaskService } from '../../../services/dbtask.service';

@Component({
  selector: 'app-certificaciones',
  templateUrl: './certificaciones.component.html',
  styleUrls: ['./certificaciones.component.scss'],
  standalone: false,
})
export class CertificacionesComponent implements OnInit {

  lista: any[] = [];

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    fecha: ['', Validators.required],
    vence: [false],
    vencimiento: [{ value: '', disabled: true }],
  });

  constructor(private fb: FormBuilder, private db: DbTaskService) {
    this.form.get('vence')!.valueChanges.subscribe(v => {
      const vencCtrl = this.form.get('vencimiento')!;
      v ? vencCtrl.enable() : vencCtrl.disable();
    });
  }

  async ngOnInit() { 
    this.lista = await this.db.listaCertificado();
  }

  async guardar() {
    if (this.form.invalid) return;
    await this.db.agregarCertificado(this.form.getRawValue());
    this.form.reset({ vence: false, fecha: '', vencimiento: '' });
    this.lista = await this.db.listaCertificado();
  }

}
