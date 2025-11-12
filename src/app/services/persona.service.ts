import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Persona } from '../interfaces/persona';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  private myAppUrl: string;
  private myApiUrl: string;
  private personasSubject = new BehaviorSubject<Persona[]>([]);
  public personas$ = this.personasSubject.asObservable();

  constructor(private http: HttpClient) {
    this.myAppUrl = environment.endpoint;
    this.myApiUrl = 'api/personas/';
    this.loadPersonas();
  }

  // Cargar y actualizar la lista interna
  loadPersonas() {
    this.http.get<Persona[]>(`${this.myAppUrl}${this.myApiUrl}`)
      .subscribe(personas => this.personasSubject.next(personas));
  }

  // Obtener todas las personas, ordenadas por apellidos y nombre
  getPersonas(): Observable<Persona[]> {
    return this.personas$.pipe(
      map(personas =>
        [...personas].sort((a, b) => {
          const apA = a.apellidos?.toLowerCase() || '';
          const apB = b.apellidos?.toLowerCase() || '';
          if (apA === apB) {
            const nomA = a.nombre?.toLowerCase() || '';
            const nomB = b.nombre?.toLowerCase() || '';
            return nomA.localeCompare(nomB);
          }
          return apA.localeCompare(apB);
        })
      )
    );
  }

  // Alta de persona (POST)
  addPersona(persona: Persona): Observable<any> {
    return this.http.post(`${this.myAppUrl}${this.myApiUrl}`, persona)
      .pipe(tap(() => this.loadPersonas()));
  }

  // Obtener una persona por documento
  getPersona(dni: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.myAppUrl}${this.myApiUrl}${dni}`);
  }

  // Modificar persona (PUT por documento)
  updatePersona(dni: number, persona: Persona): Observable<any> {
    return this.http.put(`${this.myAppUrl}${this.myApiUrl}${dni}`, persona)
      .pipe(tap(() => this.loadPersonas()));
  }

  // Borrar persona por documento
  deletePersona(dni: number): Observable<any> {
    return this.http.delete(`${this.myAppUrl}${this.myApiUrl}${dni}`)
      .pipe(tap(() => this.loadPersonas()));
  }

  // Verificar si un documento ya existe en la base de datos (importante: 404 ≡ no existe)
  existeDocumento(dni: number): Observable<boolean> {
    return this.http.get<Persona>(`${this.myAppUrl}${this.myApiUrl}${dni}`).pipe(
      map(persona => {
        // Si encuentra la persona, el documento existe
        return true;
      }),
      catchError((error) => {
        // Si es error 404, el documento NO existe (es nuevo registro)
        if (error.status === 404) {
          return of(false);
        }
        // Otros errores, puedes loguear pero devuelves false (no existe)
        return of(false);
      })
    );
  }
}
