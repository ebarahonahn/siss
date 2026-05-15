import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RolNombre {
  ADMIN = 'ADMIN',
  MEDICO = 'MEDICO',
  ENFERMERA = 'ENFERMERA',
  FARMACEUTICO = 'FARMACEUTICO',
  RECEPCIONISTA = 'RECEPCIONISTA',
  EPIDEMIOLOGO = 'EPIDEMIOLOGO',
  ADMIN_ESTABLECIMIENTO = 'ADMIN_ESTABLECIMIENTO',
}

export class CrearUsuarioDto {
  @IsString()
  @IsNotEmpty()
  numeroEmpleado: string;

  @IsString()
  @IsNotEmpty()
  nombres: string;

  @IsString()
  @IsNotEmpty()
  apellidos: string;

  @IsEmail()
  correo: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  contrasena: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsEnum(RolNombre)
  rol: RolNombre;

  @IsOptional()
  @IsInt()
  especialidadId?: number;

  @IsOptional()
  @IsString()
  numeroColegiado?: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsignacionInputDto)
  asignaciones: AsignacionInputDto[];

  @IsOptional()
  latitud?: number;

  @IsOptional()
  longitud?: number;
}

export class AsignacionInputDto {
  @IsInt()
  @IsNotEmpty()
  establecimientoId: number;

  @IsOptional()
  @IsInt()
  servicioId?: number;

  @IsOptional()
  @IsInt()
  rolId?: number;

  @IsOptional()
  @IsInt()
  especialidadId?: number;
}
