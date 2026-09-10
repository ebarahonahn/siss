import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Sincronizando especialidades y servicios de Odontología para usuarios con rol ODONTOLOGIA...');
  const usuarios = await prisma.usuario.findMany({
    where: { rol: { nombre: 'ODONTOLOGIA' } },
    include: { rol: true, asignaciones: { where: { activo: true } } }
  });

  let count = 0;
  for (const usuario of usuarios) {
    // Asegurar que el usuario tiene especialidadId = 11
    if (usuario.especialidadId !== 11) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { especialidadId: 11 }
      });
      console.log(`Usuario principal ${usuario.nombres} ${usuario.apellidos} actualizado a especialidad Odontología (11)`);
    }

    for (const asignacion of usuario.asignaciones) {
      // Buscar servicio de odontologia del establecimiento
      const servicioOdonto = await prisma.servicio.findFirst({
        where: {
          establecimientoId: asignacion.establecimientoId,
          catServicioId: 6, // ODONTOLOGIA
          activo: true
        }
      });

      if (asignacion.especialidadId !== 11 || asignacion.servicioId !== (servicioOdonto?.id || null)) {
        await prisma.asignacionUsuario.update({
          where: { id: asignacion.id },
          data: {
            especialidadId: 11,
            servicioId: servicioOdonto ? servicioOdonto.id : null
          }
        });
        console.log(`Asignación ID ${asignacion.id} (Establecimiento ${asignacion.establecimientoId}) actualizada:`);
        console.log(`  - especialidadId -> 11`);
        console.log(`  - servicioId -> ${servicioOdonto ? servicioOdonto.id : 'null'}`);
        count++;
      }
    }
  }

  console.log(`Proceso completado. Se alinearon ${count} asignación(es) de Odontología.`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
