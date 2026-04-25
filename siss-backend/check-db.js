const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const historia = await prisma.historiaClinica.findUnique({
      where: { id: 6 },
      include: {
        respuestaFormulario: {
          include: {
            plantilla: true
          }
        }
      }
    });
    console.log('--- DETALLE HISTORIA 6 ---');
    console.log(JSON.stringify(historia, null, 2));
    
    const count = await prisma.respuestaFormulario.count();
    console.log('Total respuestas en DB:', count);
    
    const todas = await prisma.respuestaFormulario.findMany({
      include: { plantilla: { select: { nombre: true } } }
    });
    console.log('IDs de historias con respuesta:', todas.map(r => r.historiaId));
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
