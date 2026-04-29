import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Sembrando inventario inicial para HNT-001...');

  const hospital = await prisma.establecimiento.findFirst({ where: { codigo: 'HNT-001' } });
  const admin = await prisma.usuario.findFirst({ where: { rol: { nombre: 'ADMIN' } } });

  if (!hospital || !admin) {
    console.error('❌ Error: No se encontró el establecimiento HNT-001 o el usuario administrador.');
    return;
  }

  const medicamentos = await prisma.medicamento.findMany({ where: { activo: true } });

  console.log(`   Procesando ${medicamentos.length} medicamentos...`);

  for (const med of medicamentos) {
    // Crear registro de inventario con lote
    await prisma.inventario.upsert({
      where: {
        medicamentoId_establecimientoId_lote: {
          medicamentoId: med.id,
          establecimientoId: hospital.id,
          lote: 'LT-2026-001'
        }
      },
      update: {
        cantidadActual: 200,
        activo: true
      },
      create: {
        medicamentoId: med.id,
        establecimientoId: hospital.id,
        cantidadActual: 200,
        cantidadMinima: 10,
        lote: 'LT-2026-001',
        fechaVencimiento: new Date('2027-12-31'),
        creadoPorId: admin.id,
        activo: true
      }
    });

    // Registrar un movimiento de entrada inicial
    const inv = await prisma.inventario.findFirst({
      where: { medicamentoId: med.id, establecimientoId: hospital.id, lote: 'LT-2026-001' }
    });

    if (inv) {
      await prisma.movimientoInventario.create({
        data: {
          inventarioId: inv.id,
          tipo: 'ENTRADA',
          cantidad: 200,
          motivo: 'Carga inicial de inventario (Seed)',
          usuarioId: admin.id
        }
      });
    }
  }

  console.log('✅ Inventario sembrado exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
