const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const vacunas = await prisma.catVacuna.findMany({
    where: { activo: true },
    include: { esquemas: true }
  });
  console.log('VACUNAS ACTIVAS:', vacunas.length);
  vacunas.forEach(v => {
    console.log(`- ${v.nombre} (${v.esquemas.length} dosis)`);
  });
  
  const aplicaciones = await prisma.vacunacionRegistro.findMany({
    where: { pacienteId: 35 }
  });
  console.log('APLICACIONES PACIENTE 35:', aplicaciones);
}
main().finally(() => prisma.$disconnect());
