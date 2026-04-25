import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const identificador = '0801197106887';
  const establecimientoId = 1;

  const recetas = await prisma.receta.findMany({
    where: {
      establecimientoId,
      estado: { in: ['PENDIENTE', 'PARCIAL'] },
      paciente: {
        OR: [
          { dni: identificador },
          { numeroExpediente: identificador },
          { nombres: { contains: identificador } },
          { apellidos: { contains: identificador } }
        ]
      }
    },
    include: {
      paciente: true
    }
  });

  console.log('Recetas encontradas:', recetas.length);
  recetas.forEach(r => {
    console.log(`ID: ${r.id}, Paciente: ${r.paciente.nombres}, DNI: ${r.paciente.dni}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
