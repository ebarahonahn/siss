import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const p = await prisma.parametroSistema.findUnique({
    where: { clave: 'MINUTOS_INACTIVIDAD_SESION' }
  });
  console.log('--- PARAMETRO DE INACTIVIDAD ---');
  console.log(p);
  console.log('---------------------------------');
  await prisma.$disconnect();
}

check();
