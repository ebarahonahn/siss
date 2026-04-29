import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const camas = await prisma.cama.findMany({
    include: {
      habitacion: {
        include: {
          sala: true
        }
      }
    }
  });

  console.log('Total camas:', camas.length);
  camas.forEach(c => {
    console.log(`Cama: ${c.codigo}, Estado: ${c.estado}, Activo: ${c.activo}, ServicioId: ${c.habitacion.sala.servicioId}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
