const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Usuarios ---');
  const u = await prisma.usuario.findMany({ include: { rol: true } });
  console.log(JSON.stringify(u, null, 2));

  console.log('--- Roles ---');
  const r = await prisma.rol.findMany();
  console.log(JSON.stringify(r, null, 2));

  console.log('--- Ultimas Historias Clinicas ---');
  const hc = await prisma.historiaClinica.findMany({ take: 5, orderBy: { id: 'desc' } });
  console.log(JSON.stringify(hc, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
