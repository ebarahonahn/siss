import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- DETALLE DE CONTROLES PRENATALES ---');
  const controles = await prisma.controlPrenatal.findMany({
    orderBy: { fechaControl: 'asc' },
    include: {
      embarazo: {
        include: {
          paciente: true
        }
      }
    }
  });

  controles.forEach((c, i) => {
    console.log(`Control #${i + 1}:`);
    console.log(`- Fecha Control (fechaControl): ${c.fechaControl}`);
    console.log(`- Semanas: ${c.semanasGestacion}`);
    console.log(`- Paciente: ${c.embarazo.paciente.nombres}`);
    console.log('----------------------------');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
