import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Persona } from 'src/app/interfaces/persona';
import { PersonaService } from 'src/app/services/persona.service';

@Component({
  selector: 'app-agregar-editar-persona',
  templateUrl: './agregar-editar-persona.component.html',
  styleUrls: ['./agregar-editar-persona.component.css']
})
export class AgregarEditarPersonaComponent implements OnInit {
  form: FormGroup;
  maxDate: Date;
  loading: boolean = false;
  verificandoDocumento: boolean = false;
  dniExiste: boolean = false;
  mostrarErrorDniPattern: boolean = false;
  operacion: string = 'Agregar';
  dni: number | undefined;
  dniOriginal: number | undefined;

  constructor(
    public dialogRef: MatDialogRef<AgregarEditarPersonaComponent>,
    private fb: FormBuilder,
    private personaService: PersonaService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.maxDate = new Date();
    this.dni = data.dni;
    this.dniOriginal = data.dni;
    this.form = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern("^[0-9]{8}$")]],
      nombre: ['', [Validators.required, Validators.maxLength(20)]],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: [
        '', 
        [
          Validators.required, 
          Validators.pattern("^[0-9]{9}$"),
          Validators.maxLength(9)
        ]
      ],
      fechaNacimiento: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.esEditar(this.dni);
  }

  esEditar(dni: number | undefined) {
    if (dni !== undefined) {
      this.operacion = 'Editar';
      this.getPersona(dni);
    }
  }

  getPersona(dni: number) {
    this.loading = true;
    this.personaService.getPersona(dni).subscribe({
      next: (data) => {
        this.form.setValue({
          dni: data.dni,
          nombre: data.nombre,
          apellidos: data.apellidos,
          email: data.email,
          telefono: data.telefono,
          fechaNacimiento: new Date(data.fechaNacimiento)
        });
        this.form.get('dni')?.disable();
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Error al cargar los datos de la persona', '', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  validarCampo(campo: string) {
    this.form.get(campo)?.markAsTouched();
  }

  onDniBlur() {
    const dniControl = this.form.get('dni');
    this.mostrarErrorDniPattern = dniControl?.hasError('pattern') || (dniControl?.value?.length !== 8);
    if (dniControl && dniControl.valid && dniControl.value.length === 8) {
      this.verificarDocumento();
    } else {
      this.dniExiste = false;
      this.habilitarCampos();
    }
  }

  verificarDocumento() {
    const dniControl = this.form.get('dni');
    this.dniExiste = false;
    if (!dniControl || !dniControl.value || dniControl.invalid) {
      return;
    }
    if (this.dniOriginal && Number(dniControl.value) === this.dniOriginal) {
      this.dniExiste = false;
      this.habilitarCampos();
      return;
    }
    this.verificandoDocumento = true;
    this.personaService.existeDocumento(Number(dniControl.value)).subscribe({
      next: (existe) => {
        this.verificandoDocumento = false;
        this.dniExiste = existe;
        if (existe) {
          this.snackBar.open('⚠️ Este DNI ya está registrado en el sistema', 'Cerrar', { duration: 4000 });
          this.limpiarCampos();
          dniControl.markAsTouched();
        } else {
          this.habilitarCampos();
        }
      },
      error: () => {
        this.verificandoDocumento = false;
        this.dniExiste = false;
        this.snackBar.open('Error al verificar DNI', '', { duration: 3000 });
      }
    });
  }

  limpiarCampos() {
    this.form.patchValue({
      nombre: '',
      apellidos: '',
      email: '',
      telefono: '',
      fechaNacimiento: null
    });
    Object.keys(this.form.controls).forEach(key => {
      if (key !== 'dni') {
        this.form.get(key)?.markAsUntouched();
        this.form.get(key)?.disable();
      }
    });
  }

  habilitarCampos() {
    Object.keys(this.form.controls).forEach(key => {
      if (key !== 'dni') {
        this.form.get(key)?.enable();
      }
    });
  }

  puedeEnviar(): boolean {
    return !this.loading &&
      !this.dniExiste &&
      !this.verificandoDocumento &&
      !this.mostrarErrorDniPattern &&
      this.form.valid;
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  addEditPersona() {
    if (!this.puedeEnviar()) {
      this.snackBar.open('Por favor, corrija los errores del formulario', 'Cerrar', { duration: 3000 });
      return;
    }
    const formValue = this.form.getRawValue();
    const persona: Persona = {
      dni: parseInt(formValue.dni),
      nombre: formValue.nombre,
      apellidos: formValue.apellidos,
      email: formValue.email,
      telefono: formValue.telefono,
      fechaNacimiento: formValue.fechaNacimiento.toISOString().slice(0, 10),
    };
    this.loading = true;

    if (this.dni === undefined) {
      this.personaService.addPersona(persona).subscribe({
        next: () => { this.mensajeExito('agregada'); },
        error: (err) => {
          if (err.error?.error?.code === 'ER_DUP_ENTRY') {
            this.snackBar.open('Este DNI ya existe en la base de datos', '', { duration: 4000 });
          } else {
            this.snackBar.open('Error al agregar la persona', '', { duration: 3000 });
          }
          this.loading = false;
        }
      });
    } else {
      this.personaService.updatePersona(this.dni, persona).subscribe({
        next: () => { this.mensajeExito('actualizada'); },
        error: () => {
          this.snackBar.open('Error al actualizar la persona', '', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }

  mensajeExito(operacion: string) {
    this.snackBar.open(`La persona fue ${operacion} con éxito`, '', { duration: 2000 });
    this.loading = false;
    this.dialogRef.close(true);
  }
}




