import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEstablecimiento } from '@prisma/client';
import { ServicioInputDto } from './create-establecimiento.dto';

export class UpdateEstablecimientoDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum([
    'HOSPITAL_NACIONAL',
    'HOSPITAL_REGIONAL',
    'CENTRO_SALUD',
    'CLINICA_PERIFERICA',
    'CESAMO',
    'CESAR',
  ])
  tipo?: TipoEstablecimiento;

  @IsOptional()
  @IsInt()
  departamentoId?: number;

  @IsOptional()
  @IsInt()
  municipioId?: number;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServicioInputDto)
  servicios?: ServicioInputDto[];
}
