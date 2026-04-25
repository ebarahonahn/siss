import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum ViaAdministracion {
  ORAL = 'ORAL',
  INYECTABLE = 'INYECTABLE',
  TOPICA = 'TOPICA',
  INHALATORIA = 'INHALATORIA',
  SUBLINGUAL = 'SUBLINGUAL',
  RECTAL = 'RECTAL',
  OFTALMICA = 'OFTALMICA',
  OTICA = 'OTICA',
}

export class CreateMedicamentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  codigo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreGenerico: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  nombreComercial?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  presentacion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  concentracion: string;

  @IsEnum(ViaAdministracion)
  via: ViaAdministracion;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  grupoTerapeutico: string;

  @IsBoolean()
  @IsOptional()
  requiereReceta?: boolean;

  @IsBoolean()
  @IsOptional()
  esControlado?: boolean;
}
