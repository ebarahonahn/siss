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

  async generarNotasEvolucion(paciente: any, ingreso: any, notas: any[]) {
    const pdfmake = require('pdfmake');
    pdfmake.setFonts(this.fonts);
    pdfmake.setUrlAccessPolicy(() => true); // Permitir acceso (o restringir según sea necesario)

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 60],
      content: [
        // Encabezado
        {
          columns: [
            {
              text: 'SISTEMA INTEGRAL DE SALUD (SISS)',
              style: 'header',
            },
            {
              text: new Date().toLocaleDateString(),
              alignment: 'right',
              style: 'subheader',
            },
          ],
        },
        {
          text: 'REPORTE DE NOTAS DE EVOLUCIÓN',
          style: 'title',
          alignment: 'center',
          margin: [0, 20, 0, 20],
        },

        // Datos del Paciente
        {
          style: 'tableExample',
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'PACIENTE', style: 'tableHeader' },
                { text: 'EXPEDIENTE', style: 'tableHeader' },
                { text: 'DNI', style: 'tableHeader' },
              ],
              [
                `${paciente.nombres} ${paciente.apellidos}`,
                paciente.numeroExpediente || 'N/A',
                paciente.dni || 'N/A',
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          style: 'tableExample',
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'SERVICIO', style: 'tableHeader' },
                { text: 'SALA / CAMA', style: 'tableHeader' },
                { text: 'FECHA INGRESO', style: 'tableHeader' },
              ],
              [
                ingreso.cama.habitacion.sala.servicio.catServicio.nombre,
                `${ingreso.cama.habitacion.sala.nombre} / ${ingreso.cama.codigo}`,
                new Date(ingreso.fechaIngreso).toLocaleString(),
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20],
        },

        // Listado de Notas
        ...notas.map((n) => [
          {
            canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1, lineColor: '#eeeeee' }],
            margin: [0, 10, 0, 10],
          },
          {
            columns: [
              {
                text: `FECHA: ${new Date(n.fecha).toLocaleString()}`,
                style: 'noteHeader',
              },
              {
                text: `MÉDICO: ${n.medico.nombres} ${n.medico.apellidos}`,
                style: 'noteHeader',
                alignment: 'right',
              },
            ],
          },
          {
            text: 'Signos Vitales:',
            style: 'label',
            margin: [0, 5, 0, 2],
          },
          {
            columns: [
              { text: `FC: ${n.frecuenciaCardiaca || '--'} lpm`, fontSize: 9 },
              { text: `FR: ${n.frecuenciaRespiratoria || '--'} rpm`, fontSize: 9 },
              { text: `PA: ${n.presionArterial || '--'}`, fontSize: 9 },
              { text: `Temp: ${n.temperatura || '--'} °C`, fontSize: 9 },
              { text: `SatO2: ${n.saturacionOxigeno || '--'} %`, fontSize: 9 },
            ],
            margin: [0, 0, 0, 5],
          },
          {
            text: 'Relato Clínico:',
            style: 'label',
          },
          {
            text: n.nota,
            style: 'noteText',
            margin: [0, 2, 0, 10],
          },
        ]),
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
          color: '#1e40af',
        },
        subheader: {
          fontSize: 10,
          color: '#64748b',
        },
        title: {
          fontSize: 16,
          bold: true,
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: '#475569',
          fillColor: '#f8fafc',
        },
        noteHeader: {
          fontSize: 10,
          bold: true,
          color: '#334155',
        },
        label: {
          fontSize: 9,
          bold: true,
          color: '#64748b',
        },
        noteText: {
          fontSize: 10,
          lineHeight: 1.2,
        },
      },
      footer: (currentPage: number, pageCount: number) => {
        return {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'center',
          fontSize: 8,
          margin: [0, 20, 0, 0],
        };
      },
    };

    const doc = pdfmake.createPdf(docDefinition);
    return await doc.getStream();
  }

  async generarKardex(paciente: any, ingreso: any, kardex: any[], signos: any[]) {
    const pdfmake = require('pdfmake');
    pdfmake.setFonts(this.fonts);
    pdfmake.setUrlAccessPolicy(() => true);

    const docDefinition: any = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 60],
      content: [
        {
          columns: [
            { text: 'SISTEMA INTEGRAL DE SALUD (SISS)', style: 'header' },
            { text: new Date().toLocaleDateString(), alignment: 'right', style: 'subheader' },
          ],
        },
        {
          text: 'KARDEX DE ENFERMERÍA',
          style: 'title',
          alignment: 'center',
          margin: [0, 20, 0, 20],
        },

        // Datos del Paciente
        {
          style: 'tableExample',
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'PACIENTE', style: 'tableHeader' },
                { text: 'EXPEDIENTE', style: 'tableHeader' },
                { text: 'DNI', style: 'tableHeader' },
              ],
              [
                `${paciente.nombres} ${paciente.apellidos}`,
                paciente.numeroExpediente || 'N/A',
                paciente.dni || 'N/A',
              ],
            ],
          },
          layout: 'lightHorizontalLines',
        },
        {
          style: 'tableExample',
          table: {
            widths: ['*', '*', '*'],
            body: [
              [
                { text: 'SERVICIO', style: 'tableHeader' },
                { text: 'SALA / CAMA', style: 'tableHeader' },
                { text: 'FECHA INGRESO', style: 'tableHeader' },
              ],
              [
                ingreso.cama.habitacion.sala.servicio.catServicio.nombre,
                `${ingreso.cama.habitacion.sala.nombre} / ${ingreso.cama.codigo}`,
                new Date(ingreso.fechaIngreso).toLocaleString(),
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20],
        },

        // MEDICAMENTOS
        { text: 'ADMINISTRACIÓN DE MEDICAMENTOS', style: 'sectionTitle' },
        {
          style: 'tableExample',
          table: {
            widths: ['*', 'auto', 'auto', 'auto', '*'],
            body: [
              [
                { text: 'MEDICAMENTO', style: 'tableHeader' },
                { text: 'DOSIS', style: 'tableHeader' },
                { text: 'VÍA', style: 'tableHeader' },
                { text: 'FECHA/HORA', style: 'tableHeader' },
                { text: 'ENFERMERA(O)', style: 'tableHeader' },
              ],
              ...kardex.map(k => [
                { text: k.medicamento.nombreGenerico, fontSize: 9 },
                { text: k.dosis, fontSize: 9 },
                { text: k.via || '--', fontSize: 9 },
                { text: new Date(k.fechaProgramada).toLocaleString(), fontSize: 8 },
                { text: `${k.enfermera.nombres} ${k.enfermera.apellidos}`, fontSize: 8 },
              ])
            ]
          },
          layout: 'headerLineOnly'
        },

        // SIGNOS VITALES
        { text: 'CONTROL DE SIGNOS VITALES', style: 'sectionTitle', margin: [0, 20, 0, 10] },
        {
          style: 'tableExample',
          table: {
            widths: ['auto', '*', '*', '*', '*', '*'],
            body: [
              [
                { text: 'FECHA', style: 'tableHeader' },
                { text: 'FC', style: 'tableHeader' },
                { text: 'FR', style: 'tableHeader' },
                { text: 'PA', style: 'tableHeader' },
                { text: 'TEMP', style: 'tableHeader' },
                { text: 'SATO2', style: 'tableHeader' },
              ],
              ...signos.map(s => [
                { text: new Date(s.fecha).toLocaleString(), fontSize: 8 },
                { text: `${s.frecuenciaCardiaca || '--'}`, fontSize: 9 },
                { text: `${s.frecuenciaRespiratoria || '--'}`, fontSize: 9 },
                { text: s.presionArterial || '--', fontSize: 9 },
                { text: `${s.temperatura || '--'}°C`, fontSize: 9 },
                { text: `${s.saturacionOxigeno || '--'}%`, fontSize: 9 },
              ])
            ]
          },
          layout: 'headerLineOnly'
        }
      ],
      styles: {
        header: { fontSize: 14, bold: true, color: '#1e40af' },
        subheader: { fontSize: 10, color: '#64748b' },
        title: { fontSize: 16, bold: true },
        sectionTitle: { fontSize: 12, bold: true, color: '#1e40af', margin: [0, 10, 0, 5] },
        tableHeader: { bold: true, fontSize: 10, color: '#475569', fillColor: '#f8fafc' },
      }
    };

    const doc = pdfmake.createPdf(docDefinition);
    return await doc.getStream();
  }
}
