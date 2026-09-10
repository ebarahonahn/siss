import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.usuario.findUnique({
    where: { correo: 'recepcion@siss.hn' },
    select: { establecimientoId: true }
  });
  console.log('Establecimiento de Recepción:', user?.establecimientoId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
