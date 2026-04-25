const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const examenes = [
    // HEMATOLOGIA (10)
    { codigo: 'LAB-001', nombre: 'Hemograma Completo', categoria: 'Hematología', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-002', nombre: 'Recuento de Plaquetas', categoria: 'Hematología', indicaciones: 'Ninguna.' },
    { codigo: 'LAB-003', nombre: 'Hemoglobina Glicosilada', categoria: 'Hematología', indicaciones: 'Ayuno preferible.' },
    { codigo: 'LAB-004', nombre: 'Tiempo de Protrombina (TP)', categoria: 'Hematología', indicaciones: 'Suspender anticoagulantes si lo indica el médico.' },
    { codigo: 'LAB-005', nombre: 'Tiempo de Tromboplastina Parcial (TTP)', categoria: 'Hematología', indicaciones: 'Suspender anticoagulantes si lo indica el médico.' },
    { codigo: 'LAB-006', nombre: 'Velocidad de Sedimimentación Globular', categoria: 'Hematología', indicaciones: 'Ayuno de 4 horas.' },
    { codigo: 'LAB-007', nombre: 'Grupo y Factor Rh', categoria: 'Hematología', indicaciones: 'Ninguna.' },
    { codigo: 'LAB-008', nombre: 'Frotis de Sangre Periférica', categoria: 'Hematología', indicaciones: 'Ninguna.' },
    { codigo: 'LAB-009', nombre: 'Recuento de Reticulocitos', categoria: 'Hematología', indicaciones: 'Ninguna.' },
    { codigo: 'LAB-010', nombre: 'Células LE', categoria: 'Hematología', indicaciones: 'Ayuno de 8 horas.' },

    // BIOQUÍMICA CLÍNICA (15)
    { codigo: 'LAB-011', nombre: 'Glucosa en Ayunas', categoria: 'Bioquímica', indicaciones: 'Ayuno estricto de 8 a 12 horas.' },
    { codigo: 'LAB-012', nombre: 'Creatinina sérica', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas. No ejercicio extenuante.' },
    { codigo: 'LAB-013', nombre: 'Nitrógeno de Urea (BUN)', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-014', nombre: 'Ácido Úrico', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-015', nombre: 'Colesterol Total', categoria: 'Bioquímica', indicaciones: 'Ayuno de 12 horas.' },
    { codigo: 'LAB-016', nombre: 'Triglicéridos', categoria: 'Bioquímica', indicaciones: 'Ayuno estricto de 12 horas. No alcohol 24h antes.' },
    { codigo: 'LAB-017', nombre: 'Colesterol HDL', categoria: 'Bioquímica', indicaciones: 'Ayuno de 12 horas.' },
    { codigo: 'LAB-018', nombre: 'Colesterol LDL', categoria: 'Bioquímica', indicaciones: 'Ayuno de 12 horas.' },
    { codigo: 'LAB-019', nombre: 'Transaminasa TGO/AST', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-020', nombre: 'Transaminasa TGP/ALT', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-021', nombre: 'Bilirrubinas (Total y Diferenciada)', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 a 12 horas.' },
    { codigo: 'LAB-022', nombre: 'Proteínas Totales y Fraccionadas', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-023', nombre: 'Calcio sérico', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-024', nombre: 'Fosfatasa Alcalina', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-025', nombre: 'Electrolitos (Na, K, Cl)', categoria: 'Bioquímica', indicaciones: 'Ayuno de 8 horas.' },

    // UROANÁLISIS Y COPROLOGÍA (8)
    { codigo: 'LAB-026', nombre: 'Examen General de Orina', categoria: 'Uroanálisis', indicaciones: 'Primera orina de la mañana. Frasco estéril. Previo aseo.' },
    { codigo: 'LAB-027', nombre: 'Urocultivo', categoria: 'Uroanálisis', indicaciones: 'Primera orina de la mañana. Técnica de chorro medio. Frasco estéril.' },
    { codigo: 'LAB-028', nombre: 'Orina de 24 horas', categoria: 'Uroanálisis', indicaciones: 'Recolectar toda la orina durante 24h exactamente.' },
    { codigo: 'LAB-029', nombre: 'Microalbuminuria en Orina', categoria: 'Uroanálisis', indicaciones: 'Primera orina de la mañana preferible.' },
    { codigo: 'LAB-030', nombre: 'Examen Físico-Químico de Heces', categoria: 'Coprología', indicaciones: 'Muestra reciente en frasco limpio.' },
    { codigo: 'LAB-031', nombre: 'Parásitos por Heces', categoria: 'Coprología', indicaciones: 'Muestra reciente. No contaminar con orina.' },
    { codigo: 'LAB-032', nombre: 'Sangre Oculta en Heces', categoria: 'Coprología', indicaciones: 'Dieta blanca especial 3 días antes si se indica.' },
    { codigo: 'LAB-033', nombre: 'Coprocultivo', categoria: 'Coprología', indicaciones: 'Muestra en frasco estéril. Enviar antes de 2 horas.' },

    // INMUNOLOGÍA Y SEROLOGÍA (10)
    { codigo: 'LAB-034', nombre: 'Prueba de Embarazo (HCG sérica)', categoria: 'Inmunología', indicaciones: 'Ayuno preferible.' },
    { codigo: 'LAB-035', nombre: 'VDRL / RPR', categoria: 'Serología', indicaciones: 'Ayuno de 4 horas.' },
    { codigo: 'LAB-036', nombre: 'VIH (Antígeno/Anticuerpo)', categoria: 'Inmunología', indicaciones: 'Confidencial. Ninguna específica.' },
    { codigo: 'LAB-037', nombre: 'Hepatitis B (HBsAg)', categoria: 'Inmunología', indicaciones: 'Ayuno de 4 horas.' },
    { codigo: 'LAB-038', nombre: 'Hepatitis C (Anti-VHC)', categoria: 'Inmunología', indicaciones: 'Ayuno de 4 horas.' },
    { codigo: 'LAB-039', nombre: 'Factor Reumatoide', categoria: 'Inmunología', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-040', nombre: 'Proteína C Reactiva (PCR)', categoria: 'Inmunología', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-041', nombre: 'Antiestreptolisina O (ASO)', categoria: 'Inmunología', indicaciones: 'Ayuno de 8 horas.' },
    { codigo: 'LAB-042', nombre: 'Pruebas de Función Tiroidea (T3, T4, TSH)', categoria: 'Endocrinología', indicaciones: 'Ayuno de 8 horas. No tomar medicamento tiroideo antes.' },
    { codigo: 'LAB-043', nombre: 'Antígeno Prostático Específico (PSA)', categoria: 'Marcadores', indicaciones: 'No eyaculación 48h antes. No ejercicio en bicicleta.' },

    // OTROS (7)
    { codigo: 'LAB-044', nombre: 'Citología Vaginal', categoria: 'Citología', indicaciones: 'Sin relaciones sexuales ni duchas vaginales 48h antes.' },
    { codigo: 'LAB-045', nombre: 'Cultivo de Secreción Faríngea', categoria: 'Microbiología', indicaciones: 'En ayuno. Sin aseo bucal.' },
    { codigo: 'LAB-046', nombre: 'Cultivo de Esputo', categoria: 'Microbiología', indicaciones: 'Muestra matutina profunda despues de enjuagar con agua.' },
    { codigo: 'LAB-047', nombre: 'Prueba Rápida de Dengue', categoria: 'Serología', indicaciones: 'Fase aguda de fiebre.' },
    { codigo: 'LAB-048', nombre: 'Gota Gruesa (Malaria)', categoria: 'Hematología', indicaciones: 'Preferible durante pico febril.' },
    { codigo: 'LAB-049', nombre: 'Exudado Uretral', categoria: 'Microbiología', indicaciones: 'Sin orinar al menos 2 horas antes.' },
    { codigo: 'LAB-050', nombre: 'Perfil de Hierro', categoria: 'Bioquímica', indicaciones: 'Ayuno de 12 horas. Mañana preferible.' },
  ];

  console.log('Sembrando Catálogo de Exámenes de Laboratorio...');

  for (const examen of examenes) {
    await prisma.catExamenLaboratorio.upsert({
      where: { codigo: examen.codigo },
      update: examen,
      create: examen,
    });
  }

  console.log(`V Proceso completado: ${examenes.length} exámenes registrados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
