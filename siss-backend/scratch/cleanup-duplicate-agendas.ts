import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando duplicados en agendaBase...');
  
  // Buscar todas las agendas
  const agendas = await prisma.agendaBase.findMany({
    orderBy: { id: 'desc' }
  });

  const seen = new Set<string>();
  const toDelete: number[] = [];

  for (const a of agendas) {
    const key = `${a.medicoId}_${a.establecimientoId}_${a.diaSemana}`;
    if (seen.has(key)) {
      // Ya vimos un registro más nuevo para este mismo día, marcar este anterior para eliminar
      toDelete.push(a.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Eliminando ${toDelete.length} registros duplicados de agenda base...`);
    const res = await prisma.agendaBase.deleteMany({
      where: { id: { in: toDelete } }
    });
    console.log(`Limpieza completada. ${res.count} registros eliminados.`);
  } else {
    console.log('No se encontraron registros duplicados.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
