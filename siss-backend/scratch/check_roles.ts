
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const roles = await prisma.rol.findMany();
  console.log('Roles:', roles);
}
main().finally(() => prisma.$disconnect());
