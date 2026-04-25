import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('--- GENERANDO DATOS DE PRUEBA EPIDEMIOLÓGICOS ---');

  // 1. Marcar diagnósticos como inmediatos
  const codigosInmediatos = ['A90', 'A00', 'B05', 'A92.0', 'B01.9']; // Dengue, Cólera, Sarampión, Chikungunya, Varicela
  await prisma.catDiagnostico.updateMany({
    where: { codigo: { in: codigosInmediatos } },
    data: { notificable: true, notificacionInmediata: true }
  });
  console.log('Catálogo CIE-10 actualizado con alertas inmediatas.');

  // 2. Obtener un médico y un paciente existente
  const medico = await prisma.usuario.findFirst({ 
    where: { 
      rol: { nombre: 'MEDICO' } 
    } 
  });
  const paciente = await prisma.paciente.findFirst();

  if (!medico || !paciente) {
    console.error('No se encontró médico o paciente para generar datos.');
    return;
  }

  // 3. Generar 30 casos aleatorios en los últimos 30 días
  // Coordenadas aproximadas de Tegucigalpa: 14.08, -87.20
  const casos: any[] = [];
  for (let i = 0; i < 40; i++) {
    const lat = 14.05 + Math.random() * 0.1;
    const lng = -87.25 + Math.random() * 0.1;
    const diasAtras = Math.floor(Math.random() * 60); // Algunos antiguos para alertas de >24h
    const fecha = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
    const dx = codigosInmediatos[Math.floor(Math.random() * codigosInmediatos.length)];

    // Crear Historia Clínica mínima
    const hc: any = await (prisma.historiaClinica as any).create({
      data: {
        pacienteId: paciente.id,
        medicoId: medico.id,
        fecha: fecha,
        semanaEpidemiologica: Math.floor(Math.random() * 5) + 12, // Semanas 12 a 17
        subjetivo: 'Caso de prueba',
        objetivo: 'Generado automáticamente',
        analisis: 'Diagnóstico sospechoso',
        plan: 'Manejo epidemiológico',
        notificacionEpidemiologica: {
          create: {
            pacienteId: paciente.id,
            diagnosticoCIE10: dx,
            latitud: lat,
            longitud: lng,
            direccionDetallada: 'Colonia de Prueba, Tegucigalpa',
            fechaInicioSintomas: fecha,
            observaciones: 'Generado por script de auditoría',
            creadoEn: fecha
          }
        }
      }
    });
    casos.push(hc.id);
  }

  console.log(`Se generaron ${casos.length} casos de prueba con georreferenciación.`);
  await prisma.$disconnect();
}

seedTestData().catch(console.error);
