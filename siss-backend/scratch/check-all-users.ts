import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- USUARIOS INSTITUCIONALES ---');
  const users = await prisma.usuario.findMany({
    select: { id: true, correo: true, activo: true }
  });
  console.log(users);

  console.log('\n--- PACIENTES USUARIOS ---');
  const pacientes = await prisma.pacienteUsuario.findMany({
    select: { id: true, correo: true, activo: true }
  });
  console.log(pacientes);
}

main().finally(() => prisma.$disconnect());
