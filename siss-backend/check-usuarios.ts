import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { nombres: true, apellidos: true, rol: { select: { nombre: true } } }
  });
  console.log(JSON.stringify(usuarios, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
