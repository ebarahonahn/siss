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
      .map(c => ({ sem: parseFloat(c.semanasGestacion), au: parseFloat(c.alturaUterina) }))
      .filter(c => !isNaN(c.sem) && !isNaN(c.au) && c.sem >= 13 && c.sem <= 40)
      .sort((a, b) => a.sem - b.sem);

    validControles.forEach(c => {
      const px = ((c.sem - 13) * width) / (40 - 13);
      const py = height - ((c.au - 10) * height) / (40 - 10);
      canvas.push({ type: 'rect', x: px - 1.25, y: py - 1.25, w: 2.5, h: 2.5, color: '#10b981' });
      points.push({ x: px, y: py });
    });
    for (let i = 0; i < points.length - 1; i++) {
      canvas.push({ type: 'line', x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, lineWidth: 1, lineColor: '#10b981' });
    }

    return {
      stack: [
        { text: 'Altura Uterina (cm)', style: 'chartTitle' },
        {
          columns: [
            { width: 15, stack: [40, 35, 30, 25, 20, 15, 10].map((v, idx) => ({ text: v.toString(), fontSize: 5, margin: [0, idx === 0 ? 0 : 11.5, 0, 0] })) },
            {
              stack: [
                { canvas: canvas },
                { columns: xLabels, columnGap: 12, margin: [0, 2, 0, 0] },
                { text: 'Semanas', fontSize: 6, alignment: 'center', margin: [0, 2, 0, 0] }
              ]
            }
          ],
          columnGap: 5
        },
        { 
          columns: [
            { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#fca5a5' }] },
            { text: 'Percentiles', fontSize: 6, margin: [2, 0, 10, 0] },
            { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#10b981' }] },
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
      .map(c => ({ sem: parseFloat(c.semanasGestacion), p: parseFloat(c.p || c.pesoMat || c.peso) }))
      .filter(c => !isNaN(c.sem) && !isNaN(c.p) && c.sem >= 5 && c.sem <= 40)
      .sort((a, b) => a.sem - b.sem);

    const pesoBase = validControles.length > 0 ? validControles[0].p : 0;
    validControles.forEach(c => {
      const ganancia = c.p - pesoBase;
      const px = ((c.sem - 5) * width) / (40 - 5);
      const py = height - (ganancia * height) / 20;
      canvas.push({ type: 'rect', x: px - 1.25, y: py - 1.25, w: 2.5, h: 2.5, color: '#3b82f6' });
      points.push({ x: px, y: py });
    });
    for (let i = 0; i < points.length - 1; i++) {
      canvas.push({ type: 'line', x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, lineWidth: 1, lineColor: '#3b82f6' });
    }

    return {
      stack: [
        { text: 'Ganancia de Peso (kg)', style: 'chartTitle' },
        {
          columns: [
            { width: 15, stack: [20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0].map((v, idx) => ({ text: v.toString(), fontSize: 5, margin: [0, idx === 0 ? 0 : 5.4, 0, 0] })) },
            {
              stack: [
                { canvas: canvas },
                { columns: xLabels, columnGap: 18.5, margin: [0, 2, 0, 0] },
                { text: 'Semanas', fontSize: 6, alignment: 'center', margin: [0, 2, 0, 0] }
              ]
            }
          ],
          columnGap: 5
        },
        { 
          columns: [
            { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#fca5a5', dash: { length: 2 } }] },
            { text: 'Percentiles', fontSize: 6, margin: [2, 0, 10, 0] },
            { width: 'auto', canvas: [{ type: 'rect', x: 0, y: 2, w: 10, h: 2, color: '#3b82f6' }] },
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
                { text: `${semanasActuales} sem`, bold: true, fontSize: 11, background: '#fef08a' },
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
            this.dibujarGraficaPeso(embarazo.controles || []),
            this.dibujarGraficaAlturaUterina(embarazo.controles || [])
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
                Number(c.semanasGestacion).toFixed(1),
                `${c.peso || '--'}`,
                `${c.taSistolica || '0'}/${c.taDiastolica || '0'}`,
                c.alturaUterina || '--',
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
        return { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 7, margin: [40, 10] };
      },
    };

    const doc = pdfmake.createPdf(docDefinition);
    const stream = await doc.getStream();
    stream.end();
    return stream;
  }
}
