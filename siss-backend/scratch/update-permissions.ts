import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Restaurar ODONTOLOGIA (ID 11) a sus permisos asignados por el administrador
  await prisma.rol.update({
    where: { id: 11 },
    data: {
      permisos: {
        triaje: ['leer', 'crear'],
        historia_clinica: ['leer', 'crear', 'editar']
      }
    }
  });
  console.log('Permisos de ODONTOLOGIA restaurados a la configuración del administrador.');

  // 2. Restaurar MEDICO_PEDIATRA (ID 10) a sus permisos asignados por el administrador
  await prisma.rol.update({
    where: { id: 10 },
    data: {
      permisos: {
        pediatria: ['leer', 'crear'],
        historia_clinica: ['leer', 'crear', 'editar']
      }
    }
  });
  console.log('Permisos de MEDICO_PEDIATRA restaurados a la configuración del administrador.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
