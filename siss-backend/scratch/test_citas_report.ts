
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const inicio = new Date('2026-04-22');
    const fin = new Date('2026-04-23');
    
    const where: any = {
      fechaHora: { gte: inicio, lte: fin }
    };

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: { select: { nombres: true, apellidos: true, numeroExpediente: true } },
        medico: { select: { nombres: true, apellidos: true } },
        especialidad: { select: { nombre: true } },
        establecimiento: { select: { nombre: true } }
      },
      orderBy: { fechaHora: 'asc' }
    });

    console.log('Citas:', citas.length);
    if (citas.length > 0) {
      console.log('Primera cita:', citas[0]);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
