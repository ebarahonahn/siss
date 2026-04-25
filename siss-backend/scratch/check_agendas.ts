import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agendas = await prisma.agendaBase.findMany({
    include: {
        medico: true,
        establecimiento: true
    }
  });
  console.log('Agendas encontradas:', JSON.stringify(agendas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
