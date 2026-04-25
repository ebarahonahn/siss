import { IsNumber, IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class AsignarExamenDto {
  @IsNumber()
  establecimientoId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  examenIds: number[];
}

export class FiltroExamenDto {
  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  establecimientoId?: number;
}
