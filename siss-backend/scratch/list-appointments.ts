
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const citas = await prisma.cita.findMany({
    include: {
      paciente: true,
      medico: true,
      establecimiento: true
    },
    orderBy: {
      fechaHora: 'desc'
    }
  });

  console.log('CITAS ENCONTRADAS:');
  citas.forEach(c => {
    console.log(`ID: ${c.id}, Paciente: ${c.paciente.nombres} ${c.paciente.apellidos}, Fecha: ${c.fechaHora.toISOString()}, Estado: ${c.estado}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
