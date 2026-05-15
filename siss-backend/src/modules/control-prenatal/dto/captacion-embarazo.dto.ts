import { IsDateString, IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CaptacionEmbarazoDto {
  @ApiProperty({ description: 'Fecha y hora literal del cliente' })
  @IsString()
  @IsOptional()
  fechaLiteral?: string;

  @ApiProperty({ description: 'ID de la paciente' })
  @IsInt()
  @IsNotEmpty()
  pacienteId: number;

  @ApiProperty({ description: 'Fecha de Última Menstruación (UTC Literal)', required: false })
  @IsDateString()
  @IsOptional()
  fum?: string;

  @ApiProperty({ description: 'Observaciones iniciales o factores de riesgo detectados', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ description: 'Antecedentes: Número de gestas' })
  @IsInt()
  @IsOptional()
  gravidez: number = 0;

  @ApiProperty({ description: 'Antecedentes: Número de partos' })
  @IsInt()
  @IsOptional()
  partos: number = 0;

  @ApiProperty({ description: 'Antecedentes: Número de abortos' })
  @IsInt()
  @IsOptional()
  abortos: number = 0;

  @ApiProperty({ description: 'Antecedentes: Número de cesáreas' })
  @IsInt()
  @IsOptional()
  cesareas: number = 0;

  @ApiProperty({ description: 'Antecedentes: Número de óbitos (muertes fetales)' })
  @IsInt()
  @IsOptional()
  obitos: number = 0;

  @ApiProperty({ description: 'Año del último embarazo previo', required: false })
  @IsInt()
  @IsOptional()
  ultimoEmbarazoPrevio?: number;

  @ApiProperty({ description: 'Complicaciones en embarazos previos', required: false })
  @IsString()
  @IsOptional()
  complicacionesPrevias?: string;
}
