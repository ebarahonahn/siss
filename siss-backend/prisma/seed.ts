import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { HONDURAS_GEO_DATA } from './data/honduras-geo';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando datos iniciales...');

  // ── Geografía ─────────────────────────────────────────────────────────────
  console.log('  Sembrando departamentos y municipios...');
  for (const dept of HONDURAS_GEO_DATA.departamentos) {
    await prisma.departamento.upsert({
      where: { id: dept.id },
      update: {},
      create: dept
    });
  }

  for (const muni of HONDURAS_GEO_DATA.municipios) {
    await prisma.municipio.upsert({
      where: { id: muni.id },
      update: {},
      create: muni
    });
  }
  console.log(`  ✔ ${HONDURAS_GEO_DATA.departamentos.length} departamentos y ${HONDURAS_GEO_DATA.municipios.length} municipios creados`);

  // ── Catálogos Normalizados ────────────────────────────────────────────────
  console.log('  Sembrando catálogos...');

  const sexos = ['Masculino', 'Femenino'];
  for (const s of sexos) {
    await prisma.sexo.upsert({ where: { nombre: s }, update: {}, create: { nombre: s } });
  }

  const tiposSangre = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Desconocido'];
  for (const ts of tiposSangre) {
    await prisma.tipoSangre.upsert({ where: { nombre: ts }, update: {}, create: { nombre: ts } });
  }

  const escolaridades = ['Ninguna', 'Primaria', 'Secundaria', 'Universitaria', 'Postgrado'];
  for (const e of escolaridades) {
    await prisma.escolaridad.upsert({ where: { nombre: e }, update: {}, create: { nombre: e } });
  }

  const estadosCiviles = ['Soltero', 'Casado', 'Unión Libre', 'Divorciado', 'Viudo'];
  for (const ec of estadosCiviles) {
    await prisma.estadoCivil.upsert({ where: { nombre: ec }, update: {}, create: { nombre: ec } });
  }

  const ocupaciones = ['Desempleado', 'Estudiante', 'Ama de Casa', 'Agricultor', 'Comerciante', 'Albañil', 'Maestro', 'Médico', 'Enfermera', 'Otro'];
  for (const o of ocupaciones) {
    await prisma.ocupacion.upsert({ where: { nombre: o }, update: {}, create: { nombre: o } });
  }
  console.log('  ✔ Catálogos base creados');

  // ── Roles ─────────────────────────────────────────────────────────────────
  const roles = [
    {
      nombre: 'ADMIN',
      descripcion: 'Administrador del sistema',
      permisos: { all: true },
    },
    {
      nombre: 'MEDICO',
      descripcion: 'Médico general o especialista',
      permisos: {
        pacientes: ['leer', 'crear', 'editar'],
        citas: ['leer', 'crear', 'editar', 'marcar-no-asistio'],
        historia_clinica: ['leer', 'crear'],
        formularios: ['leer', 'llenar'],
        recetas: ['crear', 'leer'],
        laboratorio: ['solicitar', 'leer'],
        radiologia: ['leer', 'solicitar'],
        especialidades: ['leer'],
        establecimientos: ['leer'],
        geo: ['leer'],
        catalogos: ['leer'],
        epidemiologia: ['leer', 'notificar'],
        vacunacion: ['leer'],
      },
    },
    {
      nombre: 'ENFERMERA',
      descripcion: 'Personal de enfermería',
      permisos: {
        pacientes: ['leer', 'crear'],
        citas: ['leer', 'editar'],
        historia_clinica: ['leer'],
        triaje: ['leer', 'crear'],
        especialidades: ['leer'],
        establecimientos: ['leer'],
        geo: ['leer'],
        catalogos: ['leer'],
      },
    },
    {
      nombre: 'FARMACEUTICO',
      descripcion: 'Farmacéutico',
      permisos: {
        pacientes: ['leer'],
        recetas: ['leer'],
        farmacia: ['leer', 'crear'],
        inventario: ['leer', 'crear', 'editar'],
        geo: ['leer'],
        catalogos: ['leer'],
      },
    },
    {
      nombre: 'RECEPCIONISTA',
      descripcion: 'Recepción y admisión',
      permisos: {
        pacientes: ['leer', 'crear', 'editar', 'eliminar'],
        citas: ['leer', 'crear', 'cancelar', 'marcar-no-asistio'],
        especialidades: ['leer'],
        establecimientos: ['leer'],
        geo: ['leer'],
        catalogos: ['leer'],
      },
    },
    {
      nombre: 'EPIDEMIOLOGO',
      descripcion: 'Vigilancia epidemiológica',
      permisos: {
        pacientes: ['leer'],
        diagnosticos: ['leer'],
        reportes: ['generar'],
        geo: ['leer'],
        catalogos: ['leer'],
        epidemiologia: ['leer', 'notificar', 'gestionar'],
      },
    },
    {
      nombre: 'ADMIN_ESTABLECIMIENTO',
      descripcion: 'Administrador local del establecimiento',
      permisos: {
        pacientes: ['leer', 'crear', 'editar', 'eliminar'],
        citas: ['leer', 'crear', 'editar', 'cancelar', 'marcar-no-asistio'],
        usuarios: ['gestionar'],
        inventario: ['leer', 'crear', 'editar', 'eliminar'],
        servicios: ['leer', 'gestionar'],
        reportes: ['generar'],
        especialidades: ['leer'],
        establecimientos: ['leer'],
        geo: ['leer'],
        catalogos: ['leer'],
      },
    },
    {
      nombre: 'PACIENTE',
      descripcion: 'Usuario con acceso a servicios personales de salud',
      permisos: {
        citas: ['leer', 'crear'],
        pacientes: ['leer'],
        notificaciones: ['leer'],
      },
    },
  ];

  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre: rol.nombre },
      update: { permisos: rol.permisos },
      create: rol,
    });
  }
  console.log(`  ✔ ${roles.length} roles creados`);

  // ── Catálogo de Servicios (CatServicio) ──────────────────────────────────
  console.log('  Sembrando catálogo de servicios...');
  const catalogoServicios = [
    { nombre: 'CONSULTA EXTERNA', descripcion: 'Atención médica ambulatoria general' },
    { nombre: 'EMERGENCIAS', descripcion: 'Atención de urgencias 24/7' },
    { nombre: 'FARMACIA', descripcion: 'Despacho de medicamentos' },
    { nombre: 'LABORATORIO', descripcion: 'Toma y análisis de muestras' },
    { nombre: 'RADIOLOGIA', descripcion: 'Estudios de imagen y rayos X' },
    { nombre: 'ODONTOLOGIA', descripcion: 'Salud dental' },
    { nombre: 'GINECOLOGIA', descripcion: 'Salud reproductiva y femenina' },
    { nombre: 'PEDIATRIA', descripcion: 'Atención infantil' },
    { nombre: 'PSICOLOGIA', descripcion: 'Salud mental' },
  ];

  for (const s of catalogoServicios) {
    await prisma.catServicio.upsert({
      where: { nombre: s.nombre },
      update: { descripcion: s.descripcion },
      create: { nombre: s.nombre, descripcion: s.descripcion }
    });
  }
  console.log(`  ✔ ${catalogoServicios.length} servicios en catálogo creados/verificados`);

  // ── Catálogo de Vacunas (PAI) ─────────────────────────────────────────────
  console.log('  Sembrando catálogo de vacunas...');
  const vacunas = [
    { nombre: 'BCG', descripcion: 'Vacuna contra la Tuberculosis (Formas graves)', tipo: 'BACTERIANA_ATENUADA', poblacionMeta: 'Recién nacidos' },
    { nombre: 'Hepatitis B (Recién Nacido)', descripcion: 'Previene la transmisión vertical de Hepatitis B', tipo: 'RECOMBINANTE', poblacionMeta: 'Recién nacidos (<24h)' },
    { nombre: 'Pentavalente (DPT+HB+Hib)', descripcion: 'Difteria, Tétanos, Tos Ferina, Hep B, Influenza tipo b', tipo: 'BACTERIANA_INACTIVADA', poblacionMeta: 'Lactantes' },
    { nombre: 'Polio (IPV/OPV)', descripcion: 'Vacuna contra la Poliomielitis', tipo: 'VIRAL_INACTIVADA', poblacionMeta: 'Lactantes' },
    { nombre: 'Rotavirus', descripcion: 'Previene diarreas graves por Rotavirus', tipo: 'VIRAL_ATENUADA', poblacionMeta: 'Lactantes' },
    { nombre: 'Neumococo Conjugada', descripcion: 'Previene Neumonía y Meningitis por Neumococo', tipo: 'BACTERIANA_INACTIVADA', poblacionMeta: 'Lactantes' },
    { nombre: 'SRP', descripcion: 'Sarampión, Rubeola y Parotiditis', tipo: 'VIRAL_ATENUADA', poblacionMeta: 'Infantil' },
    { nombre: 'DPT', descripcion: 'Difteria, Tétanos y Tos Ferina (Refuerzos)', tipo: 'BACTERIANA_INACTIVADA', poblacionMeta: 'Infantil' },
  ];

  for (const v of vacunas) {
    await prisma.catVacuna.upsert({
      where: { nombre: v.nombre },
      update: { ...v, tipo: v.tipo as any },
      create: { ...v, tipo: v.tipo as any, activo: true }
    });
  }
  console.log(`  ✔ ${vacunas.length} vacunas creadas`);

  // ── Establecimiento base ──────────────────────────────────────────────────
  const hospTegus = await prisma.establecimiento.upsert({
    where: { codigo: 'HNT-001' },
    update: { nombre: 'Hospital Nacional de Tegucigalpa', tipo: 'HOSPITAL_NACIONAL' },
    create: {
      codigo: 'HNT-001',
      nombre: 'Hospital Nacional de Tegucigalpa',
      tipo: 'HOSPITAL_NACIONAL',
      departamentoId: 8,
      municipioId: 801,
      telefono: '2222-0000',
      activo: true
    }
  });

  const csSanJuan = await prisma.establecimiento.upsert({
    where: { codigo: 'CS-SANJUAN' },
    update: { nombre: 'Centro de Salud San Juan', tipo: 'CENTRO_SALUD' },
    create: {
      codigo: 'CS-SANJUAN',
      nombre: 'Centro de Salud San Juan',
      tipo: 'CENTRO_SALUD',
      departamentoId: 8,
      municipioId: 801,
      telefono: '2233-1122',
      activo: true
    }
  });
  console.log(`  ✔ Establecimientos: ${hospTegus.nombre} y ${csSanJuan.nombre}`);

  // ── Especialidades ────────────────────────────────────────────────────────
  const especialidades = [
    { codigo: 'MG', nombre: 'Medicina General', descripcion: 'Consulta general' },
    { codigo: 'PED', nombre: 'Pediatría', descripcion: 'Atención pediátrica' },
    { codigo: 'GIN', nombre: 'Ginecología', descripcion: 'Salud de la mujer' },
    { codigo: 'CARD', nombre: 'Cardiología', descripcion: 'Enfermedades cardiovasculares' },
    { codigo: 'NEUR', nombre: 'Neurología', descripcion: 'Sistema nervioso' },
    { codigo: 'ORTS', nombre: 'Ortopedia', descripcion: 'Sistema musculoesquelético' },
    { codigo: 'DERM', nombre: 'Dermatología', descripcion: 'Enfermedades de la piel' },
    { codigo: 'OFT', nombre: 'Oftalmología', descripcion: 'Salud visual' },
    { codigo: 'PSIQ', nombre: 'Psiquiatría', descripcion: 'Salud mental' },
    { codigo: 'URG', nombre: 'Urgencias', descripcion: 'Atención de emergencias' },
    { codigo: 'ODON', nombre: 'Odontología', descripcion: 'Salud bucal y dental' },
  ];

  for (const esp of especialidades) {
    await prisma.especialidad.upsert({
      where: { codigo: esp.codigo },
      update: {},
      create: esp,
    });
  }
  console.log(`  ✔ ${especialidades.length} especialidades creadas`);

  // ── Reportes Disponibles ───────────────────────────────────────────────────
  const reportes = [
    // Médica
    {
      nombre: 'Productividad Médica',
      descripcion: 'Excel - Consultas y turnos',
      categoria: 'MEDICA',
      slug: 'productividad',
      tipo: 'EXCEL',
      permiso: 'reportes:productividad',
      icono: 'user',
      orden: 1
    },
    {
      nombre: 'Perfil Morbilidad',
      descripcion: 'PDF - CIE-10 Top 10',
      categoria: 'MEDICA',
      slug: 'morbilidad',
      tipo: 'PDF',
      permiso: 'reportes:morbilidad',
      icono: 'chart',
      orden: 2
    },
    // Administrativa
    {
      nombre: 'Estado de Agenda',
      descripcion: 'Excel - Atendidas vs Ausentes',
      categoria: 'ADMINISTRATIVA',
      slug: 'citas',
      tipo: 'EXCEL',
      permiso: 'reportes:citas',
      icono: 'calendar',
      orden: 1
    },
    {
      nombre: 'Demografía Pacientes',
      descripcion: 'Excel - Edad, Sexo, Procedencia',
      categoria: 'ADMINISTRATIVA',
      slug: 'demografia',
      tipo: 'EXCEL',
      permiso: 'reportes:demografia',
      icono: 'users',
      orden: 2
    },
    // Farmacia
    {
      nombre: 'Stock Crítico',
      descripcion: 'Excel - Medicamentos bajos',
      categoria: 'FARMACIA',
      slug: 'inventario',
      tipo: 'EXCEL',
      permiso: 'reportes:inventario',
      icono: 'beaker',
      orden: 1
    },
    {
      nombre: 'Movimientos Kardex',
      descripcion: 'Excel - Entradas y salidas',
      categoria: 'FARMACIA',
      slug: 'kardex',
      tipo: 'EXCEL',
      permiso: 'reportes:kardex',
      icono: 'clipboard',
      orden: 2
    },
    // Vacunación
    {
      nombre: 'Consolidado de Vacunación (PAI)',
      descripcion: 'Listado detallado de dosis aplicadas por periodo.',
      categoria: 'VACUNACION',
      slug: 'consolidado-pai',
      tipo: 'EXCEL',
      permiso: 'vacunacion:leer',
      icono: 'document-text',
      orden: 1
    },
    {
      nombre: 'Inventario de Biológicos',
      descripcion: 'Estado de existencias, lotes y vencimientos de vacunas.',
      categoria: 'VACUNACION',
      slug: 'inventario-vacunas',
      tipo: 'EXCEL',
      permiso: 'vacunacion:leer',
      icono: 'archive',
      orden: 2
    },
    {
      nombre: 'Análisis de Cobertura',
      descripcion: 'Reporte de población vacunada vs meta (PDF).',
      categoria: 'VACUNACION',
      slug: 'cobertura-vacunacion',
      tipo: 'PDF',
      permiso: 'vacunacion:leer',
      icono: 'chart-bar',
      orden: 3
    }
  ];

  for (const r of reportes) {
    await (prisma as any).reporteDisponible.upsert({
      where: { slug: r.slug },
      update: r,
      create: r,
    });
  }
  console.log('  ✔ Reportes disponibles creados');

  // ── Infraestructura Hospitalaria ──────────────────────────────────────────
  console.log('  Sembrando infraestructura hospitalaria...');

  const tiposHabitacion = [
    { nombre: 'Privada', descripcion: 'Habitación individual con baño privado' },
    { nombre: 'Semiprivada', descripcion: 'Habitación para dos personas' },
    { nombre: 'Sala Común', descripcion: 'Área compartida con múltiples camas' },
    { nombre: 'Aislamiento', descripcion: 'Habitación con control de infecciones' },
    { nombre: 'UCI', descripcion: 'Unidad de Cuidados Intensivos' },
  ];

  for (const th of tiposHabitacion) {
    await prisma.catTipoHabitacion.upsert({
      where: { nombre: th.nombre },
      update: { descripcion: th.descripcion },
      create: th
    });
  }

  const tiposCama = [
    { nombre: 'Cama Hospitalaria Estándar', descripcion: 'Cama manual o eléctrica básica' },
    { nombre: 'Camilla', descripcion: 'Unidad móvil para emergencias' },
    { nombre: 'Cuna', descripcion: 'Para pacientes pediátricos' },
    { nombre: 'Incubadora', descripcion: 'Para neonatos' },
    { nombre: 'Cama UCI', descripcion: 'Cama articulada con monitoreo avanzado' },
  ];

  for (const tc of tiposCama) {
    await prisma.catTipoCama.upsert({
      where: { nombre: tc.nombre },
      update: { descripcion: tc.descripcion },
      create: tc
    });
  }
  console.log('  ✔ Catálogos de infraestructura creados');

  // ── Usuario administrador ─────────────────────────────────────────────────
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre: 'ADMIN' } });
  const contrasenaHash = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.usuario.upsert({
    where: { correo: 'admin@sesal.hn' },
    update: {},
    create: {
      numeroEmpleado: 'EMP-0001',
      nombres: 'Administrador',
      apellidos: 'Sistema',
      correo: 'admin@sesal.hn',
      contrasenaHash,
      rolId: rolAdmin!.id,
      establecimientoId: hospTegus.id,
    },
  });
  console.log(`  ✔ Admin creado: ${admin.correo} / Admin@123`);

  // ── Usuarios operativos de prueba ──────────────────────────────────────────
  const rolEnfermera = await prisma.rol.findUnique({ where: { nombre: 'ENFERMERA' } });
  const rolRecepcion = await prisma.rol.findUnique({ where: { nombre: 'RECEPCIONISTA' } });
  const rolFarmacia = await prisma.rol.findUnique({ where: { nombre: 'FARMACEUTICO' } });
  const rolMedico = await prisma.rol.findUnique({ where: { nombre: 'MEDICO' } });

  const contrasenaComun = await bcrypt.hash('Siss@123', 10);
  const contrasenaMedico = await bcrypt.hash('Medico@123', 10);

  const espMG = await prisma.especialidad.findUnique({ where: { codigo: 'MG' } });
  const espGIN = await prisma.especialidad.findUnique({ where: { codigo: 'GIN' } });
  const espODON = await prisma.especialidad.findUnique({ where: { codigo: 'ODON' } });

  const medico = await prisma.usuario.upsert({
    where: { correo: 'medico@sesal.hn' },
    update: {},
    create: {
      numeroEmpleado: 'EMP-0002',
      nombres: 'Dr. Ricardo', apellidos: 'Soto',
      correo: 'medico@sesal.hn',
      contrasenaHash: contrasenaMedico,
      rolId: rolMedico!.id,
      establecimientoId: hospTegus.id,
      especialidadId: espMG!.id, // Primaria
      asignaciones: {
        create: [
          {
            establecimientoId: hospTegus.id,
            especialidadId: espMG!.id, // En el hospital es Médico General
            rolId: rolMedico!.id,
          },
          {
            establecimientoId: csSanJuan.id,
            especialidadId: espGIN!.id, // En el centro de salud es Ginecólogo
            rolId: rolMedico!.id,
          }
        ]
      }
    },
  });

  const medico2 = await prisma.usuario.upsert({
    where: { correo: 'medico2@sesal.hn' },
    update: {},
    create: {
      numeroEmpleado: 'EMP-0010',
      nombres: 'Dr. Mario', apellidos: 'Gomez',
      correo: 'medico2@sesal.hn',
      contrasenaHash: contrasenaMedico,
      rolId: rolMedico!.id,
      establecimientoId: hospTegus.id,
      especialidadId: espMG!.id,
      asignaciones: {
        create: [
          {
            establecimientoId: hospTegus.id,
            especialidadId: espMG!.id,
            rolId: rolMedico!.id,
          },
          {
            establecimientoId: csSanJuan.id,
            especialidadId: espMG!.id,
            rolId: rolMedico!.id,
          }
        ]
      }
    },
  });
  console.log(`  ✔ Médico 2 creado: ${medico2.correo} / Medico@123`);

  const enfermera = await prisma.usuario.upsert({
    where: { correo: 'enfermera@sesal.hn' },
    update: {},
    create: {
      numeroEmpleado: 'EMP-0003',
      nombres: 'Elena', apellidos: 'Garcia',
      correo: 'enfermera@sesal.hn',
      contrasenaHash: contrasenaComun,
      rolId: rolEnfermera!.id,
      establecimientoId: hospTegus.id,
    },
  });

  const recepcion = await prisma.usuario.upsert({
    where: { correo: 'recepcion@sesal.hn' },
    update: {},
    create: {
      numeroEmpleado: 'EMP-0004',
      nombres: 'Ana', apellidos: 'Martínez',
      correo: 'recepcion@sesal.hn',
      contrasenaHash: contrasenaComun,
      rolId: rolRecepcion!.id,
      establecimientoId: hospTegus.id,
    },
  });

  const farmacia = await prisma.usuario.upsert({
    where: { correo: 'farmaceutico@sesal.hn' },
    update: {},
    create: {
      numeroEmpleado: 'EMP-0005',
      nombres: 'Jorge', apellidos: 'Ramos',
      correo: 'farmaceutico@sesal.hn',
      contrasenaHash: contrasenaComun,
      rolId: rolFarmacia!.id,
      establecimientoId: hospTegus.id,
    },
  });
  const usuariosOperativos = [
    { u: enfermera, r: rolEnfermera },
    { u: recepcion, r: rolRecepcion },
    { u: farmacia, r: rolFarmacia }
  ];

  for (const op of usuariosOperativos) {
    if (op.u) {
      await prisma.usuario.update({
        where: { id: op.u.id },
        data: { establecimientoId: hospTegus.id }
      });
    }
  }

  console.log('  ✔ Usuarios operativos creados y vinculados a HNT-001');

  // ── Vincular Servicios a Establecimientos ─────────────────────────────────
  console.log('  Sincronizando servicios por establecimiento...');
  const serviciosCreadosHNT: Record<string, any> = {};
  const serviciosHNT = ['CONSULTA EXTERNA', 'EMERGENCIAS', 'FARMACIA', 'LABORATORIO', 'RADIOLOGIA', 'ODONTOLOGIA'];

  for (const nombre of serviciosHNT) {
    const cat = await prisma.catServicio.findFirst({ where: { nombre } });
    if (cat) {
      const existe = await prisma.servicio.findFirst({
        where: { establecimientoId: hospTegus.id, catServicioId: cat.id }
      });

      let s;
      if (existe) {
        s = await prisma.servicio.update({
          where: { id: existe.id },
          data: { activo: true }
        });
      } else {
        s = await prisma.servicio.create({
          data: { establecimientoId: hospTegus.id, catServicioId: cat.id, activo: true }
        });
      }
      serviciosCreadosHNT[nombre] = s;
    }
  }

  const serviciosCS = ['CONSULTA EXTERNA', 'FARMACIA', 'ODONTOLOGIA'];
  for (const nombre of serviciosCS) {
    const cat = await prisma.catServicio.findFirst({ where: { nombre } });
    if (cat) {
      const existe = await prisma.servicio.findFirst({
        where: { establecimientoId: csSanJuan.id, catServicioId: cat.id }
      });

      if (existe) {
        await prisma.servicio.update({
          where: { id: existe.id },
          data: { activo: true }
        });
      } else {
        await prisma.servicio.create({
          data: { establecimientoId: csSanJuan.id, catServicioId: cat.id, activo: true }
        });
      }
    }
  }

  // ── Asignaciones de Personal (Migración/Seed) ──────────────────────────────
  console.log('  Vinculando personal a establecimientos y servicios...');
  const usuariosParaAsignar = [
    { user: admin, rol: rolAdmin, serv: null },
    { user: medico, rol: rolMedico, serv: serviciosCreadosHNT['CONSULTA EXTERNA'] },
    { user: enfermera, rol: rolEnfermera, serv: null },
    { user: recepcion, rol: rolRecepcion, serv: null },
    { user: farmacia, rol: rolFarmacia, serv: null },
  ];

  for (const a of usuariosParaAsignar) {
    if (!a.user || !a.rol) continue;

    const esMedico = a.rol.nombre === 'MEDICO';
    const servicioId = esMedico ? (a.serv?.id ?? null) : null;

    // Para no médicos, limpiamos cualquier asignación previa con servicio en este establecimiento
    if (!esMedico) {
      await prisma.asignacionUsuario.deleteMany({
        where: {
          usuarioId: a.user.id,
          establecimientoId: hospTegus.id,
          servicioId: { not: null }
        }
      });
    }

    const existe = await prisma.asignacionUsuario.findFirst({
      where: {
        usuarioId: a.user.id,
        establecimientoId: hospTegus.id,
        servicioId: servicioId
      }
    });

    if (existe) {
      await prisma.asignacionUsuario.update({
        where: { id: existe.id },
        data: {
          rolId: a.rol.id,
          activo: true
        }
      });
    } else {
      await prisma.asignacionUsuario.create({
        data: {
          usuarioId: a.user.id,
          establecimientoId: hospTegus.id,
          servicioId: servicioId,
          rolId: a.rol.id,
          activo: true
        }
      });
    }
  }
  console.log('  ✔ Asignaciones de personal creadas');

  // ── Infraestructura de Hospitalización (HNT-001) ───────────────────────────
  console.log('  Limpiando e infraestructura de hospitalización...');
  await prisma.kardexMedicamento.deleteMany();
  await prisma.controlSignosVitales.deleteMany();
  await prisma.notaEvolucion.deleteMany();
  await prisma.movimientoHospitalario.deleteMany();
  await prisma.egresoHospitalario.deleteMany();
  await prisma.ingresoHospitalario.deleteMany();
  await prisma.cama.deleteMany();
  await prisma.habitacion.deleteMany();
  await prisma.sala.deleteMany();

  console.log('  Sembrando infraestructura de hospitalización...');
  const servEmergencias = serviciosCreadosHNT['EMERGENCIAS'];

  if (servEmergencias) {
    const salaMedInt = await prisma.sala.create({
      data: {
        nombre: 'Medicina Interna Varones',
        codigo: 'MIV-01',
        servicioId: servEmergencias.id,
      }
    });

    const tipoHabNormal = await prisma.catTipoHabitacion.findFirst({ where: { nombre: 'Sala Común' } });
    const tipoCamaEst = await prisma.catTipoCama.findFirst({ where: { nombre: 'Cama Hospitalaria Estándar' } });

    const habitacion1 = await prisma.habitacion.create({
      data: {
        numero: '101',
        salaId: salaMedInt.id,
        tipoHabitacionId: tipoHabNormal!.id,
      }
    });

    // Crear 5 camas
    for (let i = 1; i <= 5; i++) {
      await prisma.cama.create({
        data: {
          codigo: `CAMA-10${i}`,
          habitacionId: habitacion1.id,
          tipoCamaId: tipoCamaEst!.id,
          estado: 'DISPONIBLE'
        }
      });
    }
  }
  console.log('  ✔ Salas, piezas y camas creadas');

  // ── Pacientes reales ──────────────────────────────────────────────────────
  console.log('  Sembrando pacientes iniciales...');
  const pacientesBase = [
    {
      numeroExpediente: '1-2026-000001', dni: '0501199012345',
      nombres: 'JUAN ALBERTO', apellidos: 'PEREZ RODRIGUEZ',
      fechaNacimiento: new Date('1990-05-15'), sexoId: 1, tipoSangreId: 1,
      direccion: 'por alli', departamentoId: 8, municipioId: 801,
      escolaridadId: 3, ocupacionId: 5, estadoCivilId: 4, establecimientoId: hospTegus.id, creadoPorId: medico.id,
    },
    {
      numeroExpediente: '1-2026-000002', dni: '0801198567890',
      nombres: 'MARIA ELENA', apellidos: 'GARCIA LOPEZ',
      fechaNacimiento: new Date('1985-11-20'), sexoId: 2, tipoSangreId: 5,
      departamentoId: 8, municipioId: 801,
      escolaridadId: 3, ocupacionId: 9, estadoCivilId: 2, establecimientoId: hospTegus.id, creadoPorId: medico.id,
    },
    {
      numeroExpediente: '1-2026-000003', dni: '1601200011223',
      nombres: 'CARLOS ROBERTO', apellidos: 'MENDOZA ZELAYA',
      fechaNacimiento: new Date('2000-01-10'), sexoId: 1, tipoSangreId: 5,
      departamentoId: 8, municipioId: 801,
      escolaridadId: 3, ocupacionId: 2, estadoCivilId: 1, establecimientoId: hospTegus.id, creadoPorId: medico.id,
    },
    {
      numeroExpediente: '1-2026-000004', dni: '0801197106887',
      nombres: 'EDGAR ERNESTO', apellidos: 'BARAHONA FLORES',
      fechaNacimiento: new Date('1971-12-03'), sexoId: 1, tipoSangreId: 5,
      direccion: 'Residencial Villas de Oriente', departamentoId: 8, municipioId: 801,
      escolaridadId: 4, ocupacionId: 10, estadoCivilId: 2, establecimientoId: hospTegus.id, creadoPorId: medico.id,
    }
  ];

  for (const p of pacientesBase) {
    await prisma.paciente.upsert({
      where: { dni: p.dni },
      update: {},
      create: p,
    });
  }
  const pEdgar = await prisma.paciente.findUnique({ where: { dni: '0801197106887' } });
  console.log(`  ✔ ${pacientesBase.length} pacientes base sembrados`);

  // ── Cita y Triaje (Edgar) ─────────────────────────────────────────────────
  const citaEdgar = await prisma.cita.create({
    data: {
      pacienteId: pEdgar!.id,
      medicoId: medico.id,
      establecimientoId: hospTegus.id,
      fechaHora: new Date('2026-04-20T18:49:00Z'),
      tipo: 'CONSULTA_GENERAL',
      estado: 'EN_SALA',
      creadoPorId: recepcion.id,
      triaje: {
        create: {
          pacienteId: pEdgar!.id,
          enfermeraId: enfermera.id,
          motivoConsulta: 'Revision',
          presionSistolica: 120,
          presionDiastolica: 80,
          frecuenciaCardiaca: 98,
          frecuenciaRespiratoria: 25,
          temperatura: 37,
          saturacionO2: 15,
          peso: 110,
          talla: 181,
          escalaDolor: 0,
          nivelConciencia: 'ALERTA',
          categoria: 'AMARILLO',
        }
      }
    }
  });
  console.log('  ✔ Cita y Triaje de prueba creados para Edgar Barahona');

  // ── Ingreso Hospitalario de Prueba (Edgar) ────────────────────────────────
  const cama101 = await prisma.cama.findUnique({ where: { codigo: 'CAMA-101' } });
  if (cama101 && pEdgar) {
    await prisma.ingresoHospitalario.create({
      data: {
        pacienteId: pEdgar.id,
        camaId: cama101.id,
        servicioId: servEmergencias!.id,
        medicoIngresoId: medico.id,
        motivoIngreso: 'Dificultad respiratoria y fiebre',
        diagnosticoIngreso: 'Neumonía adquirida en la comunidad',
        estado: 'ACTIVO',
        fechaIngreso: new Date(),
        creadoPorId: recepcion.id
      }
    });
    // Marcar cama como ocupada
    await prisma.cama.update({
      where: { id: cama101.id },
      data: { estado: 'OCUPADA' }
    });
    console.log('  ✔ Ingreso hospitalario de prueba creado para Edgar');
  }

  // ── Catalogo Laboratorio (Asignación) ─────────────────────────────────────
  console.log('  Asignando exámenes de laboratorio...');
  const laboratoriosCatalogo = [
    { codigo: 'HEM-01', nombre: 'Hemograma Completo', categoria: 'Hematología', indicaciones: 'Ayuno de 8 horas' },
    { codigo: 'GLU-01', nombre: 'Glucosa en Ayunas', categoria: 'Química Clínica', indicaciones: 'Ayuno de 8 a 12 horas' },
    { codigo: 'CRE-01', nombre: 'Creatinina', categoria: 'Química Clínica', indicaciones: 'Ayuno opcional' },
    { codigo: 'COL-01', nombre: 'Colesterol Total', categoria: 'Perfil Lipídico', indicaciones: 'Ayuno de 12 horas' },
    { codigo: 'TRI-01', nombre: 'Triglicéridos', categoria: 'Perfil Lipídico', indicaciones: 'Ayuno de 12 horas' },
    { codigo: 'HDL-01', nombre: 'Colesterol HDL', categoria: 'Perfil Lipídico', indicaciones: 'Ayuno de 12 horas' },
    { codigo: 'LDL-01', nombre: 'Colesterol LDL', categoria: 'Perfil Lipídico', indicaciones: 'Ayuno de 12 horas' },
    { codigo: 'URA-01', nombre: 'Ácido Úrico', categoria: 'Química Clínica', indicaciones: 'Ayuno de 8 horas' },
    { codigo: 'EXO-01', nombre: 'Examen General de Orina', categoria: 'Uroanálisis', indicaciones: 'Primera orina de la mañana preferiblemente' },
    { codigo: 'EXH-01', nombre: 'Examen de Heces', categoria: 'Coprología', indicaciones: 'Muestra reciente en frasco estéril' },
    { codigo: 'VDRL-01', nombre: 'VDRL / RPR', categoria: 'Serología', indicaciones: 'Ayuno opcional' },
    { codigo: 'VIH-01', nombre: 'VIH 1/2 (Anticuerpos)', categoria: 'Inmunología', indicaciones: 'Consentimiento informado' },
    { codigo: 'PSA-01', nombre: 'Antígeno Prostático (PSA)', categoria: 'Marcadores Tumorales', indicaciones: 'No eyacular 48h antes, sin ejercicio intenso' },
    { codigo: 'T3-01', nombre: 'T3 Total', categoria: 'Endocrinología', indicaciones: 'Ayuno de 8 horas' },
    { codigo: 'T4L-01', nombre: 'T4 Libre', categoria: 'Endocrinología', indicaciones: 'Ayuno de 8 horas' },
    { codigo: 'TSH-01', nombre: 'TSH', categoria: 'Endocrinología', indicaciones: 'Ayuno de 8 horas' },
    { codigo: 'PRL-01', nombre: 'Prolactina', categoria: 'Endocrinología', indicaciones: 'Reposo de 30 min antes de la toma' },
    { codigo: 'HBA1C', nombre: 'Hemoglobina Glicosilada', categoria: 'Química Clínica', indicaciones: 'Ayuno opcional' },
    { codigo: 'PCR-01', nombre: 'Proteína C Reactiva', categoria: 'Serología', indicaciones: 'Ayuno opcional' },
    { codigo: 'TP-01', nombre: 'Tiempo de Protrombina (TP)', categoria: 'Coagulación', indicaciones: 'Informar si toma anticoagulantes' },
    { codigo: 'TPT-01', nombre: 'Tiempo de Tromboplastina (TPT)', categoria: 'Coagulación', indicaciones: 'Informar si toma anticoagulantes' }
  ];

  for (const lab of laboratoriosCatalogo) {
    const l = await prisma.catExamenLaboratorio.upsert({
      where: { codigo: lab.codigo },
      update: lab,
      create: lab
    });
    await prisma.examenEstablecimiento.upsert({
      where: { establecimientoId_examenId: { establecimientoId: hospTegus.id, examenId: l.id } },
      update: {},
      create: { establecimientoId: hospTegus.id, examenId: l.id }
    });
  }

  // ── Radiología (Asignación selectiva) ─────────────────────────────────────
  console.log('  Asignando estudios de radiología...');
  const radiologiaCatalogo = [
    { codigo: 'RX-T01', nombre: 'RX Tórax PA/Lateral', categoria: 'Radiografía', indicaciones: 'Técnica: Inspiración profunda.' },
    { codigo: 'RX-A01', nombre: 'RX Abdomen de Pie', categoria: 'Radiografía', indicaciones: 'Técnica: Proyección AP.' },
    { codigo: 'RX-C01', nombre: 'RX Columna Cervical', categoria: 'Radiografía', indicaciones: 'Técnica: AP, Lateral.' },
    { codigo: 'RX-L01', nombre: 'RX Columna Lumbar', categoria: 'Radiografía', indicaciones: 'Quitar fajas.' },
    { codigo: 'RX-CR0', nombre: 'RX Cráneo AP/Lateral', categoria: 'Radiografía', indicaciones: 'Retirar prótesis.' },
    { codigo: 'RX-M01', nombre: 'RX Mano (Edad Ósea)', categoria: 'Radiografía', indicaciones: 'Mano no dominante.' },
    { codigo: 'USG-A01', nombre: 'USG Abdomen Superior', categoria: 'Ultrasonido', indicaciones: 'Ayuno 8h.' },
    { codigo: 'USG-P01', nombre: 'USG Pélvico', categoria: 'Ultrasonido', indicaciones: 'Vejiga llena.' },
    { codigo: 'USG-V01', nombre: 'USG Pélvico Transvaginal', categoria: 'Ultrasonido', indicaciones: 'Vejiga vacía.' },
    { codigo: 'USG-R01', nombre: 'USG Renal', categoria: 'Ultrasonido', indicaciones: 'Vejiga llena.' },
    { codigo: 'USG-O01', nombre: 'USG Obstétrico 1er Trimestre', categoria: 'Ultrasonido', indicaciones: 'Valorar vitalidad.' },
    { codigo: 'USG-O02', nombre: 'USG Obstétrico 2do/3er Trimestre', categoria: 'Ultrasonido', indicaciones: 'Morfología fetal.' },
    { codigo: 'USG-C01', nombre: 'USG Cuello/Tiroides', categoria: 'Ultrasonido', indicaciones: 'Sin preparación.' },
    { codigo: 'USG-D01', nombre: 'USG Doppler Carotídeo', categoria: 'Ultrasonido', indicaciones: 'Valoración de flujos.' },
    { codigo: 'TAC-C01', nombre: 'TAC Cerebral Simple', categoria: 'Tomografía', indicaciones: 'Sin aretes.' },
    { codigo: 'TAC-C02', nombre: 'TAC Cerebral Contrastado', categoria: 'Tomografía', indicaciones: 'Ayuno 8h. Creatinina.' },
    { codigo: 'TAC-T01', nombre: 'TAC Tórax Alta Resolución', categoria: 'Tomografía', indicaciones: 'Apnea.' },
    { codigo: 'TAC-A01', nombre: 'TAC Abdomen y Pelvis', categoria: 'Tomografía', indicaciones: 'Ayuno 8h. Creatinina.' },
    { codigo: 'RM-C01', nombre: 'RM Cerebral', categoria: 'Resonancia', indicaciones: 'Cuestionario implantes.' },
    { codigo: 'RM-R01', nombre: 'RM Rodilla', categoria: 'Resonancia', indicaciones: 'Sin materiales ferrosos.' }
  ];

  for (const rad of radiologiaCatalogo) {
    const r = await prisma.catExamenRadiologico.upsert({
      where: { codigo: rad.codigo },
      update: rad,
      create: rad
    });

    // Asignar todos los estudios al establecimiento para facilitar pruebas en desarrollo
    await prisma.estudioRadiologicoEstablecimiento.upsert({
      where: { establecimientoId_estudioId: { establecimientoId: hospTegus.id, estudioId: r.id } },
      update: {},
      create: { establecimientoId: hospTegus.id, estudioId: r.id }
    });
  }

  // ── Catálogo de Formularios Clínicos ──────────────────────────────────────
  console.log('  Sembrando formularios clínicos base...');

  if (espMG) {
    const plantilla = await prisma.plantillaFormulario.upsert({
      where: { especialidadId_version: { especialidadId: espMG.id, version: 1 } },
      update: {
        nombre: 'Consulta General (SOAP)',
        descripcion: 'Formulario estándar para consulta médica general',
        activa: true,
      },
      create: {
        especialidadId: espMG.id,
        version: 1,
        nombre: 'Consulta General (SOAP)',
        descripcion: 'Formulario estándar para consulta médica general',
        activa: true,
        creadoPorId: admin.id,
      }
    });

    // Secciones y Campos especializados (que no están en la tabla base)
    const secciones = [
      {
        nombre: '1. REVISIÓN POR SISTEMAS (MARCAR HALLAZGOS PATOLÓGICOS)',
        orden: 1,
        campos: [
          { clave: 'rev_piel', tipo: 'BOOLEANO', etiqueta: 'Piel y Faneras (Alterado)', requerido: false, orden: 1 },
          { clave: 'rev_cardio', tipo: 'BOOLEANO', etiqueta: 'Cardiopulmonar (Alterado)', requerido: false, orden: 2 },
          { clave: 'rev_gastro', tipo: 'BOOLEANO', etiqueta: 'Gastrointestinal (Alterado)', requerido: false, orden: 3 },
          { clave: 'rev_urinario', tipo: 'BOOLEANO', etiqueta: 'Genitourinario (Alterado)', requerido: false, orden: 4 },
          { clave: 'rev_nervioso', tipo: 'BOOLEANO', etiqueta: 'Neurológico/Psiquiátrico (Alterado)', requerido: false, orden: 5 },
          { clave: 'rev_musculo', tipo: 'BOOLEANO', etiqueta: 'Músculo Esquelético (Alterado)', requerido: false, orden: 6 },
        ]
      },
      {
        nombre: '2. FACTORES DE RIESGO Y ESTILO DE VIDA',
        orden: 2,
        campos: [
          { clave: 'hab_tabaco', tipo: 'BOOLEANO', etiqueta: 'Tabaquismo Activo', requerido: false, orden: 1 },
          { clave: 'hab_alcohol', tipo: 'BOOLEANO', etiqueta: 'Consumo de Alcohol', requerido: false, orden: 2 },
          { clave: 'hab_sedentario', tipo: 'BOOLEANO', etiqueta: 'Sedentarismo', requerido: false, orden: 3 },
          { clave: 'hab_drogas', tipo: 'BOOLEANO', etiqueta: 'Uso de Sustancias', requerido: false, orden: 4 },
        ]
      },
      {
        nombre: '3. ANTECEDENTES PATOLÓGICOS (FAMILIARES/PERSONALES)',
        orden: 3,
        campos: [
          { clave: 'fam_diabetes', tipo: 'BOOLEANO', etiqueta: 'Diabetes Mellitus', requerido: false, orden: 1 },
          { clave: 'fam_hta', tipo: 'BOOLEANO', etiqueta: 'Hipertensión Arterial', requerido: false, orden: 2 },
          { clave: 'fam_obesidad', tipo: 'BOOLEANO', etiqueta: 'Obesidad / Dislipidemia', requerido: false, orden: 3 },
          { clave: 'fam_cancer', tipo: 'BOOLEANO', etiqueta: 'Antecedentes de Cáncer', requerido: false, orden: 4 },
          { clave: 'fam_asma', tipo: 'BOOLEANO', etiqueta: 'Asma / Alergias Respiratorias', requerido: false, orden: 5 },
        ]
      }
    ];

    // Limpiar secciones anteriores para evitar duplicidad si el seed se corre varias veces
    await prisma.seccionFormulario.deleteMany({ where: { plantillaId: plantilla.id } });

    for (const s of secciones) {
      await prisma.seccionFormulario.create({
        data: {
          plantillaId: plantilla.id,
          nombre: s.nombre,
          orden: s.orden,
          campos: {
            create: s.campos.map(c => ({
              clave: c.clave,
              tipo: c.tipo as any,
              etiqueta: c.etiqueta,
              requerido: c.requerido,
              orden: c.orden,
              configuracion: (c as any).configuracion || undefined
            }))
          }
        }
      });
    }
  }

  // ── Plantilla de Odontología ──────────────────────────────────────────────
  if (espODON) {
    const plantillaOdon = await prisma.plantillaFormulario.upsert({
      where: { especialidadId_version: { especialidadId: espODON.id, version: 1 } },
      update: {
        nombre: 'Anamnesis Odontológica y Examen Clínico',
        descripcion: 'Formulario especializado para atención dental y seguimiento de odontograma',
        activa: true,
      },
      create: {
        especialidadId: espODON.id,
        version: 1,
        nombre: 'Anamnesis Odontológica y Examen Clínico',
        descripcion: 'Formulario especializado para atención dental y seguimiento de odontograma',
        activa: true,
        creadoPorId: admin.id,
      }
    });

    const seccionesOdon = [
      {
        nombre: '1. ANTECEDENTES MÉDICOS (SISTÉMICOS)',
        orden: 1,
        campos: [
          { clave: 'med_diabetes', tipo: 'BOOLEANO', etiqueta: 'Diabetes', requerido: false, orden: 1 },
          { clave: 'med_hta', tipo: 'BOOLEANO', etiqueta: 'Hipertensión Arterial', requerido: false, orden: 2 },
          { clave: 'med_cardio', tipo: 'BOOLEANO', etiqueta: 'Problemas Cardíacos', requerido: false, orden: 3 },
          { clave: 'med_embarazo', tipo: 'BOOLEANO', etiqueta: 'Embarazo', requerido: false, orden: 4 },
          { clave: 'med_alergia_anes', tipo: 'BOOLEANO', etiqueta: 'Alergia a Anestésicos Locales', requerido: false, orden: 5 },
          { clave: 'med_alergia_peni', tipo: 'BOOLEANO', etiqueta: 'Alergia a Penicilina', requerido: false, orden: 6 },
          { clave: 'med_actuales', tipo: 'TEXTAREA', etiqueta: 'Medicamentos Actuales y Dosis', requerido: false, orden: 7 },
        ]
      },
      {
        nombre: '2. ANTECEDENTES Y HÁBITOS ODONTOLÓGICOS',
        orden: 2,
        campos: [
          { clave: 'odon_hab_higiene', tipo: 'TEXTO', etiqueta: 'Frecuencia de Cepillado', requerido: false, orden: 1 },
          { clave: 'odon_hab_tabaco', tipo: 'BOOLEANO', etiqueta: 'Hábito de Tabaquismo', requerido: false, orden: 2 },
          { clave: 'odon_hab_alcohol', tipo: 'BOOLEANO', etiqueta: 'Consumo de Alcohol', requerido: false, orden: 3 },
          { clave: 'odon_hab_bruxismo', tipo: 'BOOLEANO', etiqueta: 'Bruxismo', requerido: false, orden: 4 },
          { clave: 'odon_previo', tipo: 'TEXTAREA', etiqueta: 'Experiencias Dentales Previas', requerido: false, orden: 5 },
        ]
      },
      {
        nombre: '3. EXAMEN CLÍNICO Y ODONTOGRAMA',
        orden: 3,
        campos: [
          { clave: 'blandos_encias', tipo: 'TEXTO', etiqueta: 'Estado de Encías', requerido: false, orden: 1 },
          { clave: 'blandos_lengua', tipo: 'TEXTO', etiqueta: 'Estado de Lengua', requerido: false, orden: 2 },
          { clave: 'blandos_paladar', tipo: 'TEXTO', etiqueta: 'Paladar y Mucosas', requerido: false, orden: 3 },
          { clave: 'odontograma_map', tipo: 'ODONTOGRAMA', etiqueta: 'Mapa Dental (Odontograma)', requerido: false, orden: 4 },
        ]
      }
    ];

    await prisma.seccionFormulario.deleteMany({ where: { plantillaId: plantillaOdon.id } });

    for (const s of seccionesOdon) {
      await prisma.seccionFormulario.create({
        data: {
          plantillaId: plantillaOdon.id,
          nombre: s.nombre,
          orden: s.orden,
          campos: {
            create: s.campos.map(c => ({
              clave: c.clave,
              tipo: c.tipo as any,
              etiqueta: c.etiqueta,
              requerido: c.requerido,
              orden: c.orden
            }))
          }
        }
      });
    }
  }




  // ── Parámetros del Sistema ────────────────────────────────────────────────
  console.log('  Sembrando parámetros del sistema...');
  await prisma.parametroSistema.upsert({
    where: { clave: 'DIAS_VIGENCIA_RECETA' },
    update: { valor: '30' },
    create: {
      clave: 'DIAS_VIGENCIA_RECETA',
      valor: '30',
      descripcion: 'Días de vigencia de una receta para dispensación parcial o total antes de marcar como demanda insatisfecha'
    }
  });

  await prisma.parametroSistema.upsert({
    where: { clave: 'MARGEN_DIAS_TRASLAPE_RECETA' },
    update: { valor: '2' },
    create: {
      clave: 'MARGEN_DIAS_TRASLAPE_RECETA',
      valor: '2',
      descripcion: 'Días de margen antes de finalizar un tratamiento para permitir una nueva prescripción sin alertas de duplicidad'
    }
  });

  await prisma.parametroSistema.upsert({
    where: { clave: 'MINUTOS_ENTRE_CONSULTAS' },
    update: { valor: '10' },
    create: {
      clave: 'MINUTOS_ENTRE_CONSULTAS',
      valor: '10',
      descripcion: 'Minutos que debe haber entre cada consulta para evitar traslapes en la agenda'
    }
  });

  await prisma.parametroSistema.upsert({
    where: { clave: 'MARGEN_LOGIN_MINUTOS' },
    update: { valor: '800' },
    create: {
      clave: 'MARGEN_LOGIN_MINUTOS',
      valor: '800',
      descripcion: 'Margen de cortesía en minutos para el inicio de sesión de médicos fuera de su jornada'
    }
  });

  await prisma.parametroSistema.upsert({
    where: { clave: 'MINUTOS_INACTIVIDAD_SESION' },
    update: { valor: '30' },
    create: {
      clave: 'MINUTOS_INACTIVIDAD_SESION',
      valor: '30',
      descripcion: 'Tiempo de inactividad permitido (en minutos) antes de cerrar la sesión automáticamente'
    }
  });

  console.log('\n✅ Seed actualizado y completado exitosamente.\n');
  console.log('Credenciales operativas:');
  console.log('  Admin:       admin@sesal.hn      / Admin@123');
  console.log('  Médico:      medico@sesal.hn     / Medico@123');
  console.log('  Enfermera:   enfermera@sesal.hn  / Siss@123');
  console.log('  Recepción:   recepcion@sesal.hn  / Siss@123');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
