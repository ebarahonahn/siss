import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AsignarMedicamentoDto {
  @IsInt() @Type(() => Number) medicamentoId: number;
  @IsInt() @Type(() => Number) establecimientoId: number;
  @IsInt() @Min(0) @Type(() => Number) cantidadActual: number;
  @IsInt() @Min(0) @Type(() => Number) cantidadMinima: number;
  @IsString() @IsOptional() lote?: string;
  @IsString() @IsOptional() fechaVencimiento?: string;
  @IsString() @IsOptional() ubicacion?: string;
}

export class ActualizarInventarioDto {
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) cantidadActual?: number;
  @IsInt() @Min(0) @IsOptional() @Type(() => Number) cantidadMinima?: number;
  @IsString() @IsOptional() lote?: string;
  @IsString() @IsOptional() fechaVencimiento?: string;
  @IsString() @IsOptional() ubicacion?: string;
}

export class ItemCargaMasivaDto {
  @IsString() codigoMedicamento: string;
  @IsInt() @Min(0) @Type(() => Number) cantidadActual: number;
  @IsInt() @Min(0) @Type(() => Number) cantidadMinima: number;
  @IsString() @IsOptional() lote?: string;
  @IsString() @IsOptional() fechaVencimiento?: string;
  @IsString() @IsOptional() ubicacion?: string;
}

export class CargaMasivaInventarioDto {
  @IsInt() @Type(() => Number) establecimientoId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCargaMasivaDto)
  items: ItemCargaMasivaDto[];
}
