import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ReportesExportService {
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
