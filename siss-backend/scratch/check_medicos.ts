
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const medicos = await prisma.usuario.findMany({
    where: {
      rol: { nombre: 'MEDICO' }
    },
    include: {
      rol: true,
      establecimiento: true
    }
  });

  console.log('Medicos encontrados:', medicos.length);
  medicos.forEach(m => {
    console.log(`ID: ${m.id}, Nombre: ${m.nombres} ${m.apellidos}, Establecimiento: ${m.establecimiento?.nombre}`);
  });

  const totalUsuarios = await prisma.usuario.count();
  console.log('Total usuarios:', totalUsuarios);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
