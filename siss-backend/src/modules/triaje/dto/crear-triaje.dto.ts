import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export enum NivelConcienciaDto {
  ALERTA = 'ALERTA',
  RESPONDE_VOZ = 'RESPONDE_VOZ',
  RESPONDE_DOLOR = 'RESPONDE_DOLOR',
  INCONSCIENTE = 'INCONSCIENTE',
}

export enum CategoriaTriajeDto {
  ROJO = 'ROJO',
  NARANJA = 'NARANJA',
  AMARILLO = 'AMARILLO',
  VERDE = 'VERDE',
  AZUL = 'AZUL',
}

export class CrearTriajeDto {
  @IsInt()
  @IsNotEmpty()
  citaId: number;

  @IsString()
  @IsNotEmpty()
  motivoConsulta: string;

  @IsOptional()
  @IsInt()
  presionSistolica?: number;

  @IsOptional()
  @IsInt()
  presionDiastolica?: number;

  @IsOptional()
  @IsInt()
  frecuenciaCardiaca?: number;

  @IsOptional()
  @IsInt()
  frecuenciaRespiratoria?: number;

  @IsOptional()
  @IsNumber()
  temperatura?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  saturacionO2?: number;

  @IsOptional()
  @IsNumber()
  glucometria?: number;

  @IsOptional()
  @IsNumber()
  peso?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999.9)
  talla?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  escalaDolor?: number;

  @IsEnum(NivelConcienciaDto)
  nivelConciencia: NivelConcienciaDto;

  @IsEnum(CategoriaTriajeDto)
  categoria: CategoriaTriajeDto;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
