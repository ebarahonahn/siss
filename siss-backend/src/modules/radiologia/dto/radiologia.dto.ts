import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EstudioRadiologicoDto {
  @IsString()
  codigo: string;

  @IsString()
  nombre: string;

  @IsString()
  categoria: string;

  @IsOptional()
  @IsString()
  indicaciones?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class AsignarEstudiosDto {
  @IsInt()
  establecimientoId: number;

  @IsArray()
  @IsInt({ each: true })
  estudiosIds: number[];
}

export class FiltroEstudioDto {
  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  establecimientoId?: number;
}
