import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dni = '0801199912345'; // El DNI que estamos usando
  const paciente = await prisma.paciente.findUnique({
    where: { dni },
    include: {
      citas: {
        include: {
          medico: true,
          establecimiento: true
        }
      }
    }
  });

  console.log('Paciente:', JSON.stringify(paciente, null, 2));
}

main().finally(() => prisma.$disconnect());
