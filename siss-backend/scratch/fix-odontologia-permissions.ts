import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.rol.findFirst({
    where: { nombre: 'ODONTOLOGIA' }
  });

  if (!rol) {
    console.log('Rol ODONTOLOGIA no encontrado');
    return;
  }

  const permisos: any = rol.permisos || {};
  if (!permisos.citas) {
    permisos.citas = ['leer'];
  } else if (!permisos.citas.includes('leer')) {
    permisos.citas.push('leer');
  }

  await prisma.rol.update({
    where: { id: rol.id },
    data: { permisos }
  });

  console.log('Permisos del rol ODONTOLOGIA actualizados en la base de datos:', JSON.stringify(permisos, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
