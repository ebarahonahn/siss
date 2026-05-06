import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.pacienteUsuario.findMany({
    include: { paciente: true }
  });
  console.log('Mobile Users:', JSON.stringify(users, null, 2));
}
main().finally(() => prisma.$disconnect());
