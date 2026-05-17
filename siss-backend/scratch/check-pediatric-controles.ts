import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- TEST MAP CONTROLES PARA GRAFICA ---');
  const paciente = await prisma.paciente.findFirst({
    where: { nombres: { contains: 'CHRISTIAN' } }
  });

  if (!paciente) {
    console.log('Paciente no encontrado');
    return;
  }

  const controles = await prisma.controlNiñoSano.findMany({
    where: { pacienteId: paciente.id, activo: true }
  });

  const nac = new Date(paciente.fechaNacimiento);
  let maxMonths = 60;
  controles.forEach(c => {
    const fechaC = new Date(c.creadoEn);
    const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
    if (!isNaN(x) && x > maxMonths) {
      maxMonths = x;
    }
  });

  if (maxMonths > 60) {
    maxMonths = 120;
  } else {
    maxMonths = 60;
  }

  console.log(`maxMonths: ${maxMonths}`);

  const validControles = (controles || [])
    .map(c => {
      const fechaC = new Date(c.creadoEn);
      const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
      return { x, y: parseFloat(c.peso.toString()) };
    })
    .filter(c => !isNaN(c.x) && !isNaN(c.y) && c.x >= 0 && c.x <= maxMonths)
    .sort((a, b) => a.x - b.x);

  console.log('Controles válidos para la gráfica:');
  console.log(validControles);
}

main().catch(console.error).finally(() => prisma.$disconnect());
