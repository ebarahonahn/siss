import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const marioId = 3;
  const hntId = 1;
  const friday = 5;
  
  const agenda = await prisma.agendaBase.findFirst({
    where: {
      medicoId: marioId,
      establecimientoId: hntId,
      diaSemana: friday,
      activo: true
    }
  });
  
  console.log('Agenda de Mario para Viernes:', JSON.stringify(agenda, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
