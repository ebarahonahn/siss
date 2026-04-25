
import { PrismaClient } from '@prisma/client';
import { HistoriaClinicaService } from '../src/modules/historia-clinica/historia-clinica.service';

async function debug() {
  const prisma = new PrismaClient();
  const service = new HistoriaClinicaService(prisma as any);

  const mockPayload: any = {
    pacienteId: 3,
    subjetivo: 'Test descripcion larga',
    objetivo: 'Test descripcion larga',
    analisis: 'Test descripcion larga',
    plan: 'Test descripcion larga',
    diagnosticos: [
      { codigoCIE10: 'A90', descripcion: 'D'.repeat(310), tipo: 'PRINCIPAL' }
    ],
    notificacionEpidemiologica: {
      diagnosticoCIE10: 'A90',
      latitud: 14.1,
      longitud: -87.2,
      direccionDetallada: 'Test direccion',
      fechaInicioSintomas: '2024-04-20'
    }
  };

  try {
    console.log('Probando creación de historia clínica con Cita 14...');
    const result = await service.crear(mockPayload, 3, 1);
    console.log('Resultado exitoso:', result);
  } catch (error: any) {
    console.error('--- ERROR CAPTURADO ---');
    console.error('Mensaje:', error.message);
    console.error('Código Prisma:', error.code);
    console.error('Meta:', error.meta);
    if (error.stack) console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
