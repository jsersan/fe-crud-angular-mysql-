import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { PersonaService } from '../services/persona.service';

export class DocumentoValidator {
  
  static documentoExistente(
    personaService: PersonaService,
    documentoOriginal?: string
  ): AsyncValidatorFn {
    
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      
      const documento = control.value;
      
      // Si el campo está vacío, no validar
      if (!documento) {
        return of(null);
      }

      // Si estamos editando y el documento no ha cambiado, no validar
      if (documentoOriginal && documento === documentoOriginal) {
        return of(null);
      }

      // Esperar 500ms antes de validar (debounce manual)
      return timer(500).pipe(
        switchMap(() => personaService.existeDocumento(documento)),
        map(existe => {
          if (existe) {
            return { documentoExistente: true };
          }
          return null;
        }),
        catchError(() => {
          return of(null);
        })
      );
    };
  }
}