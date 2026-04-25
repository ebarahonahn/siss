const { validate } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { CreateHistoriaClinicaDto, TipoIncapacidad, TipoDiagnostico } = require('../dist/modules/historia-clinica/dto/create-historia-clinica.dto');

// Objeto que simula lo que envia el frontend
const dummyPayload = {
  pacienteId: 4,
  citaId: null,
  subjetivo: 'Prueba',
  objetivo: 'Prueba',
  analisis: 'Prueba',
  plan: 'Prueba',
  presionSistolica: null,
  presionDiastolica: null,
  frecuenciaCardiaca: null,
  temperatura: null,
  peso: null,
  talla: null,
  saturacionO2: null,
  diagnosticos: [
    { codigoCIE10: 'J00', descripcion: 'Resfriado', tipo: 'PRINCIPAL' }
  ],
  recetas: [],
  incapacidades: [],
  laboratorio: [],
  radiologia: []
};

async function test() {
  const dto = plainToInstance(CreateHistoriaClinicaDto, dummyPayload);
  const errors = await validate(dto);
  if (errors.length > 0) {
    console.log('--- ERRORES DE VALIDACION ---');
    console.log(JSON.stringify(errors, null, 2));
  } else {
    console.log('Payload VALIDO');
  }
}

test();
