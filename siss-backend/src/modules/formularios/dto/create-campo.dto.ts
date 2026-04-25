import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
} from 'class-validator';
import { TipoCampo, AnchoCampo } from '@prisma/client';

export class CreateCampoDto {
  @IsInt()
  seccionId: number;

  @IsInt()
  plantillaId: number;

  @IsEnum(TipoCampo)
  tipo: TipoCampo;

  @IsString()
  @IsNotEmpty()
  etiqueta: string;

  @IsString()
  @IsOptional()
  clave?: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsString()
  @IsOptional()
  ayuda?: string;

  @IsBoolean()
  @IsOptional()
  requerido?: boolean;

  @IsEnum(AnchoCampo)
  @IsOptional()
  ancho?: AnchoCampo;

  @IsObject()
  @IsOptional()
  configuracion?: Record<string, any>;

  @IsObject()
  @IsOptional()
  condicionVisibilidad?: Record<string, any>;
}
