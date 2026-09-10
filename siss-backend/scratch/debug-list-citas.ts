import { PrismaClient } from '@prisma/client';
import { CitasService } from '../src/modules/citas/citas.service';

const prisma = new PrismaClient();

async function main() {
  const email = 'odontologo@siss.hn';
  console.log(`[DEBUG] Simulando listado de citas para: ${email}`);

  const user = await prisma.usuario.findFirst({
    where: { correo: email },
    include: { rol: true }
  });

  if (!user) {
    console.log('[DEBUG] Usuario no encontrado');
    return;
  }

  const service = new CitasService(prisma as any, null as any);

  // Simular los parámetros que CitasController pasa al listar:
  // user.establecimientoId, [user.rol.nombre], user.id, fecha
  const roles = [user.rol?.nombre || 'ODONTOLOGIA'];
  const establecimientoId = user.establecimientoId || 1;
  const usuarioId = user.id;
  const fecha = '2026-08-01';

  console.log('Parámetros de entrada:', { establecimientoId, roles, usuarioId, fecha });

  const result = await service.listar(establecimientoId, roles, usuarioId, fecha);
  console.log('Total citas devueltas:', result.length);
  console.log('Detalle de citas:');
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
