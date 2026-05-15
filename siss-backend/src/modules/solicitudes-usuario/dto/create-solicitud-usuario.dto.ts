import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, IsNumber } from 'class-validator';

export class CreateSolicitudUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @Length(13, 13)
  dni: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  justificacion?: string;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;
}
