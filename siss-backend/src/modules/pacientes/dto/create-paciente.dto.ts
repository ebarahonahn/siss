import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsInt,
  MaxLength,
  Matches,
} from 'class-validator';

enum Sexo {
  MASCULINO = 'MASCULINO',
  FEMENINO = 'FEMENINO',
}
enum TipoSangre {
  A_POS = 'A_POS',
  A_NEG = 'A_NEG',
  B_POS = 'B_POS',
  B_NEG = 'B_NEG',
  O_POS = 'O_POS',
  O_NEG = 'O_NEG',
  AB_POS = 'AB_POS',
  AB_NEG = 'AB_NEG',
  DESCONOCIDO = 'DESCONOCIDO',
}
enum Escolaridad {
  NINGUNA = 'NINGUNA',
  PRIMARIA = 'PRIMARIA',
  SECUNDARIA = 'SECUNDARIA',
  UNIVERSITARIA = 'UNIVERSITARIA',
  POSTGRADO = 'POSTGRADO',
}
enum EstadoCivil {
  SOLTERO = 'SOLTERO',
  CASADO = 'CASADO',
  UNION_LIBRE = 'UNION_LIBRE',
  DIVORCIADO = 'DIVORCIADO',
  VIUDO = 'VIUDO',
}

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombres: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  apellidos: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{13}$/, { message: 'El DNI debe tener 13 dígitos' })
  dni: string;

  @IsDateString()
  fechaNacimiento: string;

  @IsInt()
  @IsNotEmpty()
  sexoId: number;

  @IsInt()
  @IsOptional()
  tipoSangreId?: number;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  telefonoEmergencia?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  direccion?: string;

  @IsInt()
  @IsNotEmpty()
  departamentoId: number;

  @IsInt()
  @IsNotEmpty()
  municipioId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  comunidad?: string;

  @IsInt()
  @IsOptional()
  escolaridadId?: number;

  @IsInt()
  @IsOptional()
  ocupacionId?: number;

  @IsInt()
  @IsOptional()
  estadoCivilId?: number;
}
