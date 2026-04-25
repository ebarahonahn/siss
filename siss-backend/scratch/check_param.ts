import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const param = await prisma.parametroSistema.findUnique({
    where: { clave: 'MARGEN_DIAS_TRASLAPE_RECETA' }
  });
  console.log('VALOR_PARAMETRO:', param);
}

main().finally(() => prisma.$disconnect());
