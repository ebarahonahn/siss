import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConfiguracionDocumentoDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tituloEncabezado?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subtitulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  tituloVisor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombreArchivo?: string;
}
