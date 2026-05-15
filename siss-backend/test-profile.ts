import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const dni = "0801197106887";
  const include = {
      alergias: true,
      citas: {
        take: 5,
        orderBy: { fechaHora: 'desc' },
        include: {
          medico: {
            select: {
              nombres: true,
              apellidos: true,
              especialidad: { select: { nombre: true } },
            },
          },
        },
      },
      historialClinico: {
        take: 20,
        orderBy: { fecha: 'desc' },
        select: {
          id: true,
          fecha: true,
          analisis: true,
          medico: { 
            select: { 
              nombres: true, 
              apellidos: true,
              establecimiento: { select: { nombre: true } },
            } 
          },
          diagnosticos: {
            select: { codigoCIE10: true, descripcion: true, tipo: true },
          },
        },
      },
      medicamentosActivos: {
        where: { fin: null },
        include: { medicamento: true },
      },
      recetas: {
        take: 10,
        orderBy: { creadaEn: 'desc' },
        include: {
          establecimiento: { select: { nombre: true } },
          detalles: { include: { medicamento: true } },
        },
      },
    };

  const paciente = await prisma.paciente.findUnique({
    where: { dni },
    include: include as any,
  });
  console.log(JSON.stringify(paciente));
}
main().catch(console.error).finally(() => prisma.$disconnect());
