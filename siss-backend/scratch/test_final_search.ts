import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const term = '08011971';
  const establecimientoId = 1;

  const recetas = await prisma.receta.findMany({
    where: {
      establecimientoId,
      estado: { in: ['PENDIENTE', 'PARCIAL'] },
      paciente: {
        OR: [
          { dni: { contains: term } },
          { numeroExpediente: { contains: term } },
          { nombres: { contains: term } },
          { apellidos: { contains: term } }
        ]
      }
    },
    include: {
      paciente: true
    }
  });

  console.log('Recetas encontradas:', recetas.length);
  recetas.forEach(r => {
    console.log(`ID: ${r.id}, Paciente: ${r.paciente.nombres}, DNI: ${r.paciente.dni}, Estado: ${r.estado}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
