import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const termino = '0801197106887';
  console.log('--- BUSCANDO PACIENTE CON DNI:', termino);

  const pacientes = await prisma.paciente.findMany({
    where: {
      OR: [
        { nombres: { contains: termino } },
        { apellidos: { contains: termino } },
        { dni: { contains: termino } },
        { numeroExpediente: { contains: termino } },
      ],
      activo: true,
    },
    include: {
      sexo: true,
    }
  });

  console.log('PACIENTES ENCONTRADOS:', JSON.stringify(pacientes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
