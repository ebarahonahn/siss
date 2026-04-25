
import { PrismaClient } from '@prisma/client';

async function query() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.usuario.findUnique({
      where: { id: 3 },
      select: { id: true, nombres: true, establecimientoId: true }
    });
    console.log('Usuario 3:', user);

  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

query();
