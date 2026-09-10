import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { TipoVacuna } from '@prisma/client';

export class CrearVacunaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsEnum(TipoVacuna)
  @IsOptional()
  tipo?: TipoVacuna;

  @IsString()
  @IsOptional()
  poblacionMeta?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
