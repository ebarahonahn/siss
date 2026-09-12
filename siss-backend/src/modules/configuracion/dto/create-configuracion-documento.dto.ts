import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { UpdateConfiguracionDocumentoDto } from './update-configuracion-documento.dto';

export class CreateConfiguracionDocumentoDto extends UpdateConfiguracionDocumentoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/i, {
    message: 'El código solo puede contener letras, números y guiones bajos',
  })
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  declare tituloEncabezado: string;

  @IsString()
  @MaxLength(200)
  declare subtitulo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  declare tituloVisor: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  declare nombreArchivo: string;
}
