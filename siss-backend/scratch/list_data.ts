
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const ests = await prisma.establecimiento.findMany();
  console.log('Establecimientos:', ests.map(e => ({ id: e.id, nombre: e.nombre })));
  
  const users = await prisma.usuario.findMany({ select: { id: true, nombres: true, apellidos: true, establecimientoId: true, especialidadId: true, rol: { select: { nombre: true } } } });
  console.log('Usuarios:', users);
}
main().finally(() => prisma.$disconnect());
