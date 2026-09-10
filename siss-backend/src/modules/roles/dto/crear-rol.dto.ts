import { IsString, IsNotEmpty, MaxLength, IsOptional, Matches } from 'class-validator';

export class CrearRolDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El nombre no debe exceder los 50 caracteres' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'El nombre del rol debe contener solo letras mayúsculas, números y guiones bajos (ej. ENFERMERA_JEFE)',
  })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(200, { message: 'La descripción no debe exceder los 200 caracteres' })
  descripcion?: string;
}
