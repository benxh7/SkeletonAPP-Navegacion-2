import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DbTaskService } from '../../../services/dbtask.service';

@Component({
  selector: 'app-experiencia-laboral',
  templateUrl: './experiencia-laboral.component.html',
  styleUrls: ['./experiencia-laboral.component.scss'],
  standalone: false,
})
export class ExperienciaLaboralComponent implements OnInit {

  form = this.fb.nonNullable.group({
    empresa: ['', Validators.required],
    inicio: [0, [Validators.required, Validators.min(1950)]],
    actual: [true],
    termino: [{ value: 0, disabled: true }],
    cargo: ['', Validators.required],
  });

  constructor(private fb: FormBuilder, private db: DbTaskService) {
    this.form.get('actual')!.valueChanges.subscribe(now => {
      const terminoCtrl = this.form.get('termino')!;
      now ? terminoCtrl.disable() : terminoCtrl.enable();
    });
  }

  lista: any[] = [];

  async ngOnInit() {
    this.lista = await this.db.listaExperiencia();
  }

  async guardar() {
    if (this.form.invalid) return;
    await this.db.agregarExperiencia(this.form.getRawValue());
    this.form.reset({ actual: true, inicio: 0, termino: 0 });
    this.lista = await this.db.listaExperiencia();   // refresca la lista en pantalla
  }

}
