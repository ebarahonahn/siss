import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportesExportService {
  crearLibroAt1(data: any[], inicio: string, fin: string) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SISS';
    const sheet = workbook.addWorksheet('AT-1', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { orientation: 'landscape', paperSize: 5, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:5' },
    });
    sheet.columns = [
      { key: 'numero', width: 6 }, { key: 'atencionId', width: 10 },
      { key: 'fecha', width: 12 }, { key: 'hora', width: 8 },
      { key: 'establecimiento', width: 25 }, { key: 'medico', width: 28 },
      { key: 'colegiado', width: 12 }, { key: 'especialidad', width: 20 },
      { key: 'tipo', width: 16 }, { key: 'expediente', width: 16 },
      { key: 'identidad', width: 18 }, { key: 'paciente', width: 30 },
      { key: 'nacimiento', width: 12 }, { key: 'edad', width: 12 },
      { key: 'sexo', width: 12 }, { key: 'procedencia', width: 30 },
      { key: 'diagnosticos', width: 60 },
    ];
    sheet.mergeCells('A1:Q1'); sheet.getCell('A1').value = 'AT-1 · Registro Diario de Atenciones Médicas';
    sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    sheet.getRow(1).height = 30;
    sheet.mergeCells('A2:Q2'); sheet.getCell('A2').value = `Período: ${inicio} al ${fin} · Total de atenciones: ${data.length}`;
    sheet.mergeCells('A3:Q3'); sheet.getCell('A3').value = 'Versión SISS · Una fila por atención registrada; edad a la fecha de atención. Campos sin registro en blanco.';
    sheet.getRow(5).values = ['N.º', 'Atención ID', 'Fecha', 'Hora', 'Establecimiento', 'Médico', 'Colegiado', 'Especialidad', 'Tipo de cita', 'Expediente', 'Identidad', 'Paciente', 'Nacimiento', 'Edad', 'Sexo', 'Procedencia', 'Diagnósticos / CIE-10'];
    sheet.getRow(5).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '334155' } };
    sheet.getRow(5).height = 30;
    data.forEach((item, index) => {
      const row = sheet.addRow({ ...item, numero: index + 1 });
      row.height = Math.max(32, Math.min(240, 16 * (String(item.diagnosticos || '').split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 55)), 0))));
      if (index % 2 === 1) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      for (const key of ['expediente', 'identidad', 'colegiado']) row.getCell(key).numFmt = '@';
    });
    if (!data.length) { sheet.mergeCells('A6:Q6'); sheet.getCell('A6').value = 'No hay atenciones registradas para el período y alcance seleccionados.'; }
    sheet.eachRow(row => row.eachCell(cell => { cell.alignment = { vertical: 'top', wrapText: true }; }));
    sheet.autoFilter = { from: 'A5', to: `Q${Math.max(5, data.length + 5)}` };
    sheet.headerFooter.oddFooter = 'SISS · AT-1&P / &N';
    return workbook;
  }

  async generarExcelAt1(data: any[], res: Response, inicio: string, fin: string) {
    const workbook = this.crearLibroAt1(data, inicio, fin);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="at-1_${inicio}_${fin}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  }
  async generarExcelProductividad(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productividad Médica');

    // Estilos de encabezado
    worksheet.columns = [
      { header: 'MÉDICO', key: 'medico', width: 30 },
      { header: 'ESPECIALIDAD', key: 'especialidad', width: 25 },
      { header: 'ESTABLECIMIENTO', key: 'establecimiento', width: 30 },
      { header: 'TOTAL CONSULTAS', key: 'total', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }, // Slate 800
    };

    // Añadir datos
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Formato de celdas
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell(4).alignment = { horizontal: 'center' };
      }
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `productividad_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async generarExcelInventario(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Crítico');

    worksheet.columns = [
      { header: 'MEDICAMENTO', key: 'nombre', width: 35 },
      { header: 'CÓDIGO', key: 'codigo', width: 15 },
      { header: 'LOTE', key: 'lote', width: 15 },
      { header: 'VENCIMIENTO', key: 'vencimiento', width: 15 },
      { header: 'STOCK ACTUAL', key: 'stock', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '059669' }, // Emerald 600
    };

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `inventario_critico_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async generarExcelDemografia(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Demografía Pacientes');

    worksheet.columns = [
      { header: 'EXPEDIENTE', key: 'expediente', width: 15 },
      { header: 'NOMBRE COMPLETO', key: 'nombreCompleto', width: 35 },
      { header: 'SEXO', key: 'sexo', width: 12 },
      { header: 'EDAD', key: 'edad', width: 8 },
      { header: 'DEPARTAMENTO', key: 'departamento', width: 20 },
      { header: 'MUNICIPIO', key: 'municipio', width: 20 },
      { header: 'COMUNIDAD', key: 'comunidad', width: 25 },
      { header: 'DIRECCIÓN', key: 'direccion', width: 35 },
      { header: 'TELÉFONO', key: 'telefono', width: 15 },
      { header: 'TEL. EMERGENCIA', key: 'telefonoEmergencia', width: 15 },
      { header: 'CORREO', key: 'correo', width: 25 },
      { header: 'ESTABLECIMIENTO', key: 'establecimiento', width: 30 },
      { header: 'FECHA REGISTRO', key: 'fechaRegistro', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7C3AED' }, // Violet 600
    };

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `demografia_pacientes_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async generarExcelKardex(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Movimientos Kardex');

    worksheet.columns = [
      { header: 'FECHA', key: 'fecha', width: 12 },
      { header: 'HORA', key: 'hora', width: 10 },
      { header: 'MEDICAMENTO', key: 'medicamento', width: 35 },
      { header: 'CÓDIGO', key: 'codigo', width: 15 },
      { header: 'LOTE', key: 'lote', width: 15 },
      { header: 'TIPO MOV.', key: 'tipo', width: 15 },
      { header: 'CANTIDAD', key: 'cantidad', width: 12 },
      { header: 'MOTIVO', key: 'motivo', width: 30 },
      { header: 'ESTABLECIMIENTO', key: 'establecimiento', width: 30 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0284C7' }, // Sky 600
    };

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `kardex_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async generarExcelCitas(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Estado de Agenda');

    worksheet.columns = [
      { header: 'FECHA', key: 'fecha', width: 12 },
      { header: 'HORA', key: 'hora', width: 10 },
      { header: 'PACIENTE', key: 'paciente', width: 30 },
      { header: 'EXPEDIENTE', key: 'expediente', width: 15 },
      { header: 'MÉDICO', key: 'medico', width: 25 },
      { header: 'ESPECIALIDAD', key: 'especialidad', width: 20 },
      { header: 'TIPO', key: 'tipo', width: 15 },
      { header: 'ESTADO', key: 'estado', width: 15 },
      { header: 'ESTABLECIMIENTO', key: 'establecimiento', width: 25 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F59E0B' }, // Amber 500
    };

    data.forEach((row) => {
      worksheet.addRow(row);
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `agenda_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async generarExcelPai(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Consolidado PAI');

    worksheet.columns = [
      { header: 'FECHA', key: 'fecha', width: 12 },
      { header: 'PACIENTE', key: 'paciente', width: 30 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'EDAD', key: 'edad', width: 8 },
      { header: 'VACUNA', key: 'vacuna', width: 25 },
      { header: 'LOTE', key: 'lote', width: 15 },
      { header: 'SITIO', key: 'sitio', width: 20 },
      { header: 'VÍA', key: 'via', width: 15 },
      { header: 'ESTABLECIMIENTO', key: 'establecimiento', width: 25 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0891B2' }, // Cyan 600
    };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=consolidado_pai_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  async generarExcelInventarioVacunas(data: any[], res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario Biológicos');

    worksheet.columns = [
      { header: 'VACUNA', key: 'vacuna', width: 30 },
      { header: 'LOTE', key: 'lote', width: 15 },
      { header: 'FABRICANTE', key: 'fabricante', width: 20 },
      { header: 'VENCIMIENTO', key: 'vencimiento', width: 15 },
      { header: 'CANT. INICIAL', key: 'inicial', width: 12 },
      { header: 'STOCK ACTUAL', key: 'actual', width: 12 },
      { header: 'ESTABLECIMIENTO', key: 'establecimiento', width: 25 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0E7490' }, // Cyan 700
    };

    data.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inventario_vacunas_${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }
}
