import { IsNotEmpty, IsOptional, IsString, IsInt, IsDecimal, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegistrarControlDto {
  @ApiProperty({ description: 'ID del embarazo activo' })
  @IsInt()
  @IsNotEmpty()
  embarazoId: number;

  @ApiProperty({ description: 'ID de la historia clínica asociada (opcional)' })
  @IsInt()
  @IsOptional()
  historiaClinicaId?: number;

  @ApiProperty({ description: 'Fecha del control (opcional)' })
  @IsString()
  @IsOptional()
  fechaControl?: string;

  @ApiProperty({ description: 'Semanas de gestación (opcional, permite ajuste manual)' })
  @IsNumber()
  @IsOptional()
  semanasGestacion?: number;

  @ApiProperty({ description: 'Peso materno en kg' })
  @IsNumber()
  @IsNotEmpty()
  peso: number;

  @ApiProperty({ description: 'Tensión Arterial Sistólica' })
  @IsInt()
  @IsNotEmpty()
  taSistolica: number;

  @ApiProperty({ description: 'Tensión Arterial Diastólica' })
  @IsInt()
  @IsNotEmpty()
  taDiastolica: number;

  @ApiProperty({ description: 'Altura Uterina en cm', required: false })
  @IsInt()
  @IsOptional()
  alturaUterina?: number;

  @ApiProperty({ description: 'Latidos por minuto del feto', required: false })
  @IsInt()
  @IsOptional()
  fcf?: number;

  @ApiProperty({ description: 'Presencia de movimientos fetales', required: false })
  @IsBoolean()
  @IsOptional()
  movimientosFetales?: boolean;

  @ApiProperty({ description: 'Presencia de edema' })
  @IsBoolean()
  @IsOptional()
  edema: boolean = false;

  @ApiProperty({ description: 'Presencia de proteinuria' })
  @IsBoolean()
  @IsOptional()
  proteinuria: boolean = false;

  @ApiProperty({ description: 'Observaciones del control', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
