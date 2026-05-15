import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const history = await prisma.historiaClinica.findFirst({
    where: { pacienteId: 4 },
    select: {
      medico: {
        select: {
          nombres: true,
          establecimiento: { select: { nombre: true } }
        }
      }
    }
  });
  console.log(JSON.stringify(history));
}
main().catch(console.error).finally(() => prisma.$disconnect());
