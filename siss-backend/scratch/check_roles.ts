import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.rol.findFirst({ where: { nombre: 'MEDICO' } });
  console.log('ROL MEDICO EN BD:');
  console.log(JSON.stringify(rol, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
