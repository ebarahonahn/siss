import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.pacienteUsuario.findFirst({
    where: { correo: 'edgar0371@gmail.com' }
  });
  console.log('User:', JSON.stringify(user, null, 2));
}
main().finally(() => prisma.$disconnect());
