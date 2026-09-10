import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plantillas = await prisma.plantillaFormulario.findMany({
    select: {
      id: true,
      nombre: true,
      especialidadId: true,
      activa: true,
      especialidad: {
        select: {
          nombre: true
        }
      }
    }
  });

  console.log('Todas las plantillas:', JSON.stringify(plantillas, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
