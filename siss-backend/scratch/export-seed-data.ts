import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function exportData() {
  const data: any = {};
  
  data.roles = await prisma.rol.findMany({ select: { nombre: true, descripcion: true, permisos: true } });
  data.servicios = await prisma.catServicio.findMany({ select: { nombre: true, descripcion: true, activo: true } });
  data.especialidades = await prisma.especialidad.findMany({ select: { codigo: true, nombre: true, descripcion: true, activa: true } });
  data.reportes = await (prisma as any).reporteDisponible.findMany();
  data.parametros = await prisma.parametroSistema.findMany({ select: { clave: true, valor: true, descripcion: true } });
  data.vacunas = await prisma.catVacuna.findMany({ select: { nombre: true, descripcion: true, tipo: true, poblacionMeta: true, activo: true } });
  
  // Exámenes de laboratorio y radiología (solo una muestra o conteo si son muchos)
  data.countLaboratorio = await prisma.catExamenLaboratorio.count();
  data.countRadiologia = await prisma.catExamenRadiologico.count();
  
  console.log(JSON.stringify(data, null, 2));
  await prisma.$disconnect();
}

exportData();
