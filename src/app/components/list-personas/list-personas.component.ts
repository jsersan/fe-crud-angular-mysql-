import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core'
import { MatDialog } from '@angular/material/dialog'
import { MatPaginator } from '@angular/material/paginator'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatSort } from '@angular/material/sort'
import { MatTableDataSource } from '@angular/material/table'
import { Subscription } from 'rxjs'

import { Persona } from 'src/app/interfaces/persona'
import { PersonaService } from 'src/app/services/persona.service'
import { AgregarEditarPersonaComponent } from '../agregar-editar-persona/agregar-editar-persona.component'

@Component({
  selector: 'app-list-personas',
  templateUrl: './list-personas.component.html',
  styleUrls: ['./list-personas.component.css']
})
export class ListPersonasComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'dni',
    'nombre',
    'apellidos',
    'email',
    'telefono',
    'fechaNacimiento',
    'acciones'
  ]

  dataSource: MatTableDataSource<Persona>
  loading: boolean = false
  personasSubscription!: Subscription

  @ViewChild(MatPaginator) paginator!: MatPaginator
  @ViewChild(MatSort) sort!: MatSort

  constructor (
    public dialog: MatDialog,
    private _personaService: PersonaService,
    private _snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource()
  }

  ngOnInit(): void {
    this.loading = true;
    this.personasSubscription = this._personaService.getPersonas()
      .subscribe(data => {
        this.dataSource.data = data;
        console.log('personas cargadas:', data); // <-- aquí ves si documento llega bien
        this.loading = false;
      });
  }
  
  ngAfterViewInit (): void {
    this.dataSource.paginator = this.paginator
    this.dataSource.sort = this.sort
  }

  applyFilter (event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
    this.dataSource.filter = filterValue.trim().toLowerCase()
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage()
    }
  }

  addEditPersona (dni?: number) {
    const dialogRef = this.dialog.open(AgregarEditarPersonaComponent, {
      width: '550px',
      disableClose: true,
      data: { dni: dni }
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // No es necesario recargar manualmente porque ya hay suscripción reactiva
        this._snackBar.open(
          dni
            ? 'Persona actualizada correctamente'
            : 'Persona añadida correctamente',
          '',
          { duration: 2000 }
        )
      }
    })
  }

  obtenerPersonas () {
    this.loading = true
    this._personaService.getPersonas().subscribe(data => {
      this.loading = false
      this.dataSource.data = data
      this.dataSource.paginator = this.paginator
      this.dataSource.sort = this.sort
    })
  }

  deletePersona (dni: number) {
    console.log('DNI que intenta borrar:', dni);
  
    if (!dni) {
      this._snackBar.open('No se puede borrar, DNI no definido', '', {duration: 2000});
      return;
    }
  
    const respuesta = confirm('¿Está seguro de eliminar este registro?')
    
    if (respuesta === true) {
      this.loading = true;
      
      this._personaService.deletePersona(dni).subscribe({
        next: () => {
          this._snackBar.open('La persona fue eliminada con éxito', '', {
            duration: 2000
          })
          this.obtenerPersonas()
          this.loading = false
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          this._snackBar.open('Error al eliminar la persona', '', {
            duration: 3000
          })
          this.loading = false
        }
      })
    }
  }

  ngOnDestroy () {
    this.personasSubscription.unsubscribe()
  }
}
