require('ts-node/register');
const fs = require('node:fs');
const { PdfService } = require('../src/common/services/pdf.service');
(async () => {
  const paciente = { nombres: 'PACIENTE', apellidos: 'DE PRUEBA', dni: '0000000000000', numeroExpediente: 'PRUEBA' };
  const responsable = { nombres: 'PERSONAL', apellidos: 'DE PRUEBA' };
  const buffer = await new PdfService().generarKardex(paciente, { id: 1 }, [{
    fechaProgramada: '2026-09-09T08:00:00Z', fechaAplicacion: null,
    medicamento: { nombreGenerico: 'Medicamento de prueba' }, dosis: 'Dosis registrada',
    via: 'Vía registrada', estado: 'PENDIENTE', enfermera: responsable,
    observaciones: 'Registro sintético para verificar el formato del reporte.',
  }], Array.from({ length: 25 }, (_, i) => ({
    fecha: '2026-09-09T00:07:00Z', frecuenciaCardiaca: 98, frecuenciaRespiratoria: 95,
    presionArterial: '120/80', temperatura: 37.5, saturacionOxigeno: 95,
    pesoKg: null, glucoMetria: i === 0 ? 0 : null, usuario: responsable,
    observaciones: 'Observación de prueba para verificar saltos de página y ajuste de texto.',
  })));
  fs.mkdirSync('../output/pdf', { recursive: true });
  fs.writeFileSync('../output/pdf/kardex-prueba.pdf', buffer);
})().catch(error => { console.error(error); process.exitCode = 1; });
