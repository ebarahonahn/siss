async function test() {
  try {
    console.log('Intentando login...');
    const loginResp = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identificador: 'medico@siss.hn',
        contrasena: 'Medico@123'
      })
    });
    
    const loginRes = await loginResp.json();
    if (!loginResp.ok) {
      throw new Error(`Login falló: ${loginResp.status} - ${JSON.stringify(loginRes)}`);
    }

    const token = loginRes.data.accessToken; // Corregido: res.data.accessToken
    console.log('Login exitoso. Token obtenido.');

    const payload = {
      pacienteId: 4, // Edgar Barahona
      subjetivo: 'Paciente con tos persistente (Prueba API Final)',
      objetivo: 'Fiebre 38.5C, garganta inflamada',
      analisis: 'Posible faringitis',
      plan: 'Reposo y liquidos',
      presionSistolica: 120,
      presionDiastolica: 80,
      frecuenciaCardiaca: 72,
      temperatura: 37,
      peso: 70,
      talla: 175,
      saturacionO2: 98,
      diagnosticos: [
        { codigoCIE10: 'J00', descripcion: 'Rinofaringitis aguda', tipo: 'PRINCIPAL' }
      ],
      recetas: [],
      incapacidades: [],
      laboratorio: [],
      radiologia: [],
      citaId: null
    };

    console.log('Intentando guardar historia clinica...');
    const saveResp = await fetch('http://localhost:3000/api/v1/historia-clinica', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });

    const saveData = await saveResp.json();
    if (!saveResp.ok) {
      console.error('ERROR DEL SERVIDOR (', saveResp.status, '):');
      console.error(JSON.stringify(saveData, null, 2));
    } else {
      console.log('EXITO:', JSON.stringify(saveData, null, 2));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

test();
