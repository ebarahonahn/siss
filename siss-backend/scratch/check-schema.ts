import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSchema() {
  console.log('--- ESTRUCTURA DE embarazos_antecedentes ---');
  const cols: any = await prisma.$queryRawUnsafe('DESCRIBE embarazos_antecedentes');
  cols.forEach((c: any) => {
    console.log(`Columna: ${c.Field} | Tipo: ${c.Type}`);
  });
}

checkSchema().finally(() => prisma.$disconnect());
