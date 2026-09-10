import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const esps = await prisma.especialidad.findMany({
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  });

  console.log('Especialidades:', JSON.stringify(esps, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
