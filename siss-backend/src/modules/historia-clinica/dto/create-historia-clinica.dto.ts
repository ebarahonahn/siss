import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoCita } from '@prisma/client';

export enum TipoDiagnostico {
  PRINCIPAL = 'PRINCIPAL',
  SECUNDARIO = 'SECUNDARIO',
  COMORBILIDAD = 'COMORBILIDAD',
}

export class DiagnosticoDto {
  @IsString() @IsNotEmpty() codigoCIE10: string;
  @IsString() @IsNotEmpty() descripcion: string;
  @IsEnum(TipoDiagnostico) tipo: TipoDiagnostico;
}

export enum TipoIncapacidad {
  LABORAL = 'LABORAL',
  ESCOLAR = 'ESCOLAR',
  DEPORTIVA = 'DEPORTIVA',
}

export class IncapacidadDto {
  @IsString() @IsNotEmpty() fechaInicio: string;
  @IsString() @IsNotEmpty() fechaFin: string;
  @IsNumber() @IsNotEmpty() dias: number;
  @IsEnum(TipoIncapacidad) tipo: TipoIncapacidad;
  @IsString() @IsNotEmpty() motivo: string;
}

export class RecetaItemDto {
  @IsNumber() @IsNotEmpty() medicamentoId: number;
  @IsString() @IsNotEmpty() dosis: string;
  @IsString() @IsNotEmpty() frecuencia: string;
  @IsString() @IsNotEmpty() duracion: string;
  @IsNumber() @IsNotEmpty() cantidad: number;
  @IsString() @IsOptional() indicaciones?: string;
}

export class ReferenciaDto {
  @IsNumber() @IsNotEmpty() establecimientoDestinoId: number;
  @IsString() @IsNotEmpty() especialidadDestino: string;
  @IsString() @IsNotEmpty() motivo: string;
  @IsOptional() urgente?: boolean;
}

export class ProximaCitaDto {
  @IsNumber() @IsNotEmpty() medicoId: number;
  @IsNumber() @IsNotEmpty() especialidadId: number;
  @IsString() @IsNotEmpty() fechaHora: string;
  @IsEnum(TipoCita) @IsNotEmpty() tipo: TipoCita;
  @IsString() @IsOptional() motivo?: string;
  @IsNumber() @IsOptional() duracionMinutos?: number;
}

export class NotificacionEpidemiologicaDto {
  @IsString() @IsNotEmpty() diagnosticoCIE10: string;
  @IsNumber() @IsOptional() latitud?: number;
  @IsNumber() @IsOptional() longitud?: number;
  @IsString() @IsOptional() direccionDetallada?: string;
  @IsString() @IsOptional() fechaInicioSintomas?: string;
  @IsString() @IsOptional() antecedentesViaje?: string;
  @IsString() @IsOptional() lugaresVisitados?: string;
  @IsString() @IsOptional() observaciones?: string;
}

export class CreateHistoriaClinicaDto {
  @IsNumber() @IsNotEmpty() pacienteId: number;

  // SOAP
  @IsString() @IsNotEmpty() subjetivo: string;
  @IsString() @IsNotEmpty() objetivo: string;
  @IsString() @IsNotEmpty() analisis: string;
  @IsString() @IsNotEmpty() plan: string;

  // Signos Vitales
  @IsNumber() @IsOptional() presionSistolica?: number;
  @IsNumber() @IsOptional() presionDiastolica?: number;
  @IsNumber() @IsOptional() frecuenciaCardiaca?: number;
  @IsNumber() @IsOptional() temperatura?: number;
  @IsNumber() @IsOptional() peso?: number;
  @IsNumber() @IsOptional() talla?: number;
  @IsNumber() @IsOptional() saturacionO2?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiagnosticoDto)
  @IsOptional()
  diagnosticos?: DiagnosticoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetaItemDto)
  @IsOptional()
  recetas?: RecetaItemDto[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  laboratorio?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  radiologia?: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncapacidadDto)
  @IsOptional()
  incapacidades?: IncapacidadDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenciaDto)
  @IsOptional()
  referencias?: ReferenciaDto[];

  @IsNumber() @IsOptional() citaId?: number;
  @IsNumber() @IsOptional() proximaCitaId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProximaCitaDto)
  proximaCita?: ProximaCitaDto;

  @IsNumber() @IsOptional() plantillaId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificacionEpidemiologicaDto)
  notificacionEpidemiologica?: NotificacionEpidemiologicaDto;

  @IsOptional()
  @IsString()
  fecha?: string;
}
