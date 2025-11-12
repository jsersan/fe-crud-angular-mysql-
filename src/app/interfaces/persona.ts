export interface Persona {
    dni: number;  // En lugar de documento: string
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    fechaNacimiento: Date;
}