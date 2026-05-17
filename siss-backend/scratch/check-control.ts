import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Searching for ControlPrenatal with ID 25...');
  const control = await prisma.controlPrenatal.findUnique({
    where: { id: 25 },
    include: {
      embarazo: {
        include: {
          paciente: true
        }
      }
    }
  });

  if (!control) {
    console.log('ControlPrenatal not found in database!');
    return;
  }

  console.log('ControlPrenatal found:', JSON.stringify(control, null, 2));

  if (!control.historiaClinicaId) {
    console.log('Control has no historiaClinicaId!');
    return;
  }

  console.log('Searching for HistoriaClinica with ID:', control.historiaClinicaId);
  const historia = await prisma.historiaClinica.findUnique({
    where: { id: control.historiaClinicaId },
    include: {
      diagnosticos: true,
      recetas: true,
      solicitudesLab: true,
      solicitudesRad: true
    }
  });

  if (!historia) {
    console.log('HistoriaClinica not found!');
  } else {
    console.log('HistoriaClinica found:', JSON.stringify(historia, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
