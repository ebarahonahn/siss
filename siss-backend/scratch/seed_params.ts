import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ParametroSistema...');
  
  await prisma.parametroSistema.upsert({
    where: { clave: 'DIAS_VIGENCIA_RECETA' },
    update: {},
    create: {
      clave: 'DIAS_VIGENCIA_RECETA',
      valor: '30',
      descripcion: 'Días de vigencia de una receta para dispensación parcial o total antes de marcar como demanda insatisfecha'
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
