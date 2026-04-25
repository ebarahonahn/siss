
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.paciente.count({
    where: {
      OR: [
        { comunidad: { not: null } },
        { comunidad: { not: '' } }
      ]
    }
  });
  console.log('Pacientes con comunidad:', count);
  const sample = await prisma.paciente.findMany({
    take: 5,
    select: { nombres: true, comunidad: true }
  });
  console.log('Muestra:', sample);
}

check();
