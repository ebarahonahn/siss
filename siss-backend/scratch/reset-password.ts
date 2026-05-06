import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('test1234', 12);
  await prisma.usuario.update({
    where: { correo: 'edgar0371@gmail.com' },
    data: { contrasenaHash: hash }
  });
  console.log('Password reset to: test1234');
}

main().finally(() => prisma.$disconnect());
