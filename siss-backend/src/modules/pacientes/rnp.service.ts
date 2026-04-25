import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class RnpService {
  // Simulación de base de datos del RNP para pruebas
  private mockDatabase = [
    {
      dni: '0501199012345',
      nombres: 'JUAN ALBERTO',
      apellidos: 'PEREZ RODRIGUEZ',
      fechaNacimiento: '1990-05-15',
      sexo: 'MASCULINO',
    },
    {
      dni: '0801198567890',
      nombres: 'MARIA ELENA',
      apellidos: 'GARCIA LOPEZ',
      fechaNacimiento: '1985-11-20',
      sexo: 'FEMENINO',
    },
    {
      dni: '1601200011223',
      nombres: 'CARLOS ROBERTO',
      apellidos: 'MENDOZA ZELAYA',
      fechaNacimiento: '2000-01-10',
      sexo: 'MASCULINO',
    },
  ];

  async validarDni(dni: string) {
    // Simulamos un pequeño retraso de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    const persona = this.mockDatabase.find((p) => p.dni === dni);

    if (!persona) {
      throw new NotFoundException(
        `El DNI ${dni} no se encuentra registrado en el RNP`,
      );
    }

    return persona;
  }
}
