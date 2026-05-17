import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
  private fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  };

  private getPrinter() {
    const pdfmake = require('pdfmake');
    pdfmake.setFonts(this.fonts);
    return pdfmake;
  }

  // --- MÉTODOS DE HOSPITALIZACIÓN ---
  async generarNotasEvolucion(paciente: any, ingreso: any, notas: any[]) {
    const pdfmake = this.getPrinter();
    const docDefinition: any = {
      pageSize: 'LETTER',
      content: [
        { text: 'SISTEMA INTEGRAL DE SALUD (SISS)', style: 'header' },
        { text: 'NOTAS DE EVOLUCIÓN', style: 'title', alignment: 'center', margin: [0, 10] },
        ...notas.map(n => ({ text: `[${new Date(n.fecha).toLocaleString()}] ${n.nota}`, margin: [0, 5], fontSize: 9 }))
      ],
      styles: { header: { fontSize: 10, bold: true }, title: { fontSize: 14, bold: true } }
    };
    const doc = pdfmake.createPdf(docDefinition);
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }

  async generarKardex(paciente: any, ingreso: any, kardex: any[], signos: any[]) {
    const pdfmake = this.getPrinter();
    const docDefinition: any = {
      pageSize: 'LETTER',
      content: [{ text: 'KARDEX DE ENFERMERÍA', style: 'title', alignment: 'center' }],
      styles: { title: { fontSize: 14, bold: true } }
    };
    const doc = pdfmake.createPdf(docDefinition);
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }

  // --- MÉTODOS DE CONTROL PRENATAL ---
  private dibujarGraficaAlturaUterina(controles: any[]) {
    const width = 180;
    const height = 100;
    const canvas: any[] = [{ type: 'rect', x: 0, y: 0, w: width, h: height, color: '#ffffff', lineWidth: 0.5, lineColor: '#e2e8f0' }];
    const xLabels: any[] = [];

    // Eje X: 13 a 40 semanas, paso 3
    for (let s = 13; s <= 40; s += 3) {
      const x = ((s - 13) * width) / (40 - 13);
      canvas.push({ type: 'line', x1: x, y1: height, x2: x, y2: 0, lineWidth: 0.2, lineColor: '#cbd5e1' });
      xLabels.push({ text: s.toString(), fontSize: 5, width: 'auto' });
    }
    // Eje Y: 10 a 40 cm, paso 5
    for (let v = 10; v <= 40; v += 5) {
      const y = height - ((v - 10) * height) / (40 - 10);
      canvas.push({ type: 'line', x1: 0, y1: y, x2: width, y2: y, lineWidth: 0.2, lineColor: '#cbd5e1' });
    }

    const drawCurve = (p: number[][], color: string, isDashed: boolean = false) => {
      for (let i = 0; i < p.length - 1; i++) {
        const x1 = ((p[i][0] - 13) * width) / (40 - 13);
        const y1 = height - ((p[i][1] - 10) * height) / (40 - 10);
        const x2 = ((p[i+1][0] - 13) * width) / (40 - 13);
        const y2 = height - ((p[i+1][1] - 10) * height) / (40 - 10);
        const line: any = { type: 'line', x1, y1, x2, y2, lineWidth: 1, lineColor: color };
        if (isDashed) line.dash = { length: 2 };
        canvas.push(line);
      }
    };

    // Percentiles Altura Uterina (Datos de la pantalla)
    const p90_au = [[13, 13], [16, 16], [20, 20], [24, 24], [28, 28], [32, 31], [36, 33], [40, 35]];
    const p10_au = [[13, 9], [16, 11], [20, 15], [24, 19], [28, 22], [32, 25], [36, 28], [40, 30]];
    
    drawCurve(p90_au, '#fca5a5'); // P90
    drawCurve(p10_au, '#fca5a5'); // P10

    const points: any[] = [];
    const validControles = (controles || [])
      .map(c => ({ sem: parseFloat(String(c.semanasGestacion)), au: parseFloat(String(c.alturaUterina)) }))
      .filter(c => !isNaN(c.sem) && !isNaN(c.au) && c.sem >= 13 && c.sem <= 40)
      .sort((a, b) => a.sem - b.sem);

    validControles.forEach(c => {
      const px = Math.max(0, Math.min(width, ((c.sem - 13) * width) / (40 - 13)));
      const py = Math.max(0, Math.min(height, height - ((c.au - 10) * height) / (40 - 10)));
      canvas.push({ type: 'ellipse', x: px, y: py, r1: 3, r2: 3, color: '#10b981', lineColor: '#ffffff', lineWidth: 1 });
      points.push({ x: px, y: py });
    });
    for (let i = 0; i < points.length - 1; i++) {
      canvas.push({ type: 'line', x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, lineWidth: 1, lineColor: '#10b981' });
    }

    return {
      stack: [
        { text: 'Altura Uterina (cm)', style: 'chartTitle' },
        {
          table: {
            widths: [12, 180],
            body: [[
              {
                stack: [40, 35, 30, 25, 20, 15, 10].map((v, idx) => ({ text: v.toString(), fontSize: 5, margin: [0, idx === 0 ? 0 : 11.5, 0, 0] })),
                border: [false, false, false, false]
              },
              {
                stack: [
                  { canvas: canvas },
                  { text: '13  16  19  22  25  28  31  34  37  40', fontSize: 5, margin: [0, 2, 0, 0] },
                  { text: 'Semanas', fontSize: 6, alignment: 'center', margin: [0, 1, 0, 0] }
                ],
                border: [false, false, false, false]
              }
            ]]
          },
          layout: {
            paddingLeft: () => 0, paddingRight: () => 0,
            paddingTop: () => 0, paddingBottom: () => 0
          }
        },
        {
          columns: [
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#fca5a5' }] },
            { text: 'Percentiles', fontSize: 6, margin: [2, 0, 10, 0] },
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#10b981' }] },
            { text: 'Paciente', fontSize: 6, margin: [2, 0, 0, 0] }
          ],
          alignment: 'center', margin: [0, 5, 0, 0]
        }
      ]
    };
  }

  private dibujarGraficaPeso(controles: any[]) {
    const width = 180;
    const height = 100;
    const canvas: any[] = [{ type: 'rect', x: 0, y: 0, w: width, h: height, color: '#ffffff', lineWidth: 0.5, lineColor: '#e2e8f0' }];
    const xLabels: any[] = [];

    // Eje X: 5 a 40 semanas, paso 5
    for (let s = 5; s <= 40; s += 5) {
      const x = ((s - 5) * width) / (40 - 5);
      canvas.push({ type: 'line', x1: x, y1: height, x2: x, y2: 0, lineWidth: 0.2, lineColor: '#cbd5e1' });
      xLabels.push({ text: s.toString(), fontSize: 5, width: 'auto' });
    }
    // Eje Y: 0 a 20 kg, paso 2
    for (let v = 0; v <= 20; v += 2) {
      const y = height - (v * height) / 20;
      canvas.push({ type: 'line', x1: 0, y1: y, x2: width, y2: y, lineWidth: 0.2, lineColor: '#cbd5e1' });
    }

    const drawCurve = (p: number[][], color: string, isDashed: boolean = false) => {
      for (let i = 0; i < p.length - 1; i++) {
        const x1 = ((p[i][0] - 5) * width) / (40 - 5);
        const y1 = height - (p[i][1] * height) / 20;
        const x2 = ((p[i+1][0] - 5) * width) / (40 - 5);
        const y2 = height - (p[i+1][1] * height) / 20;
        const line: any = { type: 'line', x1, y1, x2, y2, lineWidth: 1, lineColor: color };
        if (isDashed) line.dash = { length: 2 };
        canvas.push(line);
      }
    };

    // Percentiles Ganancia de Peso (Datos de la pantalla)
    const p90_peso = [[10, 1.5], [13, 2.5], [16, 4.0], [20, 6.5], [24, 9.0], [28, 11.5], [32, 14.0], [36, 16.5], [40, 19.0]];
    const p10_peso = [[10, -0.5], [13, 0.0], [16, 1.0], [20, 2.5], [24, 4.5], [28, 6.5], [32, 8.5], [36, 10.0], [40, 11.5]];

    drawCurve(p90_peso, '#fca5a5', true); // P90 dashed
    drawCurve(p10_peso, '#fca5a5', true); // P10 dashed

    const points: any[] = [];
    const validControles = (controles || [])
      .map(c => ({ sem: parseFloat(String(c.semanasGestacion)), p: parseFloat(String(c.p || c.pesoMat || c.peso)) }))
      .filter(c => !isNaN(c.sem) && !isNaN(c.p) && c.sem >= 5 && c.sem <= 40)
      .sort((a, b) => a.sem - b.sem);

    const pesoBase = validControles.length > 0 ? validControles[0].p : 0;
    validControles.forEach(c => {
      const ganancia = c.p - pesoBase;
      const px = Math.max(0, Math.min(width, ((c.sem - 5) * width) / (40 - 5)));
      const py = Math.max(0, Math.min(height, height - (ganancia * height) / 20));
      canvas.push({ type: 'ellipse', x: px, y: py, r1: 3, r2: 3, color: '#3b82f6', lineColor: '#ffffff', lineWidth: 1 });
      points.push({ x: px, y: py });
    });
    for (let i = 0; i < points.length - 1; i++) {
      canvas.push({ type: 'line', x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, lineWidth: 1, lineColor: '#3b82f6' });
    }

    return {
      stack: [
        { text: 'Ganancia de Peso (kg)', style: 'chartTitle' },
        {
          table: {
            widths: [12, 180],
            body: [[
              {
                stack: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0].map((v, idx) => ({ text: v.toString(), fontSize: 5, margin: [0, idx === 0 ? 0 : 5.4, 0, 0] })),
                border: [false, false, false, false]
              },
              {
                stack: [
                  { canvas: canvas },
                  { text: '5   10   15   20   25   30   35   40', fontSize: 5, margin: [0, 2, 0, 0] },
                  { text: 'Semanas', fontSize: 6, alignment: 'center', margin: [0, 1, 0, 0] }
                ],
                border: [false, false, false, false]
              }
            ]]
          },
          layout: {
            paddingLeft: () => 0, paddingRight: () => 0,
            paddingTop: () => 0, paddingBottom: () => 0
          }
        },
        { 
          columns: [
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#fca5a5', dash: { length: 2 } }] },
            { text: 'Percentiles', fontSize: 6, margin: [2, 0, 10, 0] },
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#3b82f6' }] },
            { text: 'Paciente', fontSize: 6, margin: [2, 0, 0, 0] }
          ],
          alignment: 'center', margin: [0, 5, 0, 0]
        }
      ]
    };
  }

  async generarFichaPerinatal(embarazo: any) {
    const pdfmake = this.getPrinter();
    
    // SINCRONIZACIÓN: Usar el valor del último control si existe, de lo contrario calcularlo.
    let semanasActuales = '---';
    if (embarazo.controles && embarazo.controles.length > 0) {
      const ultimoControl = [...embarazo.controles].sort((a, b) => new Date(b.fechaControl).getTime() - new Date(a.fechaControl).getTime())[0];
      semanasActuales = Number(ultimoControl.semanasGestacion).toFixed(1);
    } else if (embarazo.fum) {
      const diffMs = Date.now() - new Date(embarazo.fum).getTime();
      const weeks = diffMs / (1000 * 60 * 60 * 24 * 7);
      semanasActuales = weeks.toFixed(1);
    }

    console.log(`[PDF] Generando ficha para embarazo ID: ${embarazo.id}. Múltiple: ${embarazo.esMultiple}, Fetos: ${embarazo.cantidadFetos}`);

    const formatearFcf = (c: any) => {
      let base = (c.fcf || '--').toString();
      let datosFetos = c.datosFetos;
      
      // Blindaje contra JSON como string
      if (typeof datosFetos === 'string') {
        try { datosFetos = JSON.parse(datosFetos); } catch(e) { datosFetos = null; }
      }

      if (datosFetos && Array.isArray(datosFetos)) {
        datosFetos.forEach((f: any) => { base += ` / ${f.fcf || '--'}`; });
      }
      return base;
    };

    const formatearMov = (c: any) => {
      let base = c.movimientosFetales ? 'SÍ' : 'NO';
      let datosFetos = c.datosFetos;

      if (typeof datosFetos === 'string') {
        try { datosFetos = JSON.parse(datosFetos); } catch(e) { datosFetos = null; }
      }

      if (datosFetos && Array.isArray(datosFetos)) {
        datosFetos.forEach((f: any) => { base += ` / ${f.movimientos ? 'SÍ' : 'NO'}`; });
      }
      return base;
    };

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 30, 40, 40],
      content: [
        {
          columns: [
            { 
              stack: [
                { text: 'SISTEMA INTEGRAL DE SALUD (SISS)', style: 'header' },
                { text: (embarazo.paciente?.establecimiento?.nombre || 'ESTABLECIMIENTO DE SALUD').toUpperCase(), fontSize: 8, bold: true, color: '#475569', margin: [0, 2, 0, 0] }
              ]
            },
            { text: `Generado: ${new Date().toLocaleDateString()}`, alignment: 'right', style: 'subheader' },
          ],
        },
        { text: 'HISTORIA CLÍNICA PERINATAL BÁSICA (HCPB)', style: 'title', alignment: 'center', margin: [0, 5, 0, 15] },
        
        // BANNER DE ESTADO FINALIZADO
        ...(embarazo.estado !== 'ACTIVO' ? [
          {
            table: {
              widths: ['*'],
              body: [
                [{ 
                  text: `EXPEDIENTE FINALIZADO POR ${embarazo.estado.replace('FINALIZADO_', '')}`, 
                  alignment: 'center', 
                  bold: true, 
                  color: 'white',
                  fontSize: 12
                }]
              ]
            },
            layout: {
              fillColor: (embarazo.estado === 'FINALIZADO_PARTO') ? '#1d4ed8' : (embarazo.estado === 'FINALIZADO_ABORTO' ? '#d97706' : '#b91c1c'),
              hLineColor: () => '#ffffff',
              vLineColor: () => '#ffffff',
              paddingTop: () => 10,
              paddingBottom: () => 10
            },
            margin: [0, 0, 0, 15]
          },
          { text: 'DATOS DE FINALIZACIÓN', style: 'sectionTitle' },
          {
            table: {
              widths: ['auto', 'auto', '*'],
              body: [
                [
                  { text: 'Resultado', style: 'tableHeader' }, 
                  { text: 'Fecha de Terminación', style: 'tableHeader' }, 
                  { text: 'Observaciones de Cierre', style: 'tableHeader' }
                ],
                [
                  { 
                    text: (embarazo.estado || '').replace('FINALIZADO_', ''), 
                    bold: true, 
                    color: (embarazo.estado === 'FINALIZADO_PARTO') ? '#1d4ed8' : (embarazo.estado === 'FINALIZADO_ABORTO' ? '#d97706' : '#b91c1c')
                  },
                  { 
                    text: embarazo.fechaTerminacion 
                      ? new Date(embarazo.fechaTerminacion).toLocaleDateString() 
                      : (embarazo.observaciones || '').split('FINALIZACIÓN (')[1]?.split(')')[0] || '---', 
                    bold: true 
                  },
                  { text: (embarazo.observaciones || '').split('--- FINALIZACIÓN')[1]?.split(': ')[1] || embarazo.observaciones || '---', fontSize: 9 }
                ]
              ]
            },
            layout: { 
              fillColor: (embarazo.estado === 'FINALIZADO_PARTO') ? '#eff6ff' : '#fff1f2', 
              hLineColor: () => '#cbd5e1', 
              vLineColor: () => '#cbd5e1',
              paddingTop: () => 8,
              paddingBottom: () => 8
            },
            margin: [0, 0, 0, 20]
          }
        ] : []),

        { text: 'DATOS DE LA PACIENTE', style: 'sectionTitle' },
        {
          table: {
            widths: ['*', 'auto', 'auto'],
            body: [
              [{ text: 'Nombre Completo', style: 'tableHeader' }, { text: 'DNI / Identificación', style: 'tableHeader' }, { text: 'No. Expediente', style: 'tableHeader' }],
              [`${embarazo.paciente?.nombres} ${embarazo.paciente?.apellidos}`, embarazo.paciente?.dni || '---', embarazo.paciente?.numeroExpediente || '---'],
            ],
          },
          layout: 'lightHorizontalLines',
        },
        { text: 'EMBARAZO ACTUAL', style: 'sectionTitle', margin: [0, 15, 0, 5] },
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [{ text: 'FUM', style: 'tableHeader' }, { text: 'FPP', style: 'tableHeader' }, { text: 'Semanas Actuales', style: 'tableHeader' }, { text: 'Riesgo Obstétrico', style: 'tableHeader' }],
              [
                embarazo.fum ? new Date(embarazo.fum).toLocaleDateString() : '---',
                embarazo.fpp ? new Date(embarazo.fpp).toLocaleDateString() : '---',
                { text: `${semanasActuales} sem`, bold: true, fontSize: 11, fillColor: '#fef08a' },
                { 
                  stack: [
                    { text: `${embarazo.riesgo || 'BAJO'} RIESGO`, color: embarazo.riesgo === 'ALTO' ? '#b91c1c' : '#059669', bold: true },
                    ...( (embarazo.esMultiple || (embarazo.cantidadFetos > 1)) ? [{ text: `EMBARAZO MÚLTIPLE (${embarazo.cantidadFetos || 2} fetos)`, fontSize: 7, bold: true, color: '#1d4ed8', margin: [0, 2, 0, 0] }] : [])
                  ]
                }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        embarazo.riesgo === 'ALTO' ? {
          text: 'Alerta de Alto Riesgo: Esta paciente requiere seguimiento quincenal o semanal inmediato.',
          color: '#b91c1c', fontSize: 8, bold: true, margin: [0, 5, 0, 0]
        } : null,
        { text: 'EVOLUCIÓN CLÍNICA', style: 'sectionTitle', margin: [0, 15, 0, 10] },
        {
          columns: [
            { width: 220, ...this.dibujarGraficaPeso(embarazo.controles || []) },
            { width: 220, ...this.dibujarGraficaAlturaUterina(embarazo.controles || []) }
          ],
          columnGap: 20
        },
        { text: 'ANTECEDENTES OBSTÉTRICOS', style: 'sectionTitle', margin: [0, 15, 0, 5] },
        {
          table: {
            widths: ['*', '*', '*', '*', '*'],
            body: [
              [{ text: 'Gravidez', style: 'tableHeader', alignment: 'center' }, { text: 'Partos', style: 'tableHeader', alignment: 'center' }, { text: 'Abortos', style: 'tableHeader', alignment: 'center' }, { text: 'Cesáreas', style: 'tableHeader', alignment: 'center' }, { text: 'Óbitos', style: 'tableHeader', alignment: 'center' }],
              [
                { text: (embarazo.antecedentes?.gravidez ?? 0).toString(), alignment: 'center', fontSize: 12, bold: true },
                { text: (embarazo.antecedentes?.partos ?? 0).toString(), alignment: 'center', fontSize: 12, bold: true },
                { text: (embarazo.antecedentes?.abortos ?? 0).toString(), alignment: 'center', fontSize: 12, bold: true },
                { text: (embarazo.antecedentes?.cesareas ?? 0).toString(), alignment: 'center', fontSize: 12, bold: true },
                { text: (embarazo.antecedentes?.obitos ?? 0).toString(), alignment: 'center', fontSize: 12, bold: true }
              ],
            ],
          },
          layout: { fillColor: (i: number) => (i === 0 ? '#eff6ff' : null), hLineColor: () => '#bfdbfe', vLineColor: () => '#bfdbfe' }
        },
        { text: 'LISTADO DE CONTROLES', style: 'sectionTitle', margin: [0, 15, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
            body: [
              [{ text: 'Fecha', style: 'tableHeader' }, { text: 'Sem', style: 'tableHeader' }, { text: 'Peso (kg)', style: 'tableHeader' }, { text: 'P.A. (mmHg)', style: 'tableHeader' }, { text: 'A.U. (cm)', style: 'tableHeader' }, { text: 'FCF (LPM)', style: 'tableHeader' }, { text: 'Mov.', style: 'tableHeader' }, { text: 'Prot.', style: 'tableHeader' }, { text: 'Edema', style: 'tableHeader' }, { text: 'Médico / Responsable', style: 'tableHeader' }, { text: 'Observaciones', style: 'tableHeader' }],
              ...(embarazo.controles || []).map(c => [
                new Date(c.fechaControl).toLocaleDateString(),
                isNaN(parseFloat(String(c.semanasGestacion))) ? '--' : parseFloat(String(c.semanasGestacion)).toFixed(1),
                `${c.peso != null ? c.peso : '--'}`,
                `${c.taSistolica || '0'}/${c.taDiastolica || '0'}`,
                c.alturaUterina != null ? String(c.alturaUterina) : '--',
                { text: formatearFcf(c), color: embarazo.esMultiple ? '#1d4ed8' : '#000000', bold: embarazo.esMultiple },
                { text: formatearMov(c), color: embarazo.esMultiple ? '#1d4ed8' : '#000000', bold: embarazo.esMultiple },
                c.proteinuria ? 'SÍ' : 'NO',
                c.edema ? 'SÍ' : 'NO',
                { text: `${c.creadoPor?.nombres || ''} ${c.creadoPor?.apellidos || ''}`.trim() || '---', fontSize: 7 },
                { text: c.observaciones || '', fontSize: 7 }
              ])
            ],
          },
          layout: 'headerLineOnly',
        },
      ],
      styles: {
        header: { fontSize: 10, bold: true, color: '#1d4ed8' },
        subheader: { fontSize: 8, color: '#64748b' },
        title: { fontSize: 14, bold: true, color: '#1e293b' },
        sectionTitle: { fontSize: 10, bold: true, color: '#1d4ed8', margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fontSize: 9, color: '#1e3a8a' },
        chartTitle: { fontSize: 10, bold: true, alignment: 'center', color: '#334155', margin: [0, 0, 0, 5] }
      },
      footer: (currentPage: number, pageCount: number) => {
        return { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 7, margin: [40, 10, 40, 10] };
      },
    };

    // Encontrar e imprimir todas las elipses del docDefinition para depurar
    const buscarElipses = (obj: any, path = 'root') => {
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => buscarElipses(item, `${path}[${i}]`));
      } else if (obj !== null && typeof obj === 'object') {
        if (obj.type === 'ellipse') {
          console.log(`[ELIPSE-DEBUG] Encontrada elipse en ${path}:`, JSON.stringify(obj));
        }
        for (const key of Object.keys(obj)) {
          buscarElipses(obj[key], `${path}.${key}`);
        }
      }
    };
    buscarElipses(docDefinition);

    // Sanitizador: reemplaza NaN numérico en el doc definition y lo reporta
    const sanitizeNaN = (obj: any, path = 'root'): any => {
      if (Array.isArray(obj)) return obj.map((v, i) => sanitizeNaN(v, `${path}[${i}]`));
      if (obj !== null && typeof obj === 'object') {
        const r: any = {};
        for (const k of Object.keys(obj)) r[k] = sanitizeNaN(obj[k], `${path}.${k}`);
        return r;
      }
      if (typeof obj === 'number' && isNaN(obj)) {
        console.error(`[PDF-NaN] NaN detectado en path: ${path}`);
        return 0;
      }
      if (typeof obj === 'string' && (obj === 'NaN' || obj === 'undefined' || obj === 'null')) {
        console.error(`[PDF-NaN] String '${obj}' detectado en path: ${path}`);
        return 0;
      }
      return obj;
    };

    const doc = pdfmake.createPdf(sanitizeNaN(docDefinition));
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }

  private dibujarGraficaPesoEdadPediatrico(paciente: any, controles: any[]) {
    const width = 180;
    const height = 100;
    const canvas: any[] = [{ type: 'rect', x: 0, y: 0, w: width, h: height, color: '#ffffff', lineWidth: 0.5, lineColor: '#e2e8f0' }];
    const xLabels: any[] = [];

    // Calcular edad máxima en meses para adaptar la escala
    const nac = new Date(paciente.fechaNacimiento);
    let maxMonths = 60;
    (controles || []).forEach(c => {
      const fechaC = new Date(c.creadoEn);
      const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
      if (!isNaN(x) && x > maxMonths) {
        maxMonths = x;
      }
    });

    // Si la edad máxima supera los 60 meses, escalamos a 120 meses
    if (maxMonths > 60) {
      maxMonths = 120;
    } else {
      maxMonths = 60;
    }

    const stepX = maxMonths === 60 ? 10 : 20;
    const maxY = maxMonths === 60 ? 25 : 50;
    const stepY = maxMonths === 60 ? 5 : 10;
    const yLabels = maxMonths === 60 ? [25, 20, 15, 10, 5, 0] : [50, 40, 30, 20, 10, 0];

    // Eje X
    for (let s = 0; s <= maxMonths; s += stepX) {
      const x = (s * width) / maxMonths;
      canvas.push({ type: 'line', x1: x, y1: height, x2: x, y2: 0, lineWidth: 0.2, lineColor: '#cbd5e1' });
      xLabels.push({ text: s.toString(), fontSize: 5, width: 'auto' });
    }
    // Eje Y
    for (let v = 0; v <= maxY; v += stepY) {
      const y = height - (v * height) / maxY;
      canvas.push({ type: 'line', x1: 0, y1: y, x2: width, y2: y, lineWidth: 0.2, lineColor: '#cbd5e1' });
    }

    const drawCurve = (p: number[][], color: string, isDashed: boolean = false) => {
      for (let i = 0; i < p.length - 1; i++) {
        const x1 = (p[i][0] * width) / maxMonths;
        const y1 = height - (p[i][1] * height) / maxY;
        const x2 = (p[i+1][0] * width) / maxMonths;
        const y2 = height - (p[i+1][1] * height) / maxY;
        const line: any = { type: 'line', x1, y1, x2, y2, lineWidth: 1, lineColor: color };
        if (isDashed) line.dash = { length: 2 };
        canvas.push(line);
      }
    };

    // Generar percentiles dinámicamente hasta maxMonths
    const mValues: number[] = [];
    for (let m = 0; m <= maxMonths; m += (maxMonths / 10)) {
      mValues.push(m);
    }
    const p95_peso = mValues.map(m => [m, 3.5 + Math.sqrt(m) * 2.2]);
    const p50_peso = mValues.map(m => [m, 3.2 + Math.sqrt(m) * 1.8]);
    const p5_peso  = mValues.map(m => [m, 2.5 + Math.sqrt(m) * 1.4]);

    drawCurve(p95_peso, '#fca5a5', true); // P95
    drawCurve(p50_peso, '#cbd5e1', false); // P50
    drawCurve(p5_peso, '#fca5a5', true); // P5

    const points: any[] = [];
    const validControles = (controles || [])
      .map(c => {
        const fechaC = new Date(c.creadoEn);
        const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
        return { x, y: parseFloat(c.peso) };
      })
      .filter(c => !isNaN(c.x) && !isNaN(c.y) && c.x >= 0 && c.x <= maxMonths)
      .sort((a, b) => a.x - b.x);

    validControles.forEach(c => {
      const px = (c.x * width) / maxMonths;
      const py = height - (c.y * height) / maxY;
      canvas.push({ type: 'ellipse', x: px, y: py, r1: 3, r2: 3, color: '#3b82f6', lineColor: '#ffffff', lineWidth: 1 });
      points.push({ x: px, y: py });
    });
    for (let i = 0; i < points.length - 1; i++) {
      canvas.push({ type: 'line', x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, lineWidth: 1, lineColor: '#3b82f6' });
    }

    const axisText = maxMonths === 60 ? '0       10       20       30       40       50       60' : '0       20       40       60       80       100       120';

    return {
      stack: [
        { text: 'Peso para la Edad (kg)', style: 'chartTitle' },
        {
          table: {
            widths: [12, 180],
            body: [[
              {
                stack: yLabels.map((v, idx) => ({ text: v.toString(), fontSize: 5, margin: [0, idx === 0 ? 0 : 14.5, 0, 0] })),
                border: [false, false, false, false]
              },
              {
                stack: [
                  { canvas: canvas },
                  { text: axisText, fontSize: 5, margin: [0, 2, 0, 0] },
                  { text: 'Edad (Meses)', fontSize: 6, alignment: 'center', margin: [0, 1, 0, 0] }
                ],
                border: [false, false, false, false]
              }
            ]]
          },
          layout: {
            paddingLeft: () => 0, paddingRight: () => 0,
            paddingTop: () => 0, paddingBottom: () => 0
          }
        },
        { 
          columns: [
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#cbd5e1' }] },
            { text: 'P50 (Promedio)', fontSize: 6, margin: [2, 0, 10, 0] },
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#3b82f6' }] },
            { text: 'Paciente', fontSize: 6, margin: [2, 0, 0, 0] }
          ],
          alignment: 'center', margin: [0, 5, 0, 0]
        }
      ]
    };
  }

  private dibujarGraficaTallaEdadPediatrico(paciente: any, controles: any[]) {
    const width = 180;
    const height = 100;
    const canvas: any[] = [{ type: 'rect', x: 0, y: 0, w: width, h: height, color: '#ffffff', lineWidth: 0.5, lineColor: '#e2e8f0' }];
    const xLabels: any[] = [];

    // Calcular edad máxima en meses para adaptar la escala
    const nac = new Date(paciente.fechaNacimiento);
    let maxMonths = 60;
    (controles || []).forEach(c => {
      const fechaC = new Date(c.creadoEn);
      const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
      if (!isNaN(x) && x > maxMonths) {
        maxMonths = x;
      }
    });

    // Si la edad máxima supera los 60 meses, escalamos a 120 meses
    if (maxMonths > 60) {
      maxMonths = 120;
    } else {
      maxMonths = 60;
    }

    const stepX = maxMonths === 60 ? 10 : 20;
    const minY = 40;
    const maxY = maxMonths === 60 ? 120 : 160;
    const rangeY = maxY - minY;
    const stepY = maxMonths === 60 ? 10 : 15;
    const yLabels = maxMonths === 60 
      ? [120, 110, 100, 90, 80, 70, 60, 50, 40] 
      : [160, 145, 130, 115, 100, 85, 70, 55, 40];

    // Eje X
    for (let s = 0; s <= maxMonths; s += stepX) {
      const x = (s * width) / maxMonths;
      canvas.push({ type: 'line', x1: x, y1: height, x2: x, y2: 0, lineWidth: 0.2, lineColor: '#cbd5e1' });
      xLabels.push({ text: s.toString(), fontSize: 5, width: 'auto' });
    }
    // Eje Y
    for (let v = minY; v <= maxY; v += stepY) {
      const y = height - ((v - minY) * height) / rangeY;
      canvas.push({ type: 'line', x1: 0, y1: y, x2: width, y2: y, lineWidth: 0.2, lineColor: '#cbd5e1' });
    }

    const drawCurve = (p: number[][], color: string, isDashed: boolean = false) => {
      for (let i = 0; i < p.length - 1; i++) {
        const x1 = (p[i][0] * width) / maxMonths;
        const y1 = height - ((p[i][1] - minY) * height) / rangeY;
        const x2 = (p[i+1][0] * width) / maxMonths;
        const y2 = height - ((p[i+1][1] - minY) * height) / rangeY;
        const line: any = { type: 'line', x1, y1, x2, y2, lineWidth: 1, lineColor: color };
        if (isDashed) line.dash = { length: 2 };
        canvas.push(line);
      }
    };

    // Generar percentiles dinámicamente hasta maxMonths
    const mValues: number[] = [];
    for (let m = 0; m <= maxMonths; m += (maxMonths / 10)) {
      mValues.push(m);
    }
    const p95_talla = mValues.map(m => [m, 50 + Math.sqrt(m) * 9]);
    const p50_talla = mValues.map(m => [m, 49 + Math.sqrt(m) * 8]);
    const p5_talla  = mValues.map(m => [m, 46 + Math.sqrt(m) * 7]);

    drawCurve(p95_talla, '#fca5a5', true); // P95
    drawCurve(p50_talla, '#cbd5e1', false); // P50
    drawCurve(p5_talla, '#fca5a5', true); // P5

    const points: any[] = [];
    const validControles = (controles || [])
      .map(c => {
        const fechaC = new Date(c.creadoEn);
        const x = (fechaC.getFullYear() - nac.getFullYear()) * 12 + (fechaC.getMonth() - nac.getMonth());
        return { x, y: parseFloat(c.talla) };
      })
      .filter(c => !isNaN(c.x) && !isNaN(c.y) && c.x >= 0 && c.x <= maxMonths)
      .sort((a, b) => a.x - b.x);

    validControles.forEach(c => {
      const px = (c.x * width) / maxMonths;
      const py = height - ((c.y - minY) * height) / rangeY;
      canvas.push({ type: 'ellipse', x: px, y: py, r1: 3, r2: 3, color: '#10b981', lineColor: '#ffffff', lineWidth: 1 });
      points.push({ x: px, y: py });
    });
    for (let i = 0; i < points.length - 1; i++) {
      canvas.push({ type: 'line', x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, lineWidth: 1, lineColor: '#10b981' });
    }

    const axisText = maxMonths === 60 ? '0       10       20       30       40       50       60' : '0       20       40       60       80       100       120';

    return {
      stack: [
        { text: 'Talla para la Edad (cm)', style: 'chartTitle' },
        {
          table: {
            widths: [12, 180],
            body: [[
              {
                stack: yLabels.map((v, idx) => ({ text: v.toString(), fontSize: 5, margin: [0, idx === 0 ? 0 : 8.2, 0, 0] })),
                border: [false, false, false, false]
              },
              {
                stack: [
                  { canvas: canvas },
                  { text: axisText, fontSize: 5, margin: [0, 2, 0, 0] },
                  { text: 'Edad (Meses)', fontSize: 6, alignment: 'center', margin: [0, 1, 0, 0] }
                ],
                border: [false, false, false, false]
              }
            ]]
          },
          layout: {
            paddingLeft: () => 0, paddingRight: () => 0,
            paddingTop: () => 0, paddingBottom: () => 0
          }
        },
        { 
          columns: [
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#cbd5e1' }] },
            { text: 'P50 (Promedio)', fontSize: 6, margin: [2, 0, 10, 0] },
            { width: 12, canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#10b981' }] },
            { text: 'Paciente', fontSize: 6, margin: [2, 0, 0, 0] }
          ],
          alignment: 'center', margin: [0, 5, 0, 0]
        }
      ]
    };
  }

  async generarCarnetPediatrico(paciente: any, controles: any[], roadmap: any[]) {
    const pdfmake = this.getPrinter();

    const calcularEdadExacta = (fechaNac: any) => {
      if (!fechaNac) return '---';
      const nac = new Date(fechaNac);
      const hoy = new Date();
      let anos = hoy.getFullYear() - nac.getFullYear();
      let meses = hoy.getMonth() - nac.getMonth();
      let dias = hoy.getDate() - nac.getDate();

      if (dias < 0) {
        meses--;
        dias += new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      }
      if (meses < 0) {
        anos--;
        meses += 12;
      }
      if (anos > 0) {
        return `${anos} ${anos === 1 ? 'año' : 'años'}, ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
      } else {
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}, ${dias} ${dias === 1 ? 'día' : 'días'}`;
      }
    };
    
    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 30, 40, 40],
      content: [
        {
          columns: [
            { 
              stack: [
                { text: 'SISTEMA INTEGRAL DE SALUD (SISS)', style: 'header' },
                { text: (paciente.establecimiento?.nombre || 'ESTABLECIMIENTO DE SALUD').toUpperCase(), fontSize: 8, bold: true, color: '#475569', margin: [0, 2, 0, 0] }
              ]
            },
            { text: `Generado: ${new Date().toLocaleDateString()}`, alignment: 'right', style: 'subheader' },
          ],
        },
        { text: 'HISTORIAL CLÍNICO DE CRECIMIENTO Y DESARROLLO INFANTIL', style: 'title', alignment: 'center', margin: [0, 10, 0, 20] },
        
        { text: 'DATOS DE IDENTIFICACIÓN DEL PACIENTE', style: 'sectionTitle' },
        {
          table: {
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Nombre Completo', style: 'tableHeader' }, 
                { text: 'DNI / Identificación', style: 'tableHeader' }, 
                { text: 'No. Expediente', style: 'tableHeader' }, 
                { text: 'Sexo', style: 'tableHeader' },
                { text: 'Edad Actual', style: 'tableHeader' }
              ],
              [
                `${paciente.nombres} ${paciente.apellidos}`, 
                paciente.dni || '---', 
                paciente.numeroExpediente || '---', 
                paciente.sexo?.nombre || '---',
                { text: calcularEdadExacta(paciente.fechaNacimiento), bold: true }
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },

        { text: 'EVOLUCIÓN DE CRECIMIENTO', style: 'sectionTitle', margin: [0, 15, 0, 10] },
        {
          columns: [
            this.dibujarGraficaPesoEdadPediatrico(paciente, controles),
            this.dibujarGraficaTallaEdadPediatrico(paciente, controles)
          ],
          columnGap: 20
        },

        { text: 'HISTORIAL DE CONTROLES DE CRECIMIENTO Y DESARROLLO', style: 'sectionTitle', margin: [0, 15, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'Fecha', style: 'tableHeader' }, 
                { text: 'Edad', style: 'tableHeader' }, 
                { text: 'Antropometría', style: 'tableHeader' }, 
                { text: 'Nutrición / IMC', style: 'tableHeader' }, 
                { text: 'Alimentación / Supl.', style: 'tableHeader' }, 
                { text: 'Desarrollo', style: 'tableHeader' }, 
                { text: 'Responsable / Observaciones', style: 'tableHeader' }
              ],
              ...(controles || []).map(c => {
                const fechaC = new Date(c.creadoEn);
                const nac = new Date(paciente.fechaNacimiento);
                const diffYears = fechaC.getFullYear() - nac.getFullYear();
                const diffMonths = fechaC.getMonth() - nac.getMonth();
                const diffDays = fechaC.getDate() - nac.getDate();
                let m = diffYears * 12 + diffMonths;
                if (diffDays < 0) m -= 1;
                const edadControlMeses = Math.max(0, m);

                const sups: string[] = [];
                if (c.vitaminaA) sups.push('Vit.A');
                if (c.hierro) sups.push('Hierro');
                if (c.desparasitacion) sups.push('Desp.');
                const supsStr = sups.length > 0 ? sups.join(', ') : 'Ninguno';

                return [
                  new Date(c.creadoEn).toLocaleDateString(),
                  `${edadControlMeses} m`,
                  {
                    stack: [
                      { text: `Peso: ${c.peso} kg`, fontSize: 8 },
                      { text: `Talla: ${c.talla} cm`, fontSize: 8 },
                      c.perimetroCefalico ? { text: `P.Céf.: ${c.perimetroCefalico} cm`, fontSize: 8 } : null
                    ].filter(Boolean)
                  },
                  {
                    stack: [
                      { text: `IMC: ${c.imc || '--'}`, fontSize: 8 },
                      { text: c.estadoNutricional || '--', bold: true, color: c.estadoNutricional === 'Normal' ? '#059669' : '#b91c1c', fontSize: 8 }
                    ]
                  },
                  {
                    stack: [
                      { text: `Lactancia: ${c.lactanciaMaterna ? 'EXCLUSIVA' : (c.alimentacionComp ? 'MIXTA' : 'NO')}`, fontSize: 7 },
                      { text: `Supl.: ${supsStr}`, fontSize: 7, color: '#475569' }
                    ]
                  },
                  { 
                    text: c.alertaDesarrollo || 'NORMAL', 
                    bold: true, 
                    color: c.alertaDesarrollo === 'ALERTA' ? '#b91c1c' : '#059669', 
                    fontSize: 8 
                  },
                  {
                    stack: [
                      { text: `${c.creadoPor?.nombres || ''} ${c.creadoPor?.apellidos || ''}`.trim() || '---', fontSize: 7, bold: true },
                      { text: c.observaciones || '', fontSize: 7, color: '#475569', margin: [0, 2, 0, 0] }
                    ]
                  }
                ];
              })
            ],
          },
          layout: 'headerLineOnly',
        },

        { text: 'ESQUEMA DE INMUNIZACIONES (PAI)', style: 'sectionTitle', margin: [0, 20, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'Vacuna', style: 'tableHeader' }, 
                { text: 'Dosis Recomendada', style: 'tableHeader' }, 
                { text: 'Estado', style: 'tableHeader' },
                { text: 'Fecha Aplicación', style: 'tableHeader' },
                { text: 'Establecimiento y Aplicador', style: 'tableHeader' }
              ],
              ...roadmap.flatMap(v => v.dosis.map((d: any) => [
                { text: v.nombre, bold: true, fontSize: 8 },
                { text: `Dosis ${d.numeroDosis} (${d.edadRecomendadaMeses} meses)`, fontSize: 8 },
                { 
                  text: d.aplicada ? 'APLICADA' : 'PENDIENTE', 
                  color: d.aplicada ? '#059669' : '#d97706', 
                  bold: true,
                  fontSize: 8
                },
                { text: d.fechaAplicacion ? new Date(d.fechaAplicacion).toLocaleDateString() : '---', fontSize: 8 },
                { 
                  text: d.aplicada 
                    ? `${d.establecimientoNombre || ''} ${d.aplicadorNombre ? ' / ' + d.aplicadorNombre : ''}`.trim() || '---'
                    : '---', 
                  fontSize: 7 
                }
              ]))
            ],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        header: { fontSize: 10, bold: true, color: '#1d4ed8' },
        subheader: { fontSize: 8, color: '#64748b' },
        title: { fontSize: 14, bold: true, color: '#1e293b' },
        sectionTitle: { fontSize: 10, bold: true, color: '#1d4ed8', margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fontSize: 9, color: '#1e3a8a' },
        chartTitle: { fontSize: 10, bold: true, alignment: 'center', color: '#334155', margin: [0, 0, 0, 5] }
      },
      footer: (currentPage: number, pageCount: number) => {
        return { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 7, margin: [40, 10] };
      },
    };

    const doc = pdfmake.createPdf(docDefinition);
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }

  async generarNotaControlPediatrico(paciente: any, control: any) {
    const pdfmake = this.getPrinter();

    const calcularEdadEnControl = (fechaNac: any, fechaC: any) => {
      if (!fechaNac || !fechaC) return '---';
      const nac = new Date(fechaNac);
      const ctrl = new Date(fechaC);
      let anos = ctrl.getFullYear() - nac.getFullYear();
      let meses = ctrl.getMonth() - nac.getMonth();
      let dias = ctrl.getDate() - nac.getDate();

      if (dias < 0) {
        meses--;
        dias += new Date(ctrl.getFullYear(), ctrl.getMonth(), 0).getDate();
      }
      if (meses < 0) {
        anos--;
        meses += 12;
      }
      if (anos > 0) {
        return `${anos} ${anos === 1 ? 'año' : 'años'}, ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
      } else {
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}, ${dias} ${dias === 1 ? 'día' : 'días'}`;
      }
    };

    const historia = control.historia || {};
    const medico = historia.medico || {};
    const sups: string[] = [];
    if (control.vitaminaA) sups.push('Vitamina A');
    if (control.hierro) sups.push('Hierro');
    if (control.desparasitacion) sups.push('Desparasitación');
    const supsStr = sups.length > 0 ? sups.join(', ') : 'Ninguno';

    // Secciones opcionales
    const ordenesStack: any[] = [];

    // Recetas
    if (historia.recetas && historia.recetas.length > 0) {
      ordenesStack.push({ text: 'MEDICAMENTOS RECETADOS', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyRec: any[] = [[
        { text: 'Medicamento', style: 'tableHeader' },
        { text: 'Dosis', style: 'tableHeader' },
        { text: 'Frecuencia', style: 'tableHeader' },
        { text: 'Duración', style: 'tableHeader' },
        { text: 'Cantidad', style: 'tableHeader' },
        { text: 'Indicaciones', style: 'tableHeader' }
      ]];
      historia.recetas.forEach((rec: any) => {
        (rec.detalles || []).forEach((det: any) => {
          bodyRec.push([
            { text: det.medicamento?.nombreGenerico || '---', bold: true, fontSize: 8 },
            { text: det.dosis || '---', fontSize: 8 },
            { text: det.frecuencia || '---', fontSize: 8 },
            { text: `${det.duracion || '---'} días`, fontSize: 8 },
            { text: det.cantidad || '0', fontSize: 8 },
            { text: det.indicaciones || '---', fontSize: 7, color: '#475569' }
          ]);
        });
      });
      if (bodyRec.length > 1) {
        ordenesStack.push({
          table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', '*'], body: bodyRec },
          layout: 'lightHorizontalLines'
        });
      }
    }

    // Vacunas Recetadas PAI
    const vacunasRecetadas = control.vacunasRecetadasJson || control.vacunasRecetadas || [];
    if (vacunasRecetadas.length > 0) {
      ordenesStack.push({ text: 'INMUNIZACIONES INDICADAS (PAI)', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyVac: any[] = [[
        { text: 'Vacuna', style: 'tableHeader' },
        { text: 'Dosis / Esquema', style: 'tableHeader' },
        { text: 'Observaciones / Indicaciones', style: 'tableHeader' }
      ]];
      vacunasRecetadas.forEach((vr: any) => {
        bodyVac.push([
          { text: vr.vacunaNombre || '---', bold: true, fontSize: 8 },
          { text: vr.esquemaDescripcion || '---', fontSize: 8 },
          { text: vr.observaciones || '---', fontSize: 7, color: '#475569' }
        ]);
      });
      ordenesStack.push({
        table: { headerRows: 1, widths: ['auto', 'auto', '*'], body: bodyVac },
        layout: 'lightHorizontalLines'
      });
    }

    // Laboratorios
    if (historia.solicitudesLab && historia.solicitudesLab.length > 0) {
      ordenesStack.push({ text: 'SOLICITUDES DE LABORATORIO', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyLab: any[] = [[
        { text: 'Examen', style: 'tableHeader' },
        { text: 'Indicaciones', style: 'tableHeader' }
      ]];
      historia.solicitudesLab.forEach((s: any) => {
        (s.detalles || []).forEach((det: any) => {
          bodyLab.push([
            { text: det.examen?.nombre || '---', bold: true, fontSize: 8 },
            { text: det.observaciones || '---', fontSize: 8, color: '#475569' }
          ]);
        });
      });
      if (bodyLab.length > 1) {
        ordenesStack.push({
          table: { headerRows: 1, widths: ['30%', '*'], body: bodyLab },
          layout: 'lightHorizontalLines'
        });
      }
    }

    // Radiología
    if (historia.solicitudesRad && historia.solicitudesRad.length > 0) {
      ordenesStack.push({ text: 'SOLICITUDES DE RADIOLOGÍA', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyRad: any[] = [[
        { text: 'Estudio', style: 'tableHeader' },
        { text: 'Indicaciones', style: 'tableHeader' }
      ]];
      historia.solicitudesRad.forEach((s: any) => {
        (s.detalles || []).forEach((det: any) => {
          bodyRad.push([
            { text: det.estudio?.nombre || '---', bold: true, fontSize: 8 },
            { text: det.observaciones || '---', fontSize: 8, color: '#475569' }
          ]);
        });
      });
      if (bodyRad.length > 1) {
        ordenesStack.push({
          table: { headerRows: 1, widths: ['30%', '*'], body: bodyRad },
          layout: 'lightHorizontalLines'
        });
      }
    }

    // Remisiones / Referencias
    if (historia.referidos && historia.referidos.length > 0) {
      ordenesStack.push({ text: 'REFERENCIAS MÉDICAS EMITIDAS', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyRef: any[] = [[
        { text: 'Establecimiento Destino', style: 'tableHeader' },
        { text: 'Especialidad', style: 'tableHeader' },
        { text: 'Motivo', style: 'tableHeader' },
        { text: 'Prioridad', style: 'tableHeader' }
      ]];
      historia.referidos.forEach((ref: any) => {
        bodyRef.push([
          { text: ref.destino?.nombre || '---', bold: true, fontSize: 8 },
          { text: ref.especialidadDestino || '---', fontSize: 8 },
          { text: ref.motivo || '---', fontSize: 8, color: '#475569' },
          { text: ref.urgente ? 'URGENTE' : 'NORMAL', color: ref.urgente ? '#b91c1c' : '#475569', bold: ref.urgente, fontSize: 8 }
        ]);
      });
      ordenesStack.push({
        table: { headerRows: 1, widths: ['*', 'auto', '*', 'auto'], body: bodyRef },
        layout: 'lightHorizontalLines'
      });
    }

    // Incapacidades
    if (historia.incapacidades && historia.incapacidades.length > 0) {
      ordenesStack.push({ text: 'INCAPACIDADES / REPOSOS EMITIDOS', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyInc: any[] = [[
        { text: 'Tipo', style: 'tableHeader' },
        { text: 'Días', style: 'tableHeader' },
        { text: 'Vigencia', style: 'tableHeader' },
        { text: 'Motivo', style: 'tableHeader' }
      ]];
      historia.incapacidades.forEach((inc: any) => {
        bodyInc.push([
          { text: inc.tipo || '---', bold: true, fontSize: 8 },
          { text: inc.dias || '0', fontSize: 8 },
          { text: `Del ${new Date(inc.fechaInicio).toLocaleDateString()} al ${new Date(inc.fechaFin).toLocaleDateString()}`, fontSize: 8 },
          { text: inc.motivo || '---', fontSize: 8, color: '#475569' }
        ]);
      });
      ordenesStack.push({
        table: { headerRows: 1, widths: ['auto', 'auto', '*', '*'], body: bodyInc },
        layout: 'lightHorizontalLines'
      });
    }

    // Próxima Cita
    if (historia.proximaCita) {
      ordenesStack.push({ text: 'PRÓXIMA CITA', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      ordenesStack.push({
        table: {
          widths: ['auto', '*'],
          body: [
            [{ text: 'Fecha y Hora', style: 'tableHeader' }, { text: 'Motivo / Indicaciones', style: 'tableHeader' }],
            [
              { text: new Date(historia.proximaCita.fechaHora).toLocaleString(), fontSize: 8, bold: true },
              { text: historia.proximaCita.motivo || '---', fontSize: 8, color: '#475569' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      });
    }

    // Hitos de Desarrollo
    const hitosStack: any[] = [];
    const desarrollo = control.desarrolloJson || [];
    if (desarrollo.length > 0) {
      hitosStack.push({ text: 'HITOS DE DESARROLLO EVALUADOS', style: 'sectionTitle', margin: [0, 10, 0, 5] });
      
      const hitosColumns: any[] = [];
      let currentColumn: any[] = [];

      desarrollo.forEach((grupo: any, idx: number) => {
        if (grupo.hitos && grupo.hitos.length > 0) {
          const grupoStack: any[] = [
            { text: grupo.rango, fontSize: 8, bold: true, color: '#1d4ed8', margin: [0, 3, 0, 2] }
          ];
          grupo.hitos.forEach((h: any) => {
            grupoStack.push({
              text: `[${h.cumplido ? '✓' : ' '}]  ${h.nombre}`,
              fontSize: 7.5,
              color: h.cumplido ? '#059669' : '#64748b',
              margin: [0, 1]
            });
          });

          currentColumn.push({ stack: grupoStack, margin: [0, 0, 0, 8] });

          // Distribuir en 2 columnas
          if (currentColumn.length >= 2 || idx === desarrollo.length - 1) {
            hitosColumns.push({ stack: [...currentColumn], width: '*' });
            currentColumn = [];
          }
        }
      });

      if (hitosColumns.length > 0) {
        hitosStack.push({
          columns: hitosColumns,
          columnGap: 20
        });
      }
    }

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 30, 40, 40],
      content: [
        {
          columns: [
            { 
              stack: [
                { text: 'SISTEMA INTEGRAL DE SALUD (SISS)', style: 'header' },
                { text: (paciente.establecimiento?.nombre || 'ESTABLECIMIENTO DE SALUD').toUpperCase(), fontSize: 8, bold: true, color: '#475569', margin: [0, 2, 0, 0] }
              ]
            },
            { text: `Fecha Emisión: ${new Date().toLocaleDateString()}`, alignment: 'right', style: 'subheader' },
          ],
        },
        { text: 'RESUMEN DE CONSULTA PEDIÁTRICA', style: 'title', alignment: 'center', margin: [0, 15, 0, 15] },
        
        { text: 'INFORMACIÓN DE IDENTIFICACIÓN', style: 'sectionTitle' },
        {
          table: {
            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Nombre Completo', style: 'tableHeader' }, 
                { text: 'DNI / Identificación', style: 'tableHeader' }, 
                { text: 'No. Expediente', style: 'tableHeader' }, 
                { text: 'Sexo', style: 'tableHeader' },
                { text: 'Edad en Consulta', style: 'tableHeader' }
              ],
              [
                `${paciente.nombres} ${paciente.apellidos}`, 
                paciente.dni || '---', 
                paciente.numeroExpediente || '---', 
                paciente.sexo?.nombre || '---',
                { text: calcularEdadEnControl(paciente.fechaNacimiento, control.creadoEn), bold: true }
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },

        { text: 'DETALLE DE LA EVALUACIÓN CLÍNICA', style: 'sectionTitle', margin: [0, 12, 0, 6] },
        {
          table: {
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'Fecha Control', style: 'tableHeader' }, 
                { text: 'Peso', style: 'tableHeader' }, 
                { text: 'Talla', style: 'tableHeader' }, 
                { text: 'IMC / Nutrición', style: 'tableHeader' },
                { text: 'P. Cefálico', style: 'tableHeader' },
                { text: 'Médico Evaluador', style: 'tableHeader' }
              ],
              [
                new Date(control.creadoEn).toLocaleDateString(),
                `${control.peso} kg`,
                `${control.talla} cm`,
                {
                  stack: [
                    { text: `IMC: ${control.imc || '--'}`, fontSize: 8 },
                    { text: control.estadoNutricional || '--', bold: true, color: control.estadoNutricional === 'Normal' ? '#059669' : '#b91c1c', fontSize: 8 }
                  ]
                },
                `${control.perimetroCefalico || '--'} cm`,
                { text: `${medico.nombres || ''} ${medico.apellidos || ''}`.trim() || '---', bold: true }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },

        {
          columns: [
            {
              width: '45%',
              stack: [
                { text: 'SUPLEMENTOS Y NUTRICIÓN', style: 'sectionTitle', margin: [0, 10, 0, 4] },
                {
                  ul: [
                    { text: `Lactancia Materna: ${control.lactanciaMaterna ? 'EXCLUSIVA' : 'NO'}`, fontSize: 8 },
                    { text: `Alimentación Complementaria: ${control.alimentacionComp ? 'SÍ' : 'NO'}`, fontSize: 8 },
                    { text: `Suplementos Entregados: ${supsStr}`, fontSize: 8, bold: true, color: '#0f766e' }
                  ],
                  margin: [5, 2, 0, 0]
                }
              ]
            },
            {
              width: '10%',
              text: ''
            },
            {
              width: '45%',
              stack: [
                { text: 'EVALUACIÓN DE DESARROLLO', style: 'sectionTitle', margin: [0, 10, 0, 4] },
                {
                  stack: [
                    { text: `Estado de Desarrollo: ${control.alertaDesarrollo || 'NORMAL'}`, fontSize: 8, bold: true, color: control.alertaDesarrollo === 'ALERTA' ? '#b91c1c' : '#059669' },
                    { text: 'Hitos evaluados según su rango de edad correspondientes para el control.', fontSize: 7, color: '#64748b', margin: [0, 3] }
                  ]
                }
              ]
            }
          ],
          margin: [0, 5, 0, 10]
        },

        // Hitos de desarrollo si existen
        ...hitosStack,

        { text: 'OBSERVACIONES Y NOTAS CLÍNICAS', style: 'sectionTitle', margin: [0, 10, 0, 4] },
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: control.observaciones || 'Sin observaciones adicionales registradas en esta consulta.', fontSize: 8.5, italic: !control.observaciones, color: control.observaciones ? '#1e293b' : '#64748b' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },

        // Diagnósticos CIE-10
        { text: 'DIAGNÓSTICOS ASOCIADOS', style: 'sectionTitle', margin: [0, 10, 0, 4] },
        {
          table: {
            widths: ['auto', '*'],
            body: [
              [{ text: 'Código CIE-10', style: 'tableHeader' }, { text: 'Descripción del Diagnóstico', style: 'tableHeader' }],
              ...(historia.diagnosticos && historia.diagnosticos.length > 0 
                ? historia.diagnosticos.map((d: any) => [{ text: d.codigoCIE10, bold: true, fontSize: 8 }, { text: d.descripcion, fontSize: 8 }])
                : [[{ text: 'Z00.1', bold: true, fontSize: 8 }, { text: 'Control de salud de rutina del niño (Niño Sano)', fontSize: 8 }]]
              )
            ]
          },
          layout: 'lightHorizontalLines'
        },

        // Órdenes y prescripciones adicionales
        ...ordenesStack,
      ],
      styles: {
        header: { fontSize: 10, bold: true, color: '#1d4ed8' },
        subheader: { fontSize: 8, color: '#64748b' },
        title: { fontSize: 13, bold: true, color: '#1e293b' },
        sectionTitle: { fontSize: 9, bold: true, color: '#1d4ed8', margin: [0, 10, 0, 4] },
        tableHeader: { bold: true, fontSize: 8.5, color: '#1e3a8a' },
      },
      footer: (currentPage: number, pageCount: number) => {
        return { text: `Reporte de Consulta Individual • Página ${currentPage} de ${pageCount}`, alignment: 'center', fontSize: 7, margin: [40, 10] };
      },
    };

    const doc = pdfmake.createPdf(docDefinition);
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }

  async generarNotaControlPrenatal(embarazo: any, control: any, historia: any) {
    const pdfmake = this.getPrinter();
    const paciente = embarazo.paciente || {};
    const medico = historia.medico || {};
    
    // Parsear datos fetos
    let datosFetos = control.datosFetos || [];
    if (typeof datosFetos === 'string') {
      try { datosFetos = JSON.parse(datosFetos); } catch(e) { datosFetos = []; }
    }

    const formatearFcf = () => {
      let base = (control.fcf || '--').toString();
      if (datosFetos && Array.isArray(datosFetos)) {
        datosFetos.forEach((f: any) => { base += ` / ${f.fcf || '--'}`; });
      }
      return base;
    };

    const formatearMov = () => {
      let base = control.movimientosFetales ? 'SÍ' : 'NO';
      if (datosFetos && Array.isArray(datosFetos)) {
        datosFetos.forEach((f: any) => { base += ` / ${f.movimientos ? 'SÍ' : 'NO'}`; });
      }
      return base;
    };

    // Secciones opcionales: Recetas, Laboratorios, Radiología, Referencias, Cita
    const ordenesStack: any[] = [];

    // Recetas
    if (historia.recetas && historia.recetas.length > 0) {
      ordenesStack.push({ text: 'MEDICAMENTOS RECETADOS', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyRec: any[] = [[
        { text: 'Medicamento', style: 'tableHeader' },
        { text: 'Dosis', style: 'tableHeader' },
        { text: 'Frecuencia', style: 'tableHeader' },
        { text: 'Duración', style: 'tableHeader' },
        { text: 'Cantidad', style: 'tableHeader' },
        { text: 'Indicaciones', style: 'tableHeader' }
      ]];
      historia.recetas.forEach((rec: any) => {
        (rec.detalles || []).forEach((det: any) => {
          bodyRec.push([
            { text: det.medicamento?.nombreGenerico || '---', bold: true, fontSize: 8 },
            { text: det.dosis || '---', fontSize: 8 },
            { text: det.frecuencia || '---', fontSize: 8 },
            { text: `${det.duracion || '---'} días`, fontSize: 8 },
            { text: det.cantidad || '0', fontSize: 8 },
            { text: det.indicaciones || '---', fontSize: 7, color: '#475569' }
          ]);
        });
      });
      if (bodyRec.length > 1) {
        ordenesStack.push({
          table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', '*'], body: bodyRec },
          layout: 'lightHorizontalLines'
        });
      }
    }

    // Laboratorios
    if (historia.solicitudesLab && historia.solicitudesLab.length > 0) {
      ordenesStack.push({ text: 'SOLICITUDES DE LABORATORIO', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyLab: any[] = [[
        { text: 'Examen', style: 'tableHeader' },
        { text: 'Indicaciones', style: 'tableHeader' }
      ]];
      historia.solicitudesLab.forEach((s: any) => {
        (s.detalles || []).forEach((det: any) => {
          bodyLab.push([
            { text: det.examen?.nombre || '---', bold: true, fontSize: 8 },
            { text: det.observaciones || '---', fontSize: 8, color: '#475569' }
          ]);
        });
      });
      if (bodyLab.length > 1) {
        ordenesStack.push({
          table: { headerRows: 1, widths: ['30%', '*'], body: bodyLab },
          layout: 'lightHorizontalLines'
        });
      }
    }

    // Radiología
    if (historia.solicitudesRad && historia.solicitudesRad.length > 0) {
      ordenesStack.push({ text: 'SOLICITUDES DE RADIOLOGÍA (Rx / Ultrasonido)', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyRad: any[] = [[
        { text: 'Estudio', style: 'tableHeader' },
        { text: 'Indicaciones', style: 'tableHeader' }
      ]];
      historia.solicitudesRad.forEach((s: any) => {
        (s.detalles || []).forEach((det: any) => {
          bodyRad.push([
            { text: det.estudio?.nombre || '---', bold: true, fontSize: 8 },
            { text: det.observaciones || '---', fontSize: 8, color: '#475569' }
          ]);
        });
      });
      if (bodyRad.length > 1) {
        ordenesStack.push({
          table: { headerRows: 1, widths: ['30%', '*'], body: bodyRad },
          layout: 'lightHorizontalLines'
        });
      }
    }

    // Referencias
    if (historia.referidos && historia.referidos.length > 0) {
      ordenesStack.push({ text: 'REFERENCIAS MÉDICAS EMITIDAS', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyRef: any[] = [[
        { text: 'Establecimiento Destino', style: 'tableHeader' },
        { text: 'Especialidad', style: 'tableHeader' },
        { text: 'Motivo', style: 'tableHeader' },
        { text: 'Prioridad', style: 'tableHeader' }
      ]];
      historia.referidos.forEach((ref: any) => {
        bodyRef.push([
          { text: ref.destino?.nombre || '---', bold: true, fontSize: 8 },
          { text: ref.especialidadDestino || '---', fontSize: 8 },
          { text: ref.motivo || '---', fontSize: 8, color: '#475569' },
          { text: ref.urgente ? 'URGENTE' : 'NORMAL', color: ref.urgente ? '#b91c1c' : '#475569', bold: ref.urgente, fontSize: 8 }
        ]);
      });
      ordenesStack.push({
        table: { headerRows: 1, widths: ['*', 'auto', '*', 'auto'], body: bodyRef },
        layout: 'lightHorizontalLines'
      });
    }

    // Incapacidades
    if (historia.incapacidades && historia.incapacidades.length > 0) {
      ordenesStack.push({ text: 'INCAPACIDADES MÉDICAS', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      const bodyInc: any[] = [[
        { text: 'Período', style: 'tableHeader' },
        { text: 'Días', style: 'tableHeader' },
        { text: 'Tipo de Incapacidad', style: 'tableHeader' },
        { text: 'Diagnóstico / Justificación', style: 'tableHeader' }
      ]];
      
      const formatFechaUTC = (dStr: string) => {
        try {
          const d = new Date(dStr);
          return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
        } catch(e) {
          return dStr;
        }
      };

      historia.incapacidades.forEach((inc: any) => {
        bodyInc.push([
          { text: `${formatFechaUTC(inc.fechaInicio)} al ${formatFechaUTC(inc.fechaFin)}`, bold: true, fontSize: 8 },
          { text: `${inc.dias} días`, fontSize: 8 },
          { text: inc.tipo || '---', fontSize: 8 },
          { text: inc.motivo || '---', fontSize: 8, color: '#475569', italic: true }
        ]);
      });
      ordenesStack.push({
        table: { headerRows: 1, widths: ['auto', 'auto', 'auto', '*'], body: bodyInc },
        layout: 'lightHorizontalLines'
      });
    }

    // Cita
    if (historia.proximaCita) {
      ordenesStack.push({ text: 'PRÓXIMA CITA DE CONTROL', style: 'sectionTitle', margin: [0, 8, 0, 4] });
      ordenesStack.push({
        table: {
          widths: ['auto', '*'],
          body: [
            [{ text: 'Fecha y Hora', style: 'tableHeader' }, { text: 'Motivo / Indicaciones', style: 'tableHeader' }],
            [
              { text: new Date(historia.proximaCita.fechaHora).toLocaleString(), fontSize: 8, bold: true },
              { text: historia.proximaCita.motivo || '---', fontSize: 8, color: '#475569' }
            ]
          ]
        },
        layout: 'lightHorizontalLines'
      });
    }

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 30, 40, 40],
      content: [
        {
          columns: [
            { 
              stack: [
                { text: 'SISTEMA INTEGRAL DE SALUD (SISS)', style: 'header' },
                { text: (paciente.establecimiento?.nombre || 'ESTABLECIMIENTO DE SALUD').toUpperCase(), fontSize: 8, bold: true, color: '#475569', margin: [0, 2, 0, 0] }
              ]
            },
            { text: `Fecha Emisión: ${new Date().toLocaleDateString()}`, alignment: 'right', style: 'subheader' },
          ],
        },
        { text: 'RESUMEN DE CONSULTA PRENATAL', style: 'title', alignment: 'center', margin: [0, 15, 0, 15] },
        
        { text: 'INFORMACIÓN DE IDENTIFICACIÓN', style: 'sectionTitle' },
        {
          table: {
            widths: ['*', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: 'Nombre Completo', style: 'tableHeader' }, 
                { text: 'DNI / Identificación', style: 'tableHeader' }, 
                { text: 'No. Expediente', style: 'tableHeader' }, 
                { text: 'Edad Gestacional', style: 'tableHeader' }
              ],
              [
                `${paciente.nombres} ${paciente.apellidos}`, 
                paciente.dni || '---', 
                paciente.numeroExpediente || '---', 
                { text: `${control.semanasGestacion} semanas`, bold: true }
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },

        { text: 'DETALLE DE LA EVALUACIÓN PRENATAL', style: 'sectionTitle', margin: [0, 12, 0, 6] },
        {
          table: {
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'Fecha', style: 'tableHeader' }, 
                { text: 'Peso', style: 'tableHeader' }, 
                { text: 'P.A.', style: 'tableHeader' }, 
                { text: 'A.U. (cm)', style: 'tableHeader' }, 
                { text: 'FCF (lpm)', style: 'tableHeader' }, 
                { text: 'Mov. Fetales', style: 'tableHeader' },
                { text: 'Edema / Prot.', style: 'tableHeader' },
                { text: 'Médico Evaluador', style: 'tableHeader' }
              ],
              [
                new Date(control.fechaControl).toLocaleDateString(),
                `${control.peso || '--'} kg`,
                `${control.taSistolica || '0'}/${control.taDiastolica || '0'}`,
                `${control.alturaUterina || '--'}`,
                formatearFcf(),
                formatearMov(),
                `${control.edema ? 'Edema' : 'No'} / ${control.proteinuria ? 'Prot.' : 'No'}`,
                { text: `${medico.nombres || ''} ${medico.apellidos || ''}`.trim() || '---', bold: true }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },

        { text: 'DIAGNÓSTICOS ASOCIADOS', style: 'sectionTitle', margin: [0, 10, 0, 4] },
        {
          table: {
            widths: ['auto', '*'],
            body: [
              [{ text: 'Código CIE-10', style: 'tableHeader' }, { text: 'Descripción del Diagnóstico', style: 'tableHeader' }],
              ...(historia.diagnosticos && historia.diagnosticos.length > 0 
                ? historia.diagnosticos.map((d: any) => [{ text: d.codigoCIE10, bold: true, fontSize: 8 }, { text: d.descripcion, fontSize: 8 }])
                : [[{ text: 'Z34.9', bold: true, fontSize: 8 }, { text: 'Supervisión de embarazo normal no especificado', fontSize: 8 }]]
              )
            ]
          },
          layout: 'lightHorizontalLines'
        },

        { text: 'OBSERVACIONES Y NOTAS CLÍNICAS', style: 'sectionTitle', margin: [0, 10, 0, 4] },
        {
          table: {
            widths: ['*'],
            body: [
              [
                { text: control.observaciones || 'Sin observaciones adicionales registradas en esta consulta.', fontSize: 8.5, italic: !control.observaciones, color: control.observaciones ? '#1e293b' : '#64748b' }
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },

        ...ordenesStack,
      ],
      styles: {
        header: { fontSize: 10, bold: true, color: '#1d4ed8' },
        subheader: { fontSize: 8, color: '#64748b' },
        title: { fontSize: 13, bold: true, color: '#1e293b' },
        sectionTitle: { fontSize: 9, bold: true, color: '#1d4ed8', margin: [0, 10, 0, 4] },
        tableHeader: { bold: true, fontSize: 8.5, color: '#1e3a8a' },
      },
      footer: (currentPage: number, pageCount: number) => {
        return { text: `Reporte de Consulta Prenatal • Página ${currentPage} de ${pageCount}`, alignment: 'center', fontSize: 7, margin: [40, 10] };
      },
    };

    const doc = pdfmake.createPdf(docDefinition);
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }
}

