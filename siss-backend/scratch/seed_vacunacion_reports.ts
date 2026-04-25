
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const reports = [
    {
      nombre: 'Consolidado de Vacunación (PAI)',
      descripcion: 'Listado detallado de dosis aplicadas por periodo.',
      categoria: 'VACUNACION',
      slug: 'consolidado-pai',
      tipo: 'EXCEL',
      permiso: 'vacunacion:leer',
      icono: 'document-text',
      activo: true,
      orden: 1
    },
    {
      nombre: 'Inventario de Biológicos',
      descripcion: 'Estado de existencias, lotes y vencimientos de vacunas.',
      categoria: 'VACUNACION',
      slug: 'inventario-vacunas',
      tipo: 'EXCEL',
      permiso: 'vacunacion:leer',
      icono: 'archive',
      activo: true,
      orden: 2
    },
    {
      nombre: 'Análisis de Cobertura',
      descripcion: 'Reporte de población vacunada vs meta (PDF).',
      categoria: 'VACUNACION',
      slug: 'cobertura-vacunacion',
      tipo: 'PDF',
      permiso: 'vacunacion:leer',
      icono: 'chart-bar',
      activo: true,
      orden: 3
    }
  ];

  console.log('Insertando nuevos reportes de vacunación...');
  for (const r of reports) {
    await prisma.reporteDisponible.upsert({
      where: { slug: r.slug },
      update: r,
      create: r
    });
  }
  console.log('Reportes insertados con éxito.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
