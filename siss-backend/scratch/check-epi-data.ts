import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('--- AUDITORÍA DE DATOS EPIDEMIOLÓGICOS ---');
  
  const totalNotificaciones = await prisma.notificacionEpidemiologica.count();
  console.log(`Total de Notificaciones: ${totalNotificaciones}`);
  
  const conCoordenadas = await prisma.notificacionEpidemiologica.count({
    where: {
      latitud: { not: null },
      longitud: { not: null }
    }
  });
  console.log(`Notificaciones con Lat/Long (Mapa de Calor): ${conCoordenadas}`);
  
  const dxInmediatos = await prisma.catDiagnostico.count({
    where: { notificacionInmediata: true }
  });
  console.log(`Diagnósticos marcados como "Inmediata": ${dxInmediatos}`);
  
  const alertasTiempo = await prisma.notificacionEpidemiologica.count({
    where: {
      diagnosticoCIE10: {
        in: (await prisma.catDiagnostico.findMany({ 
          where: { notificacionInmediata: true }, 
          select: { codigo: true } 
        })).map(d => d.codigo)
      },
      creadoEn: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  });
  console.log(`Alertas Pendientes (>24h): ${alertasTiempo}`);
  
  const casosPorSemana = await prisma.historiaClinica.groupBy({
    by: ['semanaEpidemiologica'],
    where: {
      notificacionEpidemiologica: { isNot: null }
    },
    _count: { id: true }
  });
  console.log('Casos agrupados por Semana Epidemiológica:', casosPorSemana);
  
  await prisma.$disconnect();
}

checkData().catch(console.error);
