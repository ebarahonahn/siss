import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const citas = await prisma.cita.findMany({
    where: { pacienteId: 4 },
    include: {
      medico: true,
      establecimiento: true
    }
  });
  console.log('Citas:', JSON.stringify(citas, null, 2));
}
main().finally(() => prisma.$disconnect());
