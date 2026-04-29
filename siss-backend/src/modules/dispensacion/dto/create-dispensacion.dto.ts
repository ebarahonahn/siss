import { IsNumber, IsArray, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DispensacionDetalleDto {
  @ApiProperty({ description: 'ID del detalle de la receta original', example: 1 })
  @IsNumber() @IsNotEmpty() detalleRecetaId: number;

  @ApiProperty({ description: 'Cantidad física a entregar', example: 20 })
  @IsNumber() @IsNotEmpty() cantidad: number;
}

export class CreateDispensacionDto {
  @ApiProperty({ description: 'ID de la receta médica a dispensar', example: 101 })
  @IsNumber() @IsNotEmpty() recetaId: number;

  @ApiProperty({ description: 'Listado de medicamentos y cantidades a entregar', type: [DispensacionDetalleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DispensacionDetalleDto)
  detalles: DispensacionDetalleDto[];
}
