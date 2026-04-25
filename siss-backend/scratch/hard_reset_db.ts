import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Borrando todas las tablas de la base de datos...');
  
  // Desactivar chequeo de llaves foráneas para poder borrar todo
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'audit_logs',
    'cat_diagnostico',
    'cat_examenes_laboratorio',
    'cat_examenes_radiologia',
    'cat_medicamentos',
    'cat_servicios',
    'citas',
    'detalles_receta',
    'detalles_solicitud_laboratorio',
    'detalles_solicitud_radiologia',
    'diagnosticos',
    'especialidades',
    'establecimientos',
    'estudio_radiologia_establecimientos',
    'examen_establecimientos',
    'historia_clinica',
    'incapacidades',
    'inventario',
    'municipios',
    'departamentos',
    'pacientes',
    'plantillas_formulario',
    'secciones_formulario',
    'campos_formulario',
    'respuestas_formulario',
    'recetas',
    'resultados_laboratorio',
    'resultados_radiologia',
    'roles',
    'servicios',
    'sesiones',
    'solicitudes_laboratorio',
    'solicitudes_radiologia',
    'triajes',
    'usuarios',
    'asignaciones_usuario',
    '_prisma_migrations'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${table}\`;`);
      console.log(`✔ Tabla ${table} eliminada.`);
    } catch (e) {
      console.log(`❌ Error al eliminar ${table}: ${e.message}`);
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Base de datos limpia.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
