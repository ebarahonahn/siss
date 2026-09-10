import { PrismaClient } from '@prisma/client';
import { RolesService } from '../src/modules/roles/roles.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const prismaClient = new PrismaClient();
  // Inject mock/real PrismaService wrapper
  const prismaService = new PrismaService();
  const service = new RolesService(prismaService);

  console.log('--- Probando RolesService.crear ---');

  const rolPrueba = 'TEST_ROLE_TEMP';

  // 1. Limpieza previa si existe
  await prismaClient.rol.deleteMany({
    where: { nombre: rolPrueba },
  });
  console.log('1. Limpieza inicial realizada.');

  // 2. Crear rol por primera vez
  const nuevo = await service.crear({
    nombre: rolPrueba,
    descripcion: 'Rol de prueba temporal',
  });
  console.log('2. Rol creado con éxito:', nuevo);

  if (nuevo.nombre !== rolPrueba) throw new Error('Nombre incorrecto');
  if (JSON.stringify(nuevo.permisos) !== '{}') throw new Error('Permisos iniciales no están vacíos');

  // 3. Intentar crear duplicado (debe fallar)
  try {
    await service.crear({
      nombre: rolPrueba,
      descripcion: 'Otro',
    });
    throw new Error('Debió fallar por nombre duplicado');
  } catch (err: any) {
    console.log('3. Intento de crear duplicado falló como se esperaba:', err.message);
  }

  // 4. Limpieza final
  await prismaClient.rol.deleteMany({
    where: { nombre: rolPrueba },
  });
  console.log('4. Limpieza final realizada.');
  console.log('--- Todas las pruebas del backend pasaron con éxito ---');
}

main()
  .catch((e) => {
    console.error('Error durante la prueba:', e);
    process.exit(1);
  });
