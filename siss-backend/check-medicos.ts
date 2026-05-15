import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const medicos = await prisma.usuario.findMany({
    where: {
      rol: {
        nombre: 'MEDICO'
      }
    },
    select: { nombres: true, apellidos: true }
  });
  console.log(JSON.stringify(medicos));
}
main().catch(console.error).finally(() => prisma.$disconnect());
