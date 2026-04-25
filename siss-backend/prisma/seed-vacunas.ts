
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando catálogos de vacunación (PAI Honduras)...');

  const vacunas = [
    {
      nombre: 'BCG',
      descripcion: 'Vacuna contra la Tuberculosis (Formas graves)',
      tipo: 'BACTERIANA_ATENUADA',
      poblacionMeta: 'Recién nacidos',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 0, descripcion: 'Dosis Única' }
      ]
    },
    {
      nombre: 'Hepatitis B (Recién Nacido)',
      descripcion: 'Previene la transmisión vertical de Hepatitis B',
      tipo: 'RECOMBINANTE',
      poblacionMeta: 'Recién nacidos (<24h)',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 0, descripcion: 'Dosis única al nacer' }
      ]
    },
    {
      nombre: 'Pentavalente (DPT+HB+Hib)',
      descripcion: 'Difteria, Tétanos, Tos Ferina, Hep B, Influenza tipo b',
      tipo: 'BACTERIANA_INACTIVADA',
      poblacionMeta: 'Lactantes',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 2, descripcion: 'Primera Dosis' },
        { numeroDosis: 2, edadRecomendadaMeses: 4, descripcion: 'Segunda Dosis' },
        { numeroDosis: 3, edadRecomendadaMeses: 6, descripcion: 'Tercera Dosis' }
      ]
    },
    {
      nombre: 'Polio (IPV/OPV)',
      descripcion: 'Vacuna contra la Poliomielitis',
      tipo: 'VIRAL_INACTIVADA',
      poblacionMeta: 'Lactantes',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 2, descripcion: 'Primera Dosis (IPV)' },
        { numeroDosis: 2, edadRecomendadaMeses: 4, descripcion: 'Segunda Dosis (OPV)' },
        { numeroDosis: 3, edadRecomendadaMeses: 6, descripcion: 'Tercera Dosis (OPV)' },
        { numeroDosis: 4, edadRecomendadaMeses: 18, descripcion: 'Primer Refuerzo' },
        { numeroDosis: 5, edadRecomendadaMeses: 48, descripcion: 'Segundo Refuerzo' }
      ]
    },
    {
      nombre: 'Rotavirus',
      descripcion: 'Previene diarreas graves por Rotavirus',
      tipo: 'VIRAL_ATENUADA',
      poblacionMeta: 'Lactantes',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 2, descripcion: 'Primera Dosis' },
        { numeroDosis: 2, edadRecomendadaMeses: 4, descripcion: 'Segunda Dosis' }
      ]
    },
    {
      nombre: 'Neumococo Conjugada',
      descripcion: 'Previene Neumonía y Meningitis por Neumococo',
      tipo: 'BACTERIANA_INACTIVADA',
      poblacionMeta: 'Lactantes',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 2, descripcion: 'Primera Dosis' },
        { numeroDosis: 2, edadRecomendadaMeses: 4, descripcion: 'Segunda Dosis' },
        { numeroDosis: 3, edadRecomendadaMeses: 12, descripcion: 'Refuerzo' }
      ]
    },
    {
      nombre: 'SRP',
      descripcion: 'Sarampión, Rubeola y Parotiditis',
      tipo: 'VIRAL_ATENUADA',
      poblacionMeta: 'Infantil',
      esquemas: [
        { numeroDosis: 1, edadRecomendadaMeses: 12, descripcion: 'Primera Dosis' },
        { numeroDosis: 2, edadRecomendadaMeses: 18, descripcion: 'Segunda Dosis' }
      ]
    },
    {
      nombre: 'DPT',
      descripcion: 'Difteria, Tétanos y Tos Ferina (Refuerzos)',
      tipo: 'BACTERIANA_INACTIVADA',
      poblacionMeta: 'Infantil',
      esquemas: [
        { numeroDosis: 4, edadRecomendadaMeses: 18, descripcion: 'Primer Refuerzo' },
        { numeroDosis: 5, edadRecomendadaMeses: 48, descripcion: 'Segundo Refuerzo' }
      ]
    }
  ];

  for (const vData of vacunas) {
    const { esquemas, ...rest } = vData;
    const vacuna = await prisma.catVacuna.upsert({
      where: { nombre: rest.nombre },
      update: rest as any,
      create: rest as any,
    });

    for (const e of esquemas) {
      await prisma.esquemaVacunacion.upsert({
        where: { 
          vacunaId_numeroDosis: { 
            vacunaId: vacuna.id, 
            numeroDosis: e.numeroDosis 
          } 
        },
        update: e,
        create: { ...e, vacunaId: vacuna.id },
      });
    }
  }

  console.log('✔ Catálogos de vacunas y esquemas PAI creados exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
