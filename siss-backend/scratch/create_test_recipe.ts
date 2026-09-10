import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pEdgar = await prisma.paciente.findUnique({ where: { dni: '0801197106887' } });
  if (!pEdgar) throw new Error('Paciente Edgar no encontrado');

  const med = await prisma.usuario.findFirst({ where: { correo: 'medico@siss.hn' } });
  if (!med) throw new Error('Medico no encontrado');

  const med1 = await prisma.medicamento.findFirst({ where: { codigo: 'MED-001' } }); // Paracetamol

  console.log('Creando Receta para Edgar...');
  
  // Borrar previas para limpieza (desactivado por ahora para evitar conflictos de FK)
  // await prisma.receta.deleteMany({ where: { pacienteId: pEdgar.id } });

  const historia = await prisma.historiaClinica.create({
    data: {
      pacienteId: pEdgar.id,
      medicoId: med.id,
      subjetivo: 'Paciente con dolor de cabeza',
      objetivo: 'Signos vitales normales',
      analisis: 'Cefalea tensional',
      plan: 'Paracetamol y descanso',
      recetas: {
        create: {
          pacienteId: pEdgar.id,
          establecimientoId: 1, // HNT
          estado: 'PENDIENTE',
          detalles: {
            create: {
              medicamentoId: med1!.id,
              dosis: '500mg',
              frecuencia: 'cada 8 horas',
              duracion: '3 días',
              cantidad: 10,
              indicaciones: 'Tomar con abundante agua'
            }
          }
        }
      }
    }
  });

  console.log('Receta creada exitosamente. ID Historia:', historia.id);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
