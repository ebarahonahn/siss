
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const inicio = new Date('2026-04-01');
    const fin = new Date('2026-04-30');
    
    const where: any = {
      historia: {
        fecha: { gte: inicio, lte: fin }
      }
    };

    const diagnosticos = await prisma.diagnostico.groupBy({
      by: ['codigoCIE10', 'descripcion'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    console.log('Diagnosticos:', diagnosticos);
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
