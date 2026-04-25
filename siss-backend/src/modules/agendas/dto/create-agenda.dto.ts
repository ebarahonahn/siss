import {
  IsInt,
  IsString,
  IsBoolean,
  IsOptional,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateAgendaBaseDto {
  @IsInt()
  medicoId: number;

  @IsInt()
  establecimientoId: number;

  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora debe ser HH:mm',
  })
  horaInicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Formato de hora debe ser HH:mm',
  })
  horaFin: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
