import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.usuario.findFirst({
    where: { correo: 'medico@siss.hn' },
    include: {
      rol: true,
      asignaciones: {
        include: {
          rol: true,
          establecimiento: true
        }
      }
    }
  });
  console.log('USUARIO MEDICO:');
  console.log(JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
