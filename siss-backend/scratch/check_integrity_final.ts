import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('--- DIAGNÓSTICO DE INTEGRIDAD FINAL ---');

  const p1 = await prisma.plantillaFormulario.findUnique({ where: { id: 1 } });
  console.log('Plantilla 1:', p1 ? 'Existe' : 'NO EXISTE');

  const esp1 = await prisma.especialidad.findUnique({ where: { id: 1 } });
  console.log('Especialidad 1:', esp1 ? 'Existe' : 'NO EXISTE');

  const est1 = await prisma.establecimiento.findUnique({ where: { id: 1 } });
  console.log('Establecimiento 1 (Nuevamente):', est1 ? 'Existe' : 'NO EXISTE');

  await prisma.$disconnect();
}

main();
