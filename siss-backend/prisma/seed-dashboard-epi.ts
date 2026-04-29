import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Generando datos de prueba para Dashboard Epidemiológico...');

  // 1. Obtener datos base necesarios
  const medico = await prisma.usuario.findFirst({ where: { rol: { nombre: 'MEDICO' } } });
  const hospital = await prisma.establecimiento.findFirst({ where: { codigo: 'HNT-001' } });
  
  if (!medico || !hospital) {
    console.error('❌ Error: Asegúrate de haber ejecutado el seed.ts base primero.');
    return;
  }

  const diagnosticosEpi = [
    { codigo: 'A90', desc: 'Fiebre del dengue [dengue clásico]' },
    { codigo: 'A91', desc: 'Fiebre del dengue hemorrágico' },
    { codigo: 'B05', desc: 'Sarampión' },
    { codigo: 'A82', desc: 'Rabia' },
    { codigo: 'A92.8', desc: 'Fiebre de Oropouche' }
  ];

  // Coordenadas aproximadas de Tegucigalpa para el mapa
  const TEGUS_LAT = 14.0818;
  const TEGUS_LON = -87.2068;

  for (let i = 0; i < 25; i++) {
    const diag = diagnosticosEpi[Math.floor(Math.random() * diagnosticosEpi.length)];
    const fechaCaso = faker.date.recent({ days: 30 });

    // 1. Crear Paciente primero
    const paciente = await prisma.paciente.create({
      data: {
        numeroExpediente: `EXP-EPI-${1000 + i}`,
        dni: faker.string.numeric(13),
        nombres: faker.person.firstName().toUpperCase(),
        apellidos: faker.person.lastName().toUpperCase(),
        fechaNacimiento: faker.date.birthdate({ min: 1, max: 70, mode: 'age' }),
        sexoId: Math.random() > 0.5 ? 1 : 2,
        departamentoId: 8, // Francisco Morazán
        municipioId: 801,  // Tegucigalpa
        direccion: faker.location.streetAddress(),
        establecimientoId: hospital.id,
        creadoPorId: medico.id,
      }
    });

    // 2. Crear Historia Clínica con Notificación y Diagnóstico
    await prisma.historiaClinica.create({
      data: {
        pacienteId: paciente.id,
        medicoId: medico.id,
        fecha: fechaCaso,
        subjetivo: 'Paciente presenta fiebre alta, dolor retro-ocular y mialgias intensas.',
        objetivo: 'Temperatura 39.5°C, petequias en extremidades inferiores.',
        analisis: `Sospecha clínica de ${diag.desc}`,
        plan: 'Hidratación oral, paracetamol y vigilancia de signos de alarma.',
        presionSistolica: 110,
        presionDiastolica: 70,
        frecuenciaCardiaca: 88,
        temperatura: 39.5,
        semanaEpidemiologica: Math.ceil(fechaCaso.getDate() / 7) + (fechaCaso.getMonth() * 4),
        
        // Crear la Notificación Epidemiológica vinculada a AMBOS
        notificacionEpidemiologica: {
          create: {
            pacienteId: paciente.id, // Ahora tenemos el ID
            diagnosticoCIE10: diag.codigo,
            latitud: TEGUS_LAT + (Math.random() - 0.5) * 0.1,
            longitud: TEGUS_LON + (Math.random() - 0.5) * 0.1,
            fechaInicioSintomas: faker.date.recent({ days: 5, refDate: fechaCaso }),
            antecedentesViaje: Math.random() > 0.7 ? 'Viaje reciente a zona costera' : 'Sin antecedentes de viaje',
            observaciones: 'Caso captado en consulta externa.',
            creadoPorId: medico.id
          }
        },
        // Agregar el diagnóstico al historial
        diagnosticos: {
          create: {
            codigoCIE10: diag.codigo,
            descripcion: diag.desc,
            tipo: 'PRINCIPAL'
          }
        }
      }
    });

    process.stdout.write(`\r   Casos generados: ${i + 1}/25`);
  }

  console.log('\n\n✅ Datos epidemiológicos de prueba generados con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
