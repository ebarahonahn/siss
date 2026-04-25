
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const rol = await prisma.rol.findFirst({ where: { nombre: 'ADMIN_ESTABLECIMIENTO' } });
  console.log('Permisos ADMIN_ESTABLECIMIENTO:', JSON.stringify(rol?.permisos, null, 2));
}
main().finally(() => prisma.$disconnect());
