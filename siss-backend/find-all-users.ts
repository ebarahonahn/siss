import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.pacienteUsuario.findMany({
    select: { id: true, correo: true, dni: true, pacienteId: true }
  });
  console.log(JSON.stringify(users));
}
main().catch(console.error).finally(() => prisma.$disconnect());
