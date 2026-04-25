import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEstablecimiento } from '@prisma/client';

export class ServicioInputDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsInt()
  @IsNotEmpty()
  catServicioId: number;
}

export class CreateEstablecimientoDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum([
    'HOSPITAL_NACIONAL',
    'HOSPITAL_REGIONAL',
    'CENTRO_SALUD',
    'CLINICA_PERIFERICA',
    'CESAMO',
    'CESAR',
  ])
  tipo: TipoEstablecimiento;

  @IsInt()
  @IsNotEmpty()
  departamentoId: number;

  @IsInt()
  @IsNotEmpty()
  municipioId: number;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicioInputDto)
  servicios?: ServicioInputDto[];
}
