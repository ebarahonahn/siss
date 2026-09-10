import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usuarioId = 1;
  const reporteIds = [1, 2, 3];

  await prisma.$transaction(async (tx: any) => {
    await tx.usuarioReporte.deleteMany({
      where: { usuarioId },
    });

    if (reporteIds && reporteIds.length > 0) {
      await tx.usuarioReporte.createMany({
        data: reporteIds.map((reporteId) => ({
          usuarioId,
          reporteId,
        })),
      });
    }
  });

  const res = await (prisma as any).usuarioReporte.findMany({ where: { usuarioId } });
  console.log('RESULTADO ASIGNACION:', res);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
