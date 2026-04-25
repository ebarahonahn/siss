import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Detectando y borrando todas las tablas dinámicamente...');
  
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  // Obtener lista de tablas
  const tablesResult: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'siss_db';
  `);

  for (const row of tablesResult) {
    const tableName = row.TABLE_NAME || row.table_name;
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      console.log(`✔ Tabla ${tableName} eliminada.`);
    } catch (e) {
      console.log(`❌ Error al eliminar ${tableName}: ${e.message}`);
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Base de datos 100% limpia.');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
