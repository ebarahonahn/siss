import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const establecimientos = await prisma.establecimiento.findMany({
    include: {
      municipio: { include: { departamento: true } }
    }
  });

  const catServicios = await prisma.catServicio.findMany();
  
  const diagnosticos = await prisma.catDiagnostico.findMany();
  
  const medicamentos = await prisma.medicamento.findMany();

  const plantillas = await prisma.plantillaFormulario.findMany({
    include: {
      secciones: {
        include: { campos: true }
      }
    }
  });

  console.log('--- ESTABLECIMIENTOS ---');
  console.log(JSON.stringify(establecimientos, null, 2));
  
  console.log('--- CAT_SERVICIOS ---');
  console.log(JSON.stringify(catServicios, null, 2));

  console.log('--- DIAGNOSTICOS ---');
  console.log(JSON.stringify(diagnosticos, null, 2));

  console.log('--- MEDICAMENTOS ---');
  console.log(JSON.stringify(medicamentos, null, 2));

  console.log('--- PLANTILLAS ---');
  console.log(JSON.stringify(plantillas, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
