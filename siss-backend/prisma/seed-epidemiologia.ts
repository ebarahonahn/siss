import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Actualizando diagnósticos de notificación obligatoria...');

  const notificables = [
    { codigo: 'A90', descripcion: 'Fiebre del dengue [dengue clasico]', notificable: true },
    { codigo: 'A91', descripcion: 'Fiebre del dengue hemorragico', notificable: true },
    { codigo: 'B05', descripcion: 'Sarampion', notificable: true },
    { codigo: 'B05.0', descripcion: 'Sarampion complicado con encefalitis', notificable: true },
    { codigo: 'B05.9', descripcion: 'Sarampion sin complicaciones', notificable: true },
    { codigo: 'A92.8', descripcion: 'Fiebre de Oropouche y otras fiebres virales especificadas transmitidas por mosquitos', notificable: true },
    { codigo: 'B06', descripcion: 'Rubeola [sarampion aleman]', notificable: true },
    { codigo: 'A95', descripcion: 'Fiebre amarilla', notificable: true },
    { codigo: 'A82', descripcion: 'Rabia', notificable: true },
  ];

  for (const diag of notificables) {
    await prisma.catDiagnostico.upsert({
      where: { codigo: diag.codigo },
      update: { notificable: true },
      create: {
        codigo: diag.codigo,
        descripcion: diag.descripcion,
        notificable: true,
        activo: true,
        capitulo: 'Vigilancia Especial'
      },
    });
  }

  console.log('✔ Diagnósticos actualizados con éxito');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
