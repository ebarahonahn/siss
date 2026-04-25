import { PrismaClient } from '@prisma/client';
import * as https from 'https';

const prisma = new PrismaClient();

const CSV_URL = 'https://raw.githubusercontent.com/verasativa/CIE-10/master/cie-10.csv';

function descargarCSV(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return descargarCSV(res.headers.location!).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parsearCSV(raw: string) {
  const lineas = raw.split('\n');
  const encabezado = lineas[0].split(',');

  const idx = (col: string) => encabezado.indexOf(col);
  const iCodigo  = idx('code');
  const iDesc    = idx('description');
  const iCap     = idx('code_0');   // capítulo raíz (A00-B99, G00-G99, etc.)
  const iLevel   = idx('level');

  // Primero construir mapa capítulo-código → descripción capítulo
  const capMap: Record<string, string> = {};
  for (let i = 1; i < lineas.length; i++) {
    const cols = parsearLinea(lineas[i]);
    if (!cols[iCodigo]) continue;
    if (Number(cols[iLevel]) === 0) {
      capMap[cols[iCodigo].trim()] = limpiar(cols[iDesc]);
    }
  }

  // Filtrar solo códigos diagnósticos reales (sin guión en el código)
  const registros: { codigo: string; descripcion: string; capitulo: string | null }[] = [];

  for (let i = 1; i < lineas.length; i++) {
    const cols = parsearLinea(lineas[i]);
    const codigo = cols[iCodigo]?.trim();
    if (!codigo || codigo.includes('-')) continue;

    const descripcion = limpiar(cols[iDesc]);
    if (!descripcion) continue;

    const capCodigo  = cols[iCap]?.trim() ?? '';
    const capitulo   = capMap[capCodigo] ?? null;

    registros.push({ codigo, descripcion, capitulo });
  }

  return registros;
}

function parsearLinea(linea: string): string[] {
  const cols: string[] = [];
  let dentro = false;
  let actual = '';
  for (const c of linea) {
    if (c === '"') { dentro = !dentro; continue; }
    if (c === ',' && !dentro) { cols.push(actual); actual = ''; continue; }
    actual += c;
  }
  cols.push(actual);
  return cols;
}

function limpiar(s: string): string {
  return (s ?? '').replace(/^"|"$/g, '').trim();
}

async function main() {
  console.log('⬇  Descargando catálogo CIE-10...');
  const csv = await descargarCSV(CSV_URL);

  console.log('📋 Procesando registros...');
  const registros = parsearCSV(csv);
  console.log(`   ${registros.length} códigos diagnósticos encontrados`);

  // Eliminar duplicados por código
  const vistos = new Set<string>();
  const unicos = registros.filter(r => {
    if (vistos.has(r.codigo)) return false;
    vistos.add(r.codigo);
    return true;
  });

  console.log(`   ${unicos.length} códigos únicos a insertar`);

  // Limpiar tabla antes de insertar
  await prisma.catDiagnostico.deleteMany();
  console.log('🗑  Tabla vaciada');

  // Insertar en lotes de 500
  const LOTE = 500;
  let insertados = 0;
  for (let i = 0; i < unicos.length; i += LOTE) {
    const lote = unicos.slice(i, i + LOTE);
    await prisma.catDiagnostico.createMany({ data: lote, skipDuplicates: true });
    insertados += lote.length;
    process.stdout.write(`\r   Insertados: ${insertados}/${unicos.length}`);
  }

  console.log('\n✅ Catálogo CIE-10 cargado exitosamente');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
