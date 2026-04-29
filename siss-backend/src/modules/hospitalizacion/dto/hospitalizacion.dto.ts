import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, IsNotEmpty, IsDateString, IsNumber } from 'class-validator';
import { EstadoCama, TipoEgreso } from '@prisma/client';

export class CreateSalaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsInt()
  @IsNotEmpty()
  servicioId: number;
}

export class UpdateSalaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class CreateHabitacionDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsInt()
  @IsNotEmpty()
  salaId: number;

  @IsInt()
  @IsNotEmpty()
  tipoHabitacionId: number;
}

export class UpdateHabitacionDto {
  @IsString()
  @IsOptional()
  numero?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsInt()
  @IsOptional()
  tipoHabitacionId?: number;
}

export class CreateCamaDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsInt()
  @IsNotEmpty()
  habitacionId: number;

  @IsInt()
  @IsNotEmpty()
  tipoCamaId: number;

  @IsEnum(EstadoCama)
  @IsOptional()
  estado?: EstadoCama;
}

export class UpdateCamaDto {
  @IsString()
  @IsOptional()
  codigo?: string;

  @IsEnum(EstadoCama)
  @IsOptional()
  estado?: EstadoCama;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsInt()
  @IsOptional()
  tipoCamaId?: number;
}

// DTOs para Admisión y Gestión de Pacientes

export class CreateIngresoDto {
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

  @IsInt()
  @IsNotEmpty()
  camaId: number;

  @IsInt()
  @IsNotEmpty()
  servicioId: number;

  @IsString()
  @IsNotEmpty()
  motivoIngreso: string;

  @IsString()
  @IsOptional()
  cie10Ingreso?: string;

  @IsString()
  @IsOptional()
  diagnosticoIngreso?: string;

  @IsInt()
  @IsNotEmpty()
  medicoIngresoId: number;

  @IsInt()
  @IsNotEmpty()
  creadoPorId: number;

  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;
}

export class CreateEgresoDto {
  @IsInt()
  @IsNotEmpty()
  ingresoId: number;

  @IsEnum(TipoEgreso)
  @IsNotEmpty()
  tipoEgreso: TipoEgreso;

  @IsString()
  @IsNotEmpty()
  condicionEgreso: string;

  @IsString()
  @IsOptional()
  cie10Egreso?: string;

  @IsString()
  @IsOptional()
  epicrisis?: string;

  @IsInt()
  @IsNotEmpty()
  medicoEgresoId: number;

  @IsOptional()
  @IsDateString()
  fechaEgreso?: string;
}

export class CreateMovimientoDto {
  @IsInt()
  @IsNotEmpty()
  ingresoId: number;

  @IsInt()
  @IsNotEmpty()
  camaOrigenId: number;

  @IsInt()
  @IsNotEmpty()
  camaDestinoId: number;

  @IsString()
  @IsOptional()
  motivo?: string;

  @IsInt()
  @IsNotEmpty()
  usuarioId: number;

  @IsOptional()
  @IsDateString()
  fechaMovimiento?: string;
}

export class CreateNotaEvolucionDto {
  @IsInt()
  ingresoId: number;

  @IsString()
  @IsNotEmpty()
  nota: string;

  @IsOptional()
  @IsInt()
  frecuenciaCardiaca?: number;

  @IsOptional()
  @IsInt()
  frecuenciaRespiratoria?: number;

  @IsOptional()
  @IsString()
  presionArterial?: string;

  @IsOptional()
  @IsNumber()
  temperatura?: number;

  @IsOptional()
  @IsInt()
  saturacionOxigeno?: number;

  @IsInt()
  medicoId: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}

export class CreateKardexDto {
  @IsInt()
  ingresoId: number;

  @IsInt()
  medicamentoId: number;

  @IsString()
  @IsNotEmpty()
  dosis: string;

  @IsOptional()
  @IsString()
  via?: string;

  @IsDateString()
  fechaProgramada: string;

  @IsString()
  estado: 'PENDIENTE' | 'ADMINISTRADO' | 'OMITIDO' | 'RECHAZADO';

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsInt()
  enfermeraId: number;

  @IsOptional()
  @IsDateString()
  fechaAplicacion?: string;
}

export class CreateControlSignosDto {
  @IsInt()
  ingresoId: number;

  @IsOptional()
  @IsInt()
  frecuenciaCardiaca?: number;

  @IsOptional()
  @IsInt()
  frecuenciaRespiratoria?: number;

  @IsOptional()
  @IsString()
  presionArterial?: string;

  @IsOptional()
  @IsNumber()
  temperatura?: number;

  @IsOptional()
  @IsInt()
  saturacionOxigeno?: number;

  @IsOptional()
  @IsNumber()
  pesoKg?: number;

  @IsOptional()
  @IsInt()
  glucoMetria?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsInt()
  usuarioId: number;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
