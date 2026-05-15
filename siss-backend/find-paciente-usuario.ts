import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Uso: npx ts-node find-paciente-usuario.ts <email>');
    return;
  }

  if (email === 'list-all') {
    const users = await prisma.pacienteUsuario.findMany();
    console.log('Todos los usuarios en pacientes_usuarios:');
    console.log(JSON.stringify(users, null, 2));
    return;
  }

  const user = await prisma.pacienteUsuario.findUnique({
    where: { correo: email },
  });

  if (user) {
    console.log('Usuario encontrado en pacientes_usuarios:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('No se encontró ningún usuario con ese correo en pacientes_usuarios.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
