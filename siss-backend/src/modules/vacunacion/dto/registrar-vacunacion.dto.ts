
import { IsInt, IsString, IsOptional, IsDateString } from 'class-validator';

export class RegistrarVacunacionDto {
  @IsInt()
  pacienteId: number;

  @IsInt()
  vacunaId: number;

  @IsOptional()
  @IsInt()
  esquemaId?: number;

  @IsInt()
  loteId: number;

  @IsOptional()
  @IsString()
  sitioAplicacion?: string;

  @IsOptional()
  @IsString()
  viaAplicacion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsInt()
  establecimientoId: number;

  @IsOptional()
  @IsDateString()
  fechaAplicacion?: string;
}
