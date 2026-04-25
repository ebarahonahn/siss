
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

async function test() {
  try {
    const data = [
      {
        fecha: '2026-04-23',
        hora: '10:00:00',
        paciente: 'Test Paciente',
        expediente: 'EXP-01',
        medico: 'Dr. Test',
        especialidad: 'General',
        tipo: 'CONSULTA',
        estado: 'PROGRAMADA',
        establecimiento: 'Hospital'
      }
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Test');
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

    data.forEach(row => worksheet.addRow(row));
    console.log('Excel generated in memory');
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
