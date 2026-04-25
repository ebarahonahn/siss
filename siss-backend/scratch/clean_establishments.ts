import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando limpieza de establecimientos duplicados...');

  // Eliminar los antiguos (ID 1 y 2 según nuestro listado previo)
  // Pero lo haremos por código para mayor seguridad
  const codigosBorrar = ['HNS-001', 'CS-002'];

  for (const codigo of codigosBorrar) {
    const e = await prisma.establecimiento.findUnique({ where: { codigo } });
    if (e) {
      // Nota: Si hay relaciones (pacientes, citas, etc.) esto podría fallar.
      // Pero como estamos en fase de estabilización, limpiaremos las relaciones si existen.
      console.log(`Borrando establecimiento antiguo: ${codigo} (${e.nombre})`);
      
      // Desvincular usuarios
      await prisma.usuario.updateMany({
        where: { establecimientoId: e.id },
        data: { establecimientoId: 3 } // Mover al HNT-001 (ID 3) temporalmente si es necesario
      });

      // Borrar asignaciones
      await prisma.asignacionUsuario.deleteMany({ where: { establecimientoId: e.id } });
      
      // Borrar servicios vinculados
      await prisma.servicio.deleteMany({ where: { establecimientoId: e.id } });

      // Finalmente borrar el establecimiento
      await prisma.establecimiento.delete({ where: { id: e.id } });
      console.log(`✔ ${codigo} eliminado.`);
    }
  }

  console.log('Limpieza completada.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
