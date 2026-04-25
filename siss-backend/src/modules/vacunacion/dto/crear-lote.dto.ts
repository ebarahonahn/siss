
import { IsInt, IsString, IsDateString } from 'class-validator';

export class CrearLoteDto {
  @IsInt()
  vacunaId: number;

  @IsString()
  codigoLote: string;

  @IsString()
  fabricante: string;

  @IsDateString()
  fechaVencimiento: string;

  @IsInt()
  cantidadInicial: number;

  @IsInt()
  establecimientoId: number;
}
