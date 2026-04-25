
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.usuario.findMany({ select: { id: true, nombres: true, apellidos: true, activo: true, rol: { select: { nombre: true } } } });
  console.log('Usuarios:', users);
}
main().finally(() => prisma.$disconnect());
