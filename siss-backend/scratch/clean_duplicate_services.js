const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log('Iniciando limpieza de servicios duplicados...');
  
  try {
    const servicios = await prisma.servicio.findMany();
    const seen = new Set();
    const toDelete = [];

    for (const s of servicios) {
      const key = `${s.establecimientoId}-${s.nombre.trim().toUpperCase()}`;
      if (seen.has(key)) {
        toDelete.push(s.id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      console.log(`Encontrados ${toDelete.length} duplicados. Eliminando...`);
      await prisma.servicio.deleteMany({
        where: { id: { in: toDelete } }
      });
      console.log('✔ Limpieza completada exitosamente.');
    } else {
      console.log('No se encontraron servicios duplicados.');
    }
  } catch (err) {
    console.error('Error durante la limpieza:', err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDuplicates();
