import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const recetas = await prisma.receta.findMany({
    include: {
      paciente: true,
      establecimiento: true,
    }
  });

  console.log('Total recetas:', recetas.length);
  recetas.forEach(r => {
    console.log(`ID: ${r.id}, Paciente: ${r.paciente.nombres}, Estado: ${r.estado}, Establecimiento: ${r.establecimientoId} (${r.establecimiento.nombre})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
