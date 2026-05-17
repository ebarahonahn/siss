import { IsNotEmpty, IsOptional, IsString, IsInt, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RiesgoDesarrollo } from '@prisma/client';

export class RegistrarControlNiñoSanoDto {
  @ApiProperty({ description: 'ID del paciente (niño)' })
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

  @ApiProperty({ description: 'ID de la historia clínica asociada' })
  @IsInt()
  @IsNotEmpty()
  historiaId: number;

  @ApiProperty({ description: 'Peso del niño en kg' })
  @IsNumber()
  @IsNotEmpty()
  peso: number;

  @ApiProperty({ description: 'Talla del niño en cm' })
  @IsNumber()
  @IsNotEmpty()
  talla: number;

  @ApiProperty({ description: 'Perímetro cefálico en cm', required: false })
  @IsNumber()
  @IsOptional()
  perimetroCefalico?: number;

  @ApiProperty({ description: 'IMC calculado', required: false })
  @IsNumber()
  @IsOptional()
  imc?: number;

  @ApiProperty({ description: 'Estado nutricional sugerido', required: false })
  @IsString()
  @IsOptional()
  estadoNutricional?: string;

  @ApiProperty({ description: 'JSON con hitos del desarrollo', required: false })
  @IsOptional()
  desarrolloJson?: any;

  @ApiProperty({ description: 'Nivel de riesgo del desarrollo', enum: RiesgoDesarrollo, default: RiesgoDesarrollo.NORMAL })
  @IsEnum(RiesgoDesarrollo)
  @IsOptional()
  alertaDesarrollo?: RiesgoDesarrollo;

  @ApiProperty({ description: 'Indica si recibe lactancia materna' })
  @IsBoolean()
  @IsOptional()
  lactanciaMaterna?: boolean;

  @ApiProperty({ description: 'Indica si recibe alimentación complementaria' })
  @IsBoolean()
  @IsOptional()
  alimentacionComp?: boolean;

  @ApiProperty({ description: 'Indica si recibió Vitamina A' })
  @IsBoolean()
  @IsOptional()
  vitaminaA?: boolean;

  @ApiProperty({ description: 'Indica si recibió Hierro' })
  @IsBoolean()
  @IsOptional()
  hierro?: boolean;

  @ApiProperty({ description: 'Indica si recibió desparasitación' })
  @IsBoolean()
  @IsOptional()
  desparasitacion?: boolean;

  @ApiProperty({ description: 'Observaciones adicionales del control', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ description: 'Lista de medicamentos prescritos', required: false })
  @IsOptional()
  recetas?: any[];

  @IsOptional()
  laboratorios?: any[];

  @IsOptional()
  radiologias?: any[];

  @IsOptional()
  referencias?: any[];

  @IsOptional()
  incapacidades?: any[];

  @IsOptional()
  vacunas?: any[];

  @IsOptional()
  vacunasRecetadas?: any[];

  @ApiProperty({ description: 'Fecha manual del control (YYYY-MM-DD)', required: false })
  @IsString()
  @IsOptional()
  fechaControl?: string;
}



