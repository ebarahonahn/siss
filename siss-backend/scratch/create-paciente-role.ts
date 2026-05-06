import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rol = await prisma.rol.upsert({
    where: { nombre: 'PACIENTE' },
    update: {},
    create: {
      nombre: 'PACIENTE',
      descripcion: 'Usuario con acceso a servicios personales de salud',
      permisos: {
        citas: ['leer', 'crear'],
        pacientes: ['leer'],
        notificaciones: ['leer'],
      },
    },
  });
  console.log('Rol creado:', rol);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
