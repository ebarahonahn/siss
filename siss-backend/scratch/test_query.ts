
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test(establecimientoId: number) {
  const medicos = await prisma.usuario.findMany({
    where: {
      OR: [
        { establecimientoId },
        {
          asignaciones: {
            some: {
              establecimientoId,
              rol: { nombre: 'MEDICO' },
              activo: true,
            },
          },
        },
      ],
      rol: { nombre: 'MEDICO' },
      activo: true,
    },
    include: {
      rol: true,
      especialidad: true
    }
  });
  console.log(`Medicos para est ${establecimientoId}:`, medicos.length);
  medicos.forEach(m => console.log(`- ${m.nombres} ${m.apellidos} (ID: ${m.id})` ));
}

test(1).finally(() => prisma.$disconnect());
