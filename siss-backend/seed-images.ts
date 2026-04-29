import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedImages() {
  const imageDir = 'C:\\Users\\ihss\\.gemini\\antigravity\\brain\\2f891cae-aa44-4384-9ecf-24857f82762e';
  const images = [
    {
      file: 'hospital_moderno_siss_1777419912134.png',
      nombre: 'Hospital Moderno',
      titulo: 'Infraestructura de Vanguardia',
      descripcion: 'Contamos con instalaciones modernas y equipadas con la última tecnología para tu salud.',
      orden: 1
    },
    {
      file: 'medicos_trabajando_siss_1777419926142.png',
      nombre: 'Médicos Colaborando',
      titulo: 'Compromiso y Profesionalismo',
      descripcion: 'Nuestro equipo médico trabaja incansablemente para brindarte una atención de calidad.',
      orden: 2
    },
    {
      file: 'atencion_paciente_siss_1777419940239.png',
      nombre: 'Atención Pediátrica',
      titulo: 'Cuidando el Futuro de Honduras',
      descripcion: 'Programas de vacunación y atención integral para los más pequeños del hogar.',
      orden: 3
    }
  ];

  console.log('Sembrando imágenes del carrusel...');

  for (const imgData of images) {
    const filePath = path.join(imageDir, imgData.file);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      await prisma.imagenLogin.create({
        data: {
          nombre: imgData.nombre,
          titulo: imgData.titulo,
          descripcion: imgData.descripcion,
          orden: imgData.orden,
          datos: buffer,
          mimetype: 'image/png',
          activo: true
        }
      });
      console.log(`Imagen sembrada: ${imgData.nombre}`);
    } else {
      console.warn(`Archivo no encontrado: ${filePath}`);
    }
  }

  console.log('Finalizado.');
}

seedImages()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
