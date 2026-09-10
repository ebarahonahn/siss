import {
  IsNotEmpty,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { TipoCita } from '@prisma/client';

export class CreateCitaDto {
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

  @IsInt()
  @IsNotEmpty()
  medicoId: number;

  @IsDateString()
  @IsNotEmpty()
  fechaHora: string;

  @IsEnum(TipoCita)
  @IsNotEmpty()
  tipo: TipoCita;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsInt()
  @IsOptional()
  especialidadId?: number;

  @IsInt()
  @IsOptional()
  duracionMinutos?: number;

  @IsInt()
  @IsOptional()
  establecimientoId?: number;

  @IsInt()
  @IsOptional()
  asignacionId?: number;
}
