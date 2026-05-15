import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.embarazo.count();
  const activos = await prisma.embarazo.findMany({
    where: { estado: 'ACTIVO' },
    include: { paciente: true }
  });

  console.log('--- DIAGNÓSTICO DE DATOS ---');
  console.log('Total embarazos en DB:', total);
  console.log('Embarazos activos:', activos.length);
  activos.forEach(a => {
    console.log(`- Paciente: ${a.paciente.nombres} ${a.paciente.apellidos} | DNI: ${a.paciente.dni} | Estado: ${a.estado}`);
  });
  console.log('----------------------------');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
