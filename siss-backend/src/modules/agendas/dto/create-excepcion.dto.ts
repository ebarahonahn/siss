import {
  IsInt,
  IsEnum,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';
import { TipoExcepcion } from '@prisma/client';

export class CreateExcepcionDto {
  @IsInt()
  medicoId: number;

  @IsInt()
  establecimientoId: number;

  @IsEnum(TipoExcepcion)
  tipo: TipoExcepcion;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  horaInicio?: string;

  @IsString()
  @IsOptional()
  horaFin?: string;
}
