const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.solicitudUsuario.count();
    console.log('Total solicitudes en DB:', count);
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tablas en la base de datos:', JSON.stringify(tables, null, 2));
  } catch (e) {
    console.error('Error al consultar la base de datos:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
