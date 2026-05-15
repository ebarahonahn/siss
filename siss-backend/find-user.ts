import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.pacienteUsuario.findFirst({
    where: { dni: "0106596322112" },
    select: { id: true, correo: true, dni: true, pacienteId: true }
  });
  console.log(JSON.stringify(user));
}
main().catch(console.error).finally(() => prisma.$disconnect());
