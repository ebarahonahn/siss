import { IsOptional, IsBoolean, IsInt, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarEmbarazoDto {
  @ApiProperty({ description: 'Indica si es un embarazo múltiple', required: false })
  @IsBoolean()
  @IsOptional()
  esMultiple?: boolean;

  @ApiProperty({ description: 'Cantidad de fetos identificados', required: false })
  @IsInt()
  @IsOptional()
  cantidadFetos?: number;

  @ApiProperty({ description: 'Observaciones del cambio', required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
