import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('--- DIAGNÓSTICO DE INTEGRIDAD ---');

  const pac = await prisma.paciente.findUnique({ where: { id: 4 } });
  console.log('Paciente 4:', pac ? 'Existe' : 'NO EXISTE');

  const med1 = await prisma.medicamento.findUnique({ where: { id: 31 } });
  const med2 = await prisma.medicamento.findUnique({ where: { id: 9 } });
  console.log('Medicamento 31:', med1 ? 'Existe' : 'NO EXISTE');
  console.log('Medicamento 9:', med2 ? 'Existe' : 'NO EXISTE');

  const est = await prisma.establecimiento.findUnique({ where: { id: 1 } });
  console.log('Establecimiento 1:', est ? 'Existe' : 'NO EXISTE');

  const user3 = await prisma.usuario.findUnique({ where: { id: 3 } });
  console.log('Usuario 3 (Médico):', user3 ? 'Existe' : 'NO EXISTE');

  const cita5 = await prisma.cita.findUnique({ where: { id: 5 } });
  console.log('Cita 5:', cita5 ? 'Existe' : 'NO EXISTE');

  await prisma.$disconnect();
}

main();
