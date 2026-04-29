# Diccionario de Datos (Prisma Schema)

Este documento detalla las entidades y campos definidos en la base de datos del SISS.

## Modelo: Rol
**Descripción:** Representa los roles de usuario en el sistema para control de acceso basado en roles (RBAC)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico autoincremental del rol |
| nombre | String | Nombre Ãºnico del rol (ej: ADMIN, MEDICO, ENFERMERA) |
| descripcion | String? | DescripciÃ³n detallada de las funciones del rol |
| permisos | Json | Objeto JSON que define los permisos especÃ­ficos del rol por mÃ³dulo |
| usuarios | Usuario[] | RelaciÃ³n con los usuarios que tienen asignado este rol directamente |
| asignaciones | AsignacionUsuario[] | RelaciÃ³n con las asignaciones especÃ­ficas por establecimiento |

## Modelo: Usuario
**Descripción:** Representa a los usuarios del sistema (personal mÃ©dico, administrativo y de enfermerÃ­a)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico autoincremental del usuario |
| numeroEmpleado | String | NÃºmero de empleado institucional |
| nombres | String | Nombres del usuario |
| apellidos | String | Apellidos del usuario |
| correo | String | Correo electrÃ³nico institucional (usado para login) |
| contrasenaHash | String | Hash de la contraseÃ±a del usuario (Bcrypt) |
| telefono | String? | NÃºmero de telÃ©fono de contacto |
| especialidadId | Int? | ID de la especialidad primaria del usuario (si aplica) |
| numeroColegiado | String? | NÃºmero de colegiaciÃ³n profesional (obligatorio para mÃ©dicos) |
| activo | Boolean | Indica si el usuario estÃ¡ activo en el sistema |
| requiereCambioContrasena | Boolean | Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión |
| ultimoAcceso | DateTime? | Fecha y hora del Ãºltimo acceso exitoso |
| rolId | Int? | ID del rol principal asignado |
| establecimientoId | Int? | ID del establecimiento base donde labora |
| rol | Rol? | RelaciÃ³n con el modelo de Rol |
| establecimiento | Establecimiento? | RelaciÃ³n con el establecimiento base |
| especialidad | Especialidad? | RelaciÃ³n con la especialidad profesional |
| asignaciones | AsignacionUsuario[] | Historial de asignaciones a diferentes establecimientos y servicios |
| sesiones | Sesion[] | Sesiones activas e histÃ³ricas del usuario |
| citasMedico | Cita[] | Citas mÃ©dicas donde el usuario actÃºa como mÃ©dico tratante |
| historiales | HistoriaClinica[] | Historias clÃ­nicas creadas por este usuario |
| auditLogs | AuditLog[] | Registros de auditorÃ­a generados por acciones de este usuario |
| plantillasCreadas | PlantillaFormulario[] | Plantillas de formularios clÃ­nicos creadas por el usuario |
| triajes | Triaje[] | Triajes realizados por el usuario (en rol de enfermerÃ­a) |
| medicamentosCreados | Medicamento[] | Medicamentos registrados por este usuario |
| medicamentosActualizados | Medicamento[] | Medicamentos actualizados por este usuario |
| medicamentosEliminados | Medicamento[] | Medicamentos eliminados lÃ³gicamente por este usuario |
| pacientesEliminados | Paciente[] | Pacientes eliminados lÃ³gicamente por este usuario |
| citasCreadas | Cita[] | Citas registradas por este usuario |
| citasCanceladas | Cita[] | Citas canceladas por este usuario |
| historiasActualizadas | HistoriaClinica[] | Historias clÃ­nicas actualizadas por este usuario |
| historiasEliminadas | HistoriaClinica[] | Historias clÃ­nicas eliminadas por este usuario |
| establecimientosCreados | Establecimiento[] | Establecimientos registrados por este usuario |
| establecimientosActualizados | Establecimiento[] | Establecimientos actualizados por este usuario |
| establecimientosEliminados | Establecimiento[] | Establecimientos eliminados por este usuario |
| notificacionesGestionadas | NotificacionEpidemiologica[] | Notificaciones epidemiolÃ³gicas gestionadas por este usuario |
| especialidadesCreadas | Especialidad[] | Especialidades registradas por este usuario |
| especialidadesActualizadas | Especialidad[] | Especialidades actualizadas por este usuario |
| inventariosCreados | Inventario[] | Inventarios registrados por este usuario |
| inventariosActualizados | Inventario[] | Inventarios actualizados por este usuario |
| inventariosEliminados | Inventario[] | Inventarios eliminados por este usuario |
| dispensaciones | Dispensacion[] | Dispensaciones de medicamentos realizadas por este usuario |
| agendasBase | AgendaBase[] | Configuraciones de agenda base para este mÃ©dico |
| excepcionesAgenda | ExcepcionAgenda[] | Excepciones a la agenda (vacaciones, permisos) de este mÃ©dico |
| vacunasAplicadas | VacunacionRegistro[] | Registros de vacunas aplicadas por este usuario |
| movimientosVacunas | MovimientoVacuna[] | Movimientos de inventario de vacunas realizados por este usuario |
| notificacionesCreadas | NotificacionEpidemiologica[] | Notificaciones epidemiolÃ³gicas creadas por este usuario |
| ingresosAutorizados | IngresoHospitalario[] | Ingresos hospitalarios autorizados por este mÃ©dico |
| egresosFirmados | EgresoHospitalario[] | Egresos hospitalarios firmados por este médico |
| notasEvolucion | NotaEvolucion[] | Notas de evolución realizadas por el médico |
| kardexMedicamentos | KardexMedicamento[] |  |
| controlSignosVitales | ControlSignosVitales[] |  |
| movimientosInventario | MovimientoInventario[] | Movimientos de inventario realizados por este usuario |

## Modelo: Sesion
**Descripción:** Representa las sesiones de autenticaciÃ³n activas mediante Refresh Tokens

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico de la sesiÃ³n |
| usuarioId | Int | ID del usuario dueÃ±o de la sesiÃ³n |
| refreshTokenHash | String | Hash del Refresh Token almacenado para validaciÃ³n de seguridad |
| expiresAt | DateTime | Fecha de expiraciÃ³n del token |
| ip | String? | DirecciÃ³n IP desde la cual se iniciÃ³ la sesiÃ³n |
| userAgent | String? | User Agent del navegador/dispositivo que iniciÃ³ la sesiÃ³n |
| creadaEn | DateTime | Fecha y hora de creaciÃ³n de la sesiÃ³n |
| usuario | Usuario | RelaciÃ³n con el usuario |

## Modelo: Establecimiento
**Descripción:** Representa los centros de salud, hospitales y clÃ­nicas de la red de servicios

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico autoincremental |
| codigo | String | CÃ³digo institucional Ãºnico (ej: HNT-001) |
| nombre | String | Nombre completo del establecimiento |
| tipo | TipoEstablecimiento | Nivel o tipo de establecimiento (Hospital, Centro de Salud, etc.) |
| departamentoId | Int | ID del departamento geogrÃ¡fico donde se ubica |
| municipioId | Int | ID del municipio donde se ubica |
| telefono | String? | TelÃ©fono de contacto institucional |
| activo | Boolean | Indica si el establecimiento estÃ¡ operativo |
| creadoEn | DateTime | Fecha de registro en el sistema |
| actualizadoEn | DateTime? | Fecha de Ãºltima actualizaciÃ³n de datos |
| eliminadoEn | DateTime? | Fecha de eliminaciÃ³n lÃ³gica (si aplica) |
| creadoPorId | Int? | ID del usuario que registrÃ³ el establecimiento |
| actualizadoPorId | Int? | ID del usuario que realizÃ³ la Ãºltima actualizaciÃ³n |
| eliminadoPorId | Int? | ID del usuario que realizÃ³ la eliminaciÃ³n lÃ³gica |
| departamento | Departamento | RelaciÃ³n con el departamento |
| municipio | Municipio | RelaciÃ³n con el municipio |
| creadoPor | Usuario? | RelaciÃ³n con el usuario creador |
| actualizadoPor | Usuario? | RelaciÃ³n con el usuario actualizador |
| eliminadoPor | Usuario? | RelaciÃ³n con el usuario eliminador |
| usuarios | Usuario[] | Usuarios asociados a este establecimiento |
| pacientes | Paciente[] | Pacientes registrados en este establecimiento |
| citas | Cita[] | Citas programadas en este establecimiento |
| inventarios | Inventario[] | Inventarios de farmacia de este establecimiento |
| laboratorios | ExamenEstablecimiento[] | ExÃ¡menes de laboratorio disponibles en este establecimiento |
| radiologia | EstudioRadiologicoEstablecimiento[] | Estudios de radiologÃ­a disponibles en este establecimiento |
| solicitudesLab | SolicitudLaboratorio[] | Solicitudes de laboratorio realizadas desde/hacia este establecimiento |
| solicitudesRad | SolicitudRadiologia[] | Solicitudes de radiologÃ­a realizadas desde/hacia este establecimiento |
| servicios | Servicio[] | Servicios (unidades funcionales) habilitados en este establecimiento |
| referidosOrigen | Referido[] | Referencias emitidas por este establecimiento |
| referidosDestino | Referido[] | Referencias recibidas por este establecimiento |
| asignaciones | AsignacionUsuario[] | Personal asignado a este establecimiento |
| recetas | Receta[] | Recetas emitidas en este establecimiento |
| dispensaciones | Dispensacion[] | Dispensaciones realizadas en la farmacia de este establecimiento |
| agendasBase | AgendaBase[] | Configuraciones de agenda base en este establecimiento |
| excepcionesAgenda | ExcepcionAgenda[] | Excepciones temporales a la agenda en este establecimiento |
| lotesVacunas | LoteVacuna[] | Lotes de vacunas almacenados en este establecimiento |
| registrosVacunas | VacunacionRegistro[] | Registros de vacunaciÃ³n aplicados en este establecimiento |

## Modelo: CatServicio
**Descripción:** ClasificaciÃ³n oficial de establecimientos de salud en Honduras Hospital de referencia nacional Hospital departamental o regional Centro de salud con atenciÃ³n mÃ©dica ClÃ­nica de atenciÃ³n de emergencias perifÃ©rica Centro de Salud con MÃ©dico y OdontÃ³logo Centro de Salud Rural CatÃ¡logo maestro de servicios o unidades funcionales (ej: Emergencias, Farmacia)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre Ãºnico del servicio |
| descripcion | String? | DescripciÃ³n de las funciones del servicio |
| activo | Boolean | Indica si el servicio estÃ¡ activo para ser asignado |
| servicios | Servicio[] | RelaciÃ³n con las instancias de este servicio en diferentes establecimientos |

## Modelo: ReporteDisponible
**Descripción:** Registro de reportes analÃ­ticos disponibles en la plataforma

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre legible del reporte |
| descripcion | String? | DescripciÃ³n de la utilidad y datos que contiene |
| categoria | String | CategorÃ­a para agrupaciÃ³n en la UI (MEDICA, FARMACIA, etc.) |
| slug | String | Identificador interno para la lÃ³gica de generaciÃ³n |
| tipo | String | Formato de salida (EXCEL, PDF) |
| permiso | String | Permiso granular requerido para acceder a este reporte |
| icono | String? | Nombre del icono decorativo en la UI |
| activo | Boolean | Indica si el reporte estÃ¡ disponible actualmente |
| orden | Int | Orden de apariciÃ³n en el listado |

## Modelo: Servicio
**Descripción:** Representa la habilitaciÃ³n de un servicio del catÃ¡logo en un establecimiento especÃ­fico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| activo | Boolean | Indica si el servicio estÃ¡ operativo en este establecimiento |
| establecimientoId | Int | ID del establecimiento |
| catServicioId | Int | ID del servicio del catÃ¡logo |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| catServicio | CatServicio | RelaciÃ³n con el catÃ¡logo de servicios |
| asignaciones | AsignacionUsuario[] | Personal asignado especÃ­ficamente a esta unidad funcional |
| salas | Sala[] | Salas o pabellones pertenecientes a este servicio |
| ingresos | IngresoHospitalario[] | Ingresos hospitalarios admitidos en este servicio |

## Modelo: CatTipoHabitacion
**Descripción:** CatÃ¡logo maestro de tipos de habitaciones (ej: Privada, Bipersonal, Sala ComÃºn)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre del tipo de habitaciÃ³n |
| descripcion | String? | DescripciÃ³n de las caracterÃ­sticas |
| habitaciones | Habitacion[] | Habitaciones de este tipo |

## Modelo: CatTipoCama
**Descripción:** CatÃ¡logo maestro de tipos de camas (ej: Cama ElÃ©ctrica, Camilla, Cuna, Incubadora)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre del tipo de cama |
| descripcion | String? | DescripciÃ³n tÃ©cnica |
| camas | Cama[] | Camas de este tipo |

## Modelo: Sala
**Descripción:** Representa una sala o pabellÃ³n dentro de un servicio mÃ©dico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre descriptivo (ej: Sala de Hombres) |
| codigo | String? | CÃ³digo interno de la sala |
| activo | Boolean | Indica si la sala estÃ¡ activa |
| servicioId | Int | ID del servicio al que pertenece |
| servicio | Servicio | RelaciÃ³n con el servicio |
| habitaciones | Habitacion[] | Habitaciones contenidas en la sala |

## Modelo: Habitacion
**Descripción:** Representa una habitaciÃ³n o pieza fÃ­sica dentro de una sala

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| numero | String | NÃºmero o nombre de la habitaciÃ³n (ej: 101, A-1) |
| activo | Boolean | Indica si la habitaciÃ³n estÃ¡ operativa |
| salaId | Int | ID de la sala a la que pertenece |
| sala | Sala | RelaciÃ³n con la sala |
| tipoHabitacionId | Int | ID del tipo de habitaciÃ³n |
| tipoHabitacion | CatTipoHabitacion | RelaciÃ³n con el catÃ¡logo de tipos de habitaciÃ³n |
| camas | Cama[] | Camas disponibles en esta habitaciÃ³n |

## Modelo: Cama
**Descripción:** Representa la unidad funcional final de hospitalizaciÃ³n

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| codigo | String | CÃ³digo Ãºnico de identificaciÃ³n de la cama |
| estado | EstadoCama | Estado actual de la cama |
| activo | Boolean | Indica si la cama estÃ¡ activa fÃ­sicamente |
| habitacionId | Int | ID de la habitaciÃ³n a la que pertenece |
| habitacion | Habitacion | RelaciÃ³n con la habitaciÃ³n |
| tipoCamaId | Int | ID del tipo de cama |
| tipoCama | CatTipoCama | RelaciÃ³n con el catÃ¡logo de tipos de cama |
| ingresos | IngresoHospitalario[] | Ingresos hospitalarios asociados a esta cama |
| movimientosOrigen | MovimientoHospitalario[] | Movimientos donde esta cama fue el origen |
| movimientosDestino | MovimientoHospitalario[] | Movimientos donde esta cama fue el destino |

## Modelo: AsignacionUsuario
**Descripción:** Estados operativos posibles de una cama Lista para recibir paciente Con paciente asignado Apartada para un ingreso prÃ³ximo Fuera de servicio por desperfecto En proceso de desinfecciÃ³n/limpieza Permite la gestiÃ³n de personal en mÃºltiples establecimientos y servicios con roles diferenciados

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| usuarioId | Int | ID del usuario asignado |
| establecimientoId | Int | ID del establecimiento de la asignaciÃ³n |
| servicioId | Int? | ID del servicio (opcional) si la asignaciÃ³n es a una unidad funcional especÃ­fica |
| rolId | Int? | ID del rol (opcional) si el usuario tiene un rol distinto en este establecimiento |
| especialidadId | Int? | ID de la especialidad (opcional) si ejerce una especialidad distinta aquÃ­ |
| activo | Boolean | Indica si la asignaciÃ³n estÃ¡ vigente |
| permisos | Json? | Sobrescritura opcional de permisos especÃ­ficos para esta asignaciÃ³n |
| creadoEn | DateTime | Fecha de creaciÃ³n de la asignaciÃ³n |
| actualizadoEn | DateTime | Fecha de Ãºltima modificaciÃ³n |
| usuario | Usuario | RelaciÃ³n con el usuario |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| servicio | Servicio? | RelaciÃ³n con el servicio especÃ­fico |
| rol | Rol? | RelaciÃ³n con el rol especÃ­fico |
| especialidad | Especialidad? | RelaciÃ³n con la especialidad especÃ­fica |

## Modelo: Especialidad
**Descripción:** CatÃ¡logo de especialidades mÃ©dicas (ej: PediatrÃ­a, GinecologÃ­a)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| codigo | String | CÃ³digo abreviado de la especialidad (ej: PED, GIN) |
| nombre | String | Nombre completo de la especialidad |
| descripcion | String? | Breve descripciÃ³n del alcance de la especialidad |
| activa | Boolean | Indica si la especialidad estÃ¡ activa para nuevas asignaciones |
| creadoEn | DateTime | Fecha de registro |
| actualizadoEn | DateTime? | Fecha de Ãºltima actualizaciÃ³n |
| creadoPorId | Int? | ID del usuario que registrÃ³ la especialidad |
| actualizadoPorId | Int? | ID del usuario que realizÃ³ la Ãºltima actualizaciÃ³n |
| creadoPor | Usuario? | RelaciÃ³n con el usuario creador |
| actualizadoPor | Usuario? | RelaciÃ³n con el usuario actualizador |
| plantillas | PlantillaFormulario[] | Plantillas de formularios clÃ­nicos asociadas a esta especialidad |
| usuarios | Usuario[] | Usuarios (mÃ©dicos) que tienen esta especialidad como primaria |
| asignaciones | AsignacionUsuario[] | Asignaciones de personal donde se ejerce esta especialidad |
| citas | Cita[] | Citas mÃ©dicas programadas para esta especialidad |

## Modelo: Paciente
**Descripción:** Registro central de datos personales y demogrÃ¡ficos de los pacientes

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico autoincremental |
| numeroExpediente | String | NÃºmero de expediente Ãºnico generado por el sistema |
| dni | String | Documento Nacional de IdentificaciÃ³n (Honduras) |
| nombres | String | Nombres del paciente |
| apellidos | String | Apellidos del paciente |
| fechaNacimiento | DateTime | Fecha de nacimiento |
| sexoId | Int | ID del catÃ¡logo de sexos |
| tipoSangreId | Int? | ID del catÃ¡logo de tipos de sangre |
| telefono | String? | TelÃ©fono de contacto |
| telefonoEmergencia | String? | TelÃ©fono de contacto para emergencias |
| correo | String? | Correo electrÃ³nico (opcional) |
| direccion | String? | DirecciÃ³n de domicilio detallada |
| departamentoId | Int | ID del departamento de domicilio |
| municipioId | Int | ID del municipio de domicilio |
| comunidad | String? | Nombre de la comunidad, barrio o colonia |
| escolaridadId | Int? | ID del catÃ¡logo de escolaridad |
| ocupacionId | Int? | ID del catÃ¡logo de ocupaciones |
| estadoCivilId | Int? | ID del catÃ¡logo de estado civil |
| activo | Boolean | Indica si el paciente estÃ¡ activo para atenciÃ³n |
| fechaRegistro | DateTime | Fecha de registro inicial en el sistema |
| actualizadoEn | DateTime? | Fecha de Ãºltima actualizaciÃ³n de datos demogrÃ¡ficos |
| eliminadoEn | DateTime? | Fecha de eliminaciÃ³n lÃ³gica |
| establecimientoId | Int | ID del establecimiento donde se registrÃ³ el paciente |
| creadoPorId | Int | ID del usuario que registrÃ³ al paciente |
| actualizadoPorId | Int? | ID del usuario que realizÃ³ la Ãºltima actualizaciÃ³n |
| eliminadoPorId | Int? | ID del usuario que realizÃ³ la eliminaciÃ³n lÃ³gica |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento de registro |
| departamento | Departamento | RelaciÃ³n con el departamento |
| municipio | Municipio | RelaciÃ³n con el municipio |
| sexo | Sexo | RelaciÃ³n con el catÃ¡logo de sexos |
| tipoSangre | TipoSangre? | RelaciÃ³n con el catÃ¡logo de tipos de sangre |
| escolaridad | Escolaridad? | RelaciÃ³n con el catÃ¡logo de escolaridad |
| ocupacion | Ocupacion? | RelaciÃ³n con el catÃ¡logo de ocupaciones |
| estadoCivil | EstadoCivil? | RelaciÃ³n con el catÃ¡logo de estado civil |
| eliminadoPor | Usuario? | RelaciÃ³n con el usuario que eliminÃ³ el registro |
| alergias | Alergia[] | Historial de alergias del paciente |
| citas | Cita[] | Historial de citas mÃ©dicas |
| historialClinico | HistoriaClinica[] | Historial de atenciones (Historia ClÃ­nica) |
| medicamentosActivos | PacienteMedicamento[] | Listado de medicamentos de uso crÃ³nico o actual |
| triajes | Triaje[] | Historial de triajes realizados |
| recetas | Receta[] | Historial de recetas emitidas |
| solicitudesLab | SolicitudLaboratorio[] | Solicitudes de laboratorio realizadas |
| solicitudesRad | SolicitudRadiologia[] | Solicitudes de radiologÃ­a realizadas |
| vacunas | VacunacionRegistro[] | Historial de vacunaciÃ³n PAI |
| notificacionesEpidemiologicas | NotificacionEpidemiologica[] | Notificaciones epidemiolÃ³gicas asociadas al paciente |
| ingresos | IngresoHospitalario[] | Historial de internamientos hospitalarios |

## Modelo: Sexo
**Descripción:** CatÃ¡logo de sexos para registro demogrÃ¡fico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre del sexo (Masculino, Femenino) |
| pacientes | Paciente[] | Pacientes asociados a este sexo |

## Modelo: TipoSangre
**Descripción:** CatÃ¡logo de tipos de sangre y factor RH

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre del tipo de sangre (ej: O+, A-) |
| pacientes | Paciente[] | Pacientes asociados a este tipo de sangre |

## Modelo: Escolaridad
**Descripción:** CatÃ¡logo de niveles de escolaridad alcanzados

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre del nivel (ej: Primaria, Universitaria) |
| pacientes | Paciente[] | Pacientes con este nivel de escolaridad |

## Modelo: EstadoCivil
**Descripción:** CatÃ¡logo de estados civiles

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre del estado (ej: Soltero, Casado) |
| pacientes | Paciente[] | Pacientes con este estado civil |

## Modelo: Ocupacion
**Descripción:** CatÃ¡logo de ocupaciones o profesiones

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre de la ocupaciÃ³n |
| pacientes | Paciente[] | Pacientes que ejercen esta ocupaciÃ³n |

## Modelo: Alergia
**Descripción:** Registro de alergias conocidas de un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| pacienteId | Int | ID del paciente afectado |
| tipo | TipoAlergia | CategorÃ­a de la alergia (Medicamento, Alimento, etc.) |
| descripcion | String | DescripciÃ³n de la sustancia y reacciÃ³n |
| severidad | Severidad | Grado de peligrosidad de la alergia |
| paciente | Paciente | RelaciÃ³n con el paciente |

## Modelo: Cita
**Descripción:** ClasificaciÃ³n del tipo de alÃ©rgeno ReacciÃ³n a fÃ¡rmacos ReacciÃ³n a comidas ReacciÃ³n a factores del entorno ReacciÃ³n especÃ­fica al lÃ¡tex Otros tipos de alergias Escala de severidad de la reacciÃ³n alÃ©rgica ReacciÃ³n leve, no compromete la vida ReacciÃ³n que requiere tratamiento mÃ©dico moderado ReacciÃ³n anafilÃ¡ctica o de alto riesgo GestiÃ³n de citas mÃ©dicas y programaciÃ³n de consultas

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| pacienteId | Int | ID del paciente que solicita la cita |
| medicoId | Int | ID del mÃ©dico asignado (opcional si es urgencia) |
| establecimientoId | Int | ID del establecimiento donde se realizarÃ¡ la cita |
| fechaHora | DateTime | Fecha y hora programada para la atenciÃ³n |
| duracionMinutos | Int | Tiempo estimado de duraciÃ³n del encuentro mÃ©dico |
| tipo | TipoCita | Tipo de atenciÃ³n solicitada |
| estado | EstadoCita | Estado actual de la cita (Programada, Atendida, etc.) |
| motivo | String? | Motivo breve de la consulta |
| notas | String? | Observaciones adicionales |
| creadaEn | DateTime | Fecha de registro de la cita |
| creadoPorId | Int? | ID del usuario (recepcionista) que registrÃ³ la cita |
| canceladoPorId | Int? | ID del usuario que cancelÃ³ la cita (si aplica) |
| especialidadId | Int? | ID de la especialidad bajo la cual se atiende la cita |
| paciente | Paciente | RelaciÃ³n con el paciente |
| medico | Usuario | RelaciÃ³n con el mÃ©dico tratante |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| creadoPor | Usuario? | RelaciÃ³n con el usuario creador |
| canceladoPor | Usuario? | RelaciÃ³n con el usuario que cancelÃ³ |
| especialidad | Especialidad? | RelaciÃ³n con la especialidad |
| historia | HistoriaClinica? | Historia clÃ­nica resultante de esta cita |
| triaje | Triaje? | Datos de triaje previo a la consulta |
| historiaOrigen | HistoriaClinica? | RelaciÃ³n con la atenciÃ³n previa que originÃ³ esta cita (si fue una re-cita) |

## Modelo: HistoriaClinica
**Descripción:** ClasificaciÃ³n del tipo de encuentro mÃ©dico Consulta mÃ©dica general Consulta con mÃ©dico especialista Cita de seguimiento o control AtenciÃ³n inmediata por urgencia Cita para aplicaciÃ³n de vacunas Consulta de salud reproductiva Estados posibles en el ciclo de vida de una cita Cita registrada pero pendiente de confirmaciÃ³n/llegada El paciente ha confirmado su asistencia El encuentro mÃ©dico ha concluido exitosamente La cita ha sido anulada por el paciente o el centro El paciente no se presentÃ³ a su cita programada El paciente estÃ¡ presente en el establecimiento esperando atenciÃ³n Representa el encuentro clÃ­nico (consulta) y el registro mÃ©dico del paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| pacienteId | Int | ID del paciente atendido |
| medicoId | Int | ID del mÃ©dico tratante |
| citaId | Int? | ID de la cita asociada |
| plantillaId | Int? | ID de la plantilla de formulario utilizada |
| fecha | DateTime | Fecha y hora de la atenciÃ³n |
| subjetivo | String | [S]ubjetivo: Motivo de consulta, sÃ­ntomas y anamnesis |
| objetivo | String | [O]bjetivo: Hallazgos del examen fÃ­sico |
| analisis | String | [A]nÃ¡lisis: Razonamiento mÃ©dico y diagnÃ³sticos presuntivos |
| plan | String | [P]lan: Tratamiento, medicamentos, exÃ¡menes y recomendaciones |
| presionSistolica | Int? | TensiÃ³n arterial sistÃ³lica (mmHg) |
| presionDiastolica | Int? | TensiÃ³n arterial diastÃ³lica (mmHg) |
| frecuenciaCardiaca | Int? | Latidos por minuto |
| temperatura | Decimal? | Temperatura corporal (Â°C) |
| peso | Decimal? | Peso del paciente (kg) |
| talla | Decimal? | Estatura del paciente (cm) |
| saturacionO2 | Int? | Porcentaje de saturaciÃ³n de oxÃ­geno |
| semanaEpidemiologica | Int? | NÃºmero de semana epidemiolÃ³gica (1-52) |
| actualizadoEn | DateTime? | Fecha de la Ãºltima modificaciÃ³n |
| eliminadoEn | DateTime? | Fecha de eliminaciÃ³n lÃ³gica |
| actualizadoPorId | Int? | ID del usuario que actualizÃ³ el registro |
| eliminadoPorId | Int? | ID del usuario que eliminÃ³ el registro |
| paciente | Paciente | RelaciÃ³n con el paciente |
| medico | Usuario | RelaciÃ³n con el mÃ©dico |
| actualizadoPor | Usuario? | RelaciÃ³n con el usuario actualizador |
| eliminadoPor | Usuario? | RelaciÃ³n con el usuario eliminador |
| cita | Cita? | RelaciÃ³n con la cita |
| plantilla | PlantillaFormulario? | RelaciÃ³n con la plantilla de formulario |
| proximaCitaId | Int? | ID de la prÃ³xima cita programada |
| proximaCita | Cita? | RelaciÃ³n con la prÃ³xima cita |
| diagnosticos | Diagnostico[] | Listado de diagnÃ³sticos realizados en la consulta |
| recetas | Receta[] | Recetas emitidas |
| referidos | Referido[] | Referencias emitidas |
| resultadosLab | ResultadoLaboratorio[] | Resultados de laboratorio asociados |
| solicitudesLab | SolicitudLaboratorio[] | Solicitudes de laboratorio generadas |
| solicitudesRad | SolicitudRadiologia[] | Solicitudes de radiologÃ­a generadas |
| respuestaFormulario | RespuestaFormulario? | Respuestas detalladas del formulario dinÃ¡mico |
| incapacidades | Incapacidad[] | Registro de incapacidades (si aplica) |
| notificacionEpidemiologica | NotificacionEpidemiologica? | NotificaciÃ³n epidemiolÃ³gica obligatoria |

## Modelo: Diagnostico
**Descripción:** DiagnÃ³sticos asociados a una atenciÃ³n mÃ©dica (basados en CIE-10)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica asociada |
| codigoCIE10 | String | CÃ³digo alfanumÃ©rico CIE-10 |
| descripcion | String | DescripciÃ³n del diagnÃ³stico segÃºn catÃ¡logo |
| tipo | TipoDiagnostico | Importancia del diagnÃ³stico (Principal, Secundario) |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |

## Modelo: Incapacidad
**Descripción:** ClasificaciÃ³n de la relevancia del diagnÃ³stico Causa principal de la consulta PatologÃ­as adicionales detectadas Enfermedades preexistentes relevantes Registro de incapacidades mÃ©dicas otorgadas al paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica asociada |
| fechaInicio | DateTime | Fecha de inicio del reposo |
| fechaFin | DateTime | Fecha de finalizaciÃ³n del reposo |
| dias | Int | Total de dÃ­as de incapacidad |
| tipo | TipoIncapacidad | Ãmbito de la incapacidad (Laboral, Escolar) |
| motivo | String | DescripciÃ³n de la justificaciÃ³n mÃ©dica |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |

## Modelo: Medicamento
**Descripción:** Tipo de justificaciÃ³n de ausencia Reposo para trabajadores JustificaciÃ³n para estudiantes RecomendaciÃ³n para atletas CatÃ¡logo maestro de medicamentos y productos farmacÃ©uticos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| codigo | String | CÃ³digo de barras o SKU del medicamento |
| nombreGenerico | String | DenominaciÃ³n ComÃºn Internacional (DCI) |
| nombreComercial | String? | Nombre bajo el cual se comercializa (opcional) |
| presentacion | String | Forma farmacÃ©utica (ej: Tabletas, Jarabe) |
| concentracion | String | Cantidad de principio activo (ej: 500mg) |
| via | ViaAdministracion | MÃ©todo de ingreso al organismo |
| grupoTerapeutico | String | ClasificaciÃ³n terapÃ©utica (ej: AntibiÃ³ticos) |
| requiereReceta | Boolean | Indica si requiere autorizaciÃ³n mÃ©dica para dispensar |
| esControlado | Boolean | Indica si el medicamento es psicotrÃ³pico o estupefaciente |
| activo | Boolean | Indica si el medicamento estÃ¡ disponible en el catÃ¡logo |
| creadoEn | DateTime | Fecha de registro inicial |
| actualizadoEn | DateTime? | Fecha de Ãºltima actualizaciÃ³n de ficha tÃ©cnica |
| eliminadoEn | DateTime? | Fecha de eliminaciÃ³n lÃ³gica |
| creadoPorId | Int? | ID del usuario que registrÃ³ el medicamento |
| actualizadoPorId | Int? | ID del usuario que realizÃ³ la Ãºltima actualizaciÃ³n |
| eliminadoPorId | Int? | ID del usuario que realizÃ³ la eliminaciÃ³n lÃ³gica |
| creadoPor | Usuario? | RelaciÃ³n con el usuario creador |
| actualizadoPor | Usuario? | RelaciÃ³n con el usuario actualizador |
| eliminadoPor | Usuario? | RelaciÃ³n con el usuario eliminador |
| inventario | Inventario[] | Existencias de este medicamento en distintos establecimientos |
| detallesReceta | DetalleReceta[] | Apariciones de este medicamento en recetas emitidas |
| kardexMedicamentos | KardexMedicamento[] |  |

## Modelo: Inventario
**Descripción:** Listado de vÃ­as de administraciÃ³n de medicamentos IngestiÃ³n por la boca AdministraciÃ³n mediante jeringas (IM, IV, SC) AplicaciÃ³n sobre la piel AdministraciÃ³n por vÃ­as respiratorias Debajo de la lengua IntroducciÃ³n por el recto AplicaciÃ³n en los ojos AplicaciÃ³n en los oÃ­dos Control de existencias fÃ­sicas de medicamentos por establecimiento y lote

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| medicamentoId | Int | ID del medicamento asociado |
| establecimientoId | Int | ID del establecimiento que posee el stock |
| cantidadActual | Int | Cantidad disponible actualmente para dispensar |
| cantidadMinima | Int | Nivel mÃ­nimo antes de generar alertas de reabastecimiento |
| lote | String? | CÃ³digo del lote de fabricaciÃ³n para trazabilidad |
| fechaVencimiento | DateTime? | Fecha de expiraciÃ³n del lote |
| ubicacion | String? | UbicaciÃ³n fÃ­sica dentro de la bodega/farmacia |
| activo | Boolean | Indica si este stock estÃ¡ disponible para uso |
| creadoEn | DateTime | Fecha de registro del ingreso inicial |
| actualizadoEn | DateTime? | Fecha de Ãºltimo movimiento o ajuste |
| eliminadoEn | DateTime? | Fecha de eliminaciÃ³n (si aplica) |
| creadoPorId | Int? | ID del usuario que registrÃ³ el ingreso |
| actualizadoPorId | Int? | ID del usuario que realizÃ³ la Ãºltima modificaciÃ³n |
| eliminadoPorId | Int? | ID del usuario que eliminÃ³ el registro |
| medicamento | Medicamento | RelaciÃ³n con la ficha del medicamento |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento de salud |
| creadoPor | Usuario? | RelaciÃ³n con el usuario creador |
| actualizadoPor | Usuario? | RelaciÃ³n con el usuario actualizador |
| eliminadoPor | Usuario? | RelaciÃ³n con el usuario eliminador |
| movimientos | MovimientoInventario[] | Historial de entradas y salidas asociadas a este inventario |
| dispensaciones | DispensacionDetalle[] | Detalles de dispensaciones realizadas desde este stock |

## Modelo: MovimientoInventario
**Descripción:** Registro histÃ³rico de transacciones que afectan el stock de medicamentos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| inventarioId | Int | ID del registro de inventario afectado |
| tipo | TipoMovimiento | Tipo de transacciÃ³n (Entrada, Salida, etc.) |
| cantidad | Int | Cantidad de unidades involucradas en el movimiento |
| motivo | String? | ExplicaciÃ³n del porquÃ© del movimiento |
| usuarioId | Int | ID del usuario que realizÃ³ la transacciÃ³n |
| fecha | DateTime | Fecha y hora del registro |
| inventario | Inventario | Relación con el inventario |
| usuario | Usuario | Relación con el usuario que realizó el movimiento |

## Modelo: Receta
**Descripción:** ClasificaciÃ³n de transacciones de inventario Ingreso de nuevo stock por compras o donaciones Salida por traslados o suministros internos Correcciones manuales por inventario fÃ­sico EliminaciÃ³n por fecha de vencimiento alcanzada Salida por daÃ±o, robo o extravÃ­o Entrega directa al paciente mediante receta Documento de prescripciÃ³n mÃ©dica para un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica donde se originÃ³ la receta |
| pacienteId | Int | ID del paciente beneficiario |
| establecimientoId | Int | ID del establecimiento donde se emitiÃ³ |
| estado | EstadoReceta | Estado actual del flujo de dispensaciÃ³n |
| creadaEn | DateTime | Fecha de emisiÃ³n |
| dispensadaEn | DateTime? | Fecha en la que se completÃ³ la entrega total |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |
| paciente | Paciente | RelaciÃ³n con el paciente |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| detalles | DetalleReceta[] | Listado de medicamentos prescritos |
| dispensaciones | Dispensacion[] | Historial de entregas asociadas a esta receta |

## Modelo: DetalleReceta
**Descripción:** Ciclo de vida de una receta mÃ©dica Receta emitida pero aÃºn no presentada en farmacia Se han entregado todos los medicamentos prescritos Se han entregado solo algunos medicamentos o cantidades Receta anulada por el mÃ©dico No se pudo dispensar por falta de existencias (stock agotado) EspecificaciÃ³n de un medicamento individual dentro de una receta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| recetaId | Int | ID de la receta a la que pertenece |
| medicamentoId | Int | ID del medicamento prescrito |
| dosis | String | Cantidad y unidad por toma (ej: 1 tableta) |
| frecuencia | String | Intervalo de tiempo (ej: Cada 8 horas) |
| duracion | String | Tiempo total de tratamiento (ej: 7 dÃ­as) |
| cantidad | Int | Cantidad total de unidades a dispensar |
| cantidadEntregada | Int | Acumulado de unidades ya entregadas |
| ultimaDispensacion | DateTime? | Fecha del Ãºltimo despacho parcial |
| indicaciones | String? | Consejos adicionales para el paciente |
| receta | Receta | RelaciÃ³n con la receta cabecera |
| medicamento | Medicamento | RelaciÃ³n con la ficha del medicamento |
| dispensaciones | DispensacionDetalle[] | RelaciÃ³n con los despachos fÃ­sicos realizados |

## Modelo: PacienteMedicamento
**Descripción:** Historial de medicaciÃ³n activa (tratamientos crÃ³nicos) de un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| pacienteId | Int | ID del paciente |
| medicamentoId | Int | ID del medicamento |
| dosis | String | Dosis del tratamiento |
| frecuencia | String | Frecuencia de administraciÃ³n |
| inicio | DateTime | Fecha de inicio del tratamiento |
| fin | DateTime? | Fecha estimada de finalizaciÃ³n (null si es permanente) |
| paciente | Paciente | RelaciÃ³n con el paciente |

## Modelo: CatExamenLaboratorio
**Descripción:** CatÃ¡logo maestro de exÃ¡menes de laboratorio clÃ­nico disponibles

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| codigo | String | CÃ³digo interno Ãºnico del examen |
| nombre | String | Nombre descriptivo del examen |
| categoria | String | Ãrea del laboratorio (ej: HematologÃ­a, QuÃ­mica) |
| indicaciones | String? | Requisitos para el paciente (ej: Ayuno 8h) |
| activo | Boolean | Indica si el examen estÃ¡ disponible en el catÃ¡logo general |
| establecimientos | ExamenEstablecimiento[] | Establecimientos que ofrecen este examen |
| detallesSolicitud | DetalleSolicitudLaboratorio[] | Solicitudes que incluyen este examen |

## Modelo: ExamenEstablecimiento
**Descripción:** Tabla asociativa de exÃ¡menes habilitados por cada establecimiento

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| establecimientoId | Int | ID del establecimiento |
| examenId | Int | ID del examen del catÃ¡logo |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| examen | CatExamenLaboratorio | RelaciÃ³n con el catÃ¡logo de exÃ¡menes |

## Modelo: SolicitudLaboratorio
**Descripción:** Orden de laboratorio clÃ­nico emitida durante una consulta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica origen |
| pacienteId | Int | ID del paciente |
| establecimientoId | Int | ID del establecimiento donde se procesarÃ¡ |
| estado | EstadoLab | Estado actual del flujo de laboratorio |
| urgente | Boolean | Prioridad de procesamiento |
| observaciones | String? | Notas mÃ©dicas adicionales para el laboratorista |
| creadaEn | DateTime | Fecha de emisiÃ³n de la orden |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |
| paciente | Paciente | RelaciÃ³n con el paciente |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| detalles | DetalleSolicitudLaboratorio[] | Listado de exÃ¡menes especÃ­ficos solicitados |
| resultados | ResultadoLaboratorio[] | Resultados cargados para esta solicitud |

## Modelo: DetalleSolicitudLaboratorio
**Descripción:** Detalle de cada examen incluido en una orden de laboratorio

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| solicitudId | Int | ID de la solicitud cabecera |
| examenId | Int | ID del examen especÃ­fico |
| observaciones | String? | Observaciones especÃ­ficas para este examen |
| solicitud | SolicitudLaboratorio | RelaciÃ³n con la solicitud |
| examen | CatExamenLaboratorio | RelaciÃ³n con el catÃ¡logo de exÃ¡menes |

## Modelo: ResultadoLaboratorio
**Descripción:** Estados del flujo de trabajo del laboratorio Orden emitida por el mÃ©dico Muestras tomadas o en anÃ¡lisis Resultados validados y disponibles Orden anulada Registro de resultados numÃ©ricos o cualitativos de exÃ¡menes de laboratorio

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| solicitudId | Int | ID de la solicitud a la que pertenece el resultado |
| historiaId | Int? | ID opcional de la historia clÃ­nica para vinculaciÃ³n directa |
| prueba | String | Nombre del parÃ¡metro o prueba analizada |
| valor | String | Resultado obtenido |
| unidad | String? | Unidad de medida (ej: mg/dL, %) |
| valorReferencia | String? | Rango esperado para un paciente sano |
| anormal | Boolean | Indica si el valor estÃ¡ fuera de los rangos normales |
| observaciones | String? | InterpretaciÃ³n del microbiÃ³logo o analista |
| fecha | DateTime | Fecha y hora de validaciÃ³n del resultado |
| solicitud | SolicitudLaboratorio | RelaciÃ³n con la solicitud cabecera |
| historia | HistoriaClinica? | RelaciÃ³n con la historia clÃ­nica |

## Modelo: CatExamenRadiologico
**Descripción:** CatÃ¡logo maestro de estudios radiolÃ³gicos e imagenologÃ­a

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| codigo | String | CÃ³digo interno Ãºnico (ej: RX-01, TAC-05) |
| nombre | String | Nombre del estudio (ej: Rayos X de TÃ³rax) |
| categoria | String | Modalidad de imagen (RX, ECO, TAC, RM, etc.) |
| indicaciones | String? | Requisitos tÃ©cnicos o del paciente |
| activo | Boolean | Indica si el estudio estÃ¡ disponible en el catÃ¡logo |
| establecimientos | EstudioRadiologicoEstablecimiento[] | Establecimientos que cuentan con el equipo para este estudio |
| detallesSolicitud | DetalleSolicitudRadiologia[] | Solicitudes que incluyen este estudio |

## Modelo: EstudioRadiologicoEstablecimiento
**Descripción:** Tabla asociativa de estudios de imagen habilitados por establecimiento

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| establecimientoId | Int | ID del establecimiento |
| estudioId | Int | ID del estudio del catÃ¡logo |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| estudio | CatExamenRadiologico | RelaciÃ³n con el catÃ¡logo de radiologÃ­a |

## Modelo: SolicitudRadiologia
**Descripción:** Orden de estudios de imagenologÃ­a emitida por un mÃ©dico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica origen |
| pacienteId | Int | ID del paciente |
| establecimientoId | Int | ID del establecimiento de destino |
| estado | EstadoLab | Estado del flujo (Solicitado, Completado) |
| urgente | Boolean | Prioridad de atenciÃ³n |
| observaciones | String? | JustificaciÃ³n clÃ­nica del estudio |
| creadaEn | DateTime | Fecha de emisiÃ³n de la orden |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |
| paciente | Paciente | RelaciÃ³n con el paciente |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| detalles | DetalleSolicitudRadiologia[] | Listado de estudios especÃ­ficos requeridos |
| resultados | ResultadoRadiologia[] | Interpretaciones de los resultados |

## Modelo: DetalleSolicitudRadiologia
**Descripción:** Detalle de cada estudio individual en una orden de radiologÃ­a

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| solicitudId | Int | ID de la solicitud cabecera |
| estudioId | Int | ID del estudio especÃ­fico |
| observaciones | String? | Observaciones o sospechas diagnÃ³sticas para el radiÃ³logo |
| solicitud | SolicitudRadiologia | RelaciÃ³n con la solicitud |
| estudio | CatExamenRadiologico | RelaciÃ³n con el catÃ¡logo de estudios |

## Modelo: ResultadoRadiologia
**Descripción:** Registro de la interpretaciÃ³n mÃ©dica de un estudio de imagen

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| solicitudId | Int | ID de la solicitud a la que pertenece el informe |
| hallazgos | String? | DescripciÃ³n detallada de lo observado en la imagen |
| conclusion | String? | DiagnÃ³stico radiolÃ³gico final |
| imageUrl | String? | Enlace al visor PACS o almacenamiento de la imagen digital |
| fecha | DateTime | Fecha y hora del informe |
| solicitud | SolicitudRadiologia | RelaciÃ³n con la solicitud cabecera |

## Modelo: Referido
**Descripción:** GestiÃ³n de referencias de pacientes entre establecimientos de la red

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica donde se origina el referido |
| establecimientoOrigenId | Int | Establecimiento que envÃ­a al paciente |
| establecimientoDestinoId | Int | Establecimiento que recibirÃ¡ al paciente |
| especialidadDestino | String | Especialidad a la que se remite |
| motivo | String | JustificaciÃ³n clÃ­nica del traslado |
| urgente | Boolean | Prioridad de la referencia |
| estado | EstadoReferido | Estado del trÃ¡mite administrativo |
| creadoEn | DateTime | Fecha de emisiÃ³n |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |
| origen | Establecimiento | RelaciÃ³n con el centro de origen |
| destino | Establecimiento | RelaciÃ³n con el centro de destino |

## Modelo: PlantillaFormulario
**Descripción:** Estados del proceso de referencia y contrarreferencia Referencia emitida por el mÃ©dico Referencia aceptada por el centro de destino El paciente ya fue evaluado en el centro de destino Referencia no aceptada por el centro de destino DefiniciÃ³n de formularios clÃ­nicos dinÃ¡micos por especialidad

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| especialidadId | Int | ID de la especialidad a la que pertenece el formulario |
| nombre | String | Nombre descriptivo del formulario (ej: Control Prenatal) |
| descripcion | String? | PropÃ³sito del formulario |
| version | Int | NÃºmero de versiÃ³n para control de cambios |
| activa | Boolean | Indica si es la versiÃ³n que se muestra actualmente |
| creadoPorId | Int | ID del usuario que diseÃ±Ã³ la plantilla |
| creadoEn | DateTime | Fecha de creaciÃ³n |
| actualizadoEn | DateTime | Fecha de Ãºltima modificaciÃ³n |
| especialidad | Especialidad | RelaciÃ³n con la especialidad |
| creadoPor | Usuario | RelaciÃ³n con el usuario diseÃ±ador |
| secciones | SeccionFormulario[] | Secciones que componen el formulario |
| historiales | HistoriaClinica[] | Historias clÃ­nicas que han utilizado esta plantilla |
| respuestas | RespuestaFormulario[] | Datos capturados mediante esta plantilla |

## Modelo: SeccionFormulario
**Descripción:** Agrupador de campos dentro de un formulario dinÃ¡mico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| plantillaId | Int | ID de la plantilla padre |
| nombre | String | TÃ­tulo de la secciÃ³n |
| descripcion | String? | Texto de ayuda para la secciÃ³n |
| orden | Int | PosiciÃ³n relativa en el formulario |
| colapsable | Boolean | Indica si la secciÃ³n se puede contraer en la UI |
| visible | Boolean | Indica si la secciÃ³n se muestra por defecto |
| plantilla | PlantillaFormulario | RelaciÃ³n con la plantilla |
| campos | CampoFormulario[] | Campos contenidos en esta secciÃ³n |

## Modelo: CampoFormulario
**Descripción:** DefiniciÃ³n de un campo individual de captura de datos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| seccionId | Int | ID de la secciÃ³n contenedora |
| tipo | TipoCampo | Tipo de control de entrada (Texto, NÃºmero, etc.) |
| etiqueta | String | Texto que ve el usuario (Label) |
| clave | String | Nombre tÃ©cnico del campo para almacenamiento |
| placeholder | String? | Texto sugerido dentro del campo |
| ayuda | String? | Texto de ayuda u orientaciÃ³n mÃ©dica |
| requerido | Boolean | Indica si el campo es obligatorio |
| orden | Int | PosiciÃ³n dentro de la secciÃ³n |
| ancho | AnchoCampo | Porcentaje de ancho que ocupa en la pantalla |
| visible | Boolean | Indica si el campo es visible inicialmente |
| configuracion | Json? | Objeto JSON con validaciones u opciones adicionales |
| condicionVisibilidad | Json? | LÃ³gica JSON para mostrar/ocultar segÃºn otros campos |
| seccion | SeccionFormulario | RelaciÃ³n con la secciÃ³n |

## Modelo: RespuestaFormulario
**Descripción:** Tipos de controles de entrada soportados por el generador de formularios LÃ­nea de texto corta Ãrea de texto multilinea Valor entero Valor con decimales Selector de fecha Interruptor SÃ­/No Lista desplegable de selecciÃ³n Ãºnica Lista de selecciÃ³n mÃºltiple Botones de selecciÃ³n Ãºnica Grupo de casillas de verificaciÃ³n Selector de rango numÃ©rico Grid de captura de datos repetitivos LÃ­nea divisoria visual Texto decorativo o encabezado Opciones de diseÃ±o responsivo para los campos 25% del ancho disponible 33.3% del ancho disponible 50% del ancho disponible 100% del ancho disponible Almacenamiento de los datos capturados en un formulario dinÃ¡mico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| historiaId | Int | ID de la historia clÃ­nica vinculada |
| plantillaId | Int | ID de la plantilla utilizada |
| respuestas | Json | Objeto JSON con los valores capturados (Clave-Valor) |
| completado | Boolean | Indica si se completaron todos los campos requeridos |
| creadoEn | DateTime | Fecha de registro de datos |
| actualizadoEn | DateTime | Fecha de Ãºltima modificaciÃ³n de los datos |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |
| plantilla | PlantillaFormulario | RelaciÃ³n con la plantilla |

## Modelo: Triaje
**Descripción:** EvaluaciÃ³n inicial de signos vitales y priorizaciÃ³n de atenciÃ³n

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| citaId | Int | ID de la cita para la cual se realiza el triaje |
| pacienteId | Int | ID del paciente evaluado |
| enfermeraId | Int | ID de la enfermera que realiza la evaluaciÃ³n |
| motivoConsulta | String | DescripciÃ³n breve del sÃ­ntoma principal |
| presionSistolica | Int? | TensiÃ³n arterial sistÃ³lica (mmHg) |
| presionDiastolica | Int? | TensiÃ³n arterial diastÃ³lica (mmHg) |
| frecuenciaCardiaca | Int? | Latidos por minuto |
| frecuenciaRespiratoria | Int? | Respiraciones por minuto |
| temperatura | Decimal? | Temperatura corporal (Â°C) |
| saturacionO2 | Int? | Porcentaje de oxÃ­geno en sangre |
| glucometria | Decimal? | Nivel de azÃºcar en sangre (mg/dL) |
| peso | Decimal? | Peso actual (kg) |
| talla | Decimal? | Estatura actual (cm) |
| escalaDolor | Int? | Intensidad del dolor percibido (0-10) |
| nivelConciencia | NivelConciencia | Estado neurolÃ³gico del paciente |
| categoria | CategoriaTriaje | ClasificaciÃ³n de prioridad segÃºn colores (Manchester/Sistema local) |
| observaciones | String? | Hallazgos adicionales de enfermerÃ­a |
| creadoEn | DateTime | Fecha y hora de la evaluaciÃ³n |
| cita | Cita | RelaciÃ³n con la cita |
| paciente | Paciente | RelaciÃ³n con el paciente |
| enfermera | Usuario | RelaciÃ³n con el personal de enfermerÃ­a |

## Modelo: CatDiagnostico
**Descripción:** Estados de alerta neurolÃ³gica del paciente (Escala AVDI) Paciente consciente y orientado Reacciona solo al estÃ­mulo verbal Reacciona solo ante estÃ­mulos dolorosos Sin respuesta a ningÃºn estÃ­mulo ClasificaciÃ³n internacional de urgencias Riesgo vital inmediato (AtenciÃ³n inmediata) Muy urgente (Espera < 10-15 min) Urgente (Espera < 60 min) EstÃ¡ndar (Espera < 120 min) No urgente (AtenciÃ³n demorable) CatÃ¡logo oficial de enfermedades CIE-10 (ClasificaciÃ³n Internacional de Enfermedades)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| codigo | String | CÃ³digo alfanumÃ©rico estÃ¡ndar (ej: A00.0) |
| descripcion | String | DescripciÃ³n clÃ­nica de la patologÃ­a |
| capitulo | String? | Grupo o capÃ­tulo al que pertenece la enfermedad |
| activo | Boolean | Indica si el diagnÃ³stico estÃ¡ vigente |
| notificable | Boolean | Indica si la enfermedad es de reporte obligatorio a vigilancia |
| notificacionInmediata | Boolean | Indica si se debe notificar en menos de 24 horas |

## Modelo: AuditLog
**Descripción:** Registro de trazabilidad de acciones crÃ­ticas realizadas en el sistema

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| usuarioId | Int? | ID del usuario que realizÃ³ la acciÃ³n |
| accion | String | Tipo de operaciÃ³n (CREATE, UPDATE, DELETE, LOGIN) |
| entidad | String | Nombre de la tabla o entidad afectada |
| entidadId | Int? | ID del registro especÃ­fico afectado |
| detalle | String? | DescripciÃ³n detallada del cambio o error |
| ip | String? | DirecciÃ³n IP del cliente |
| duracionMs | Int? | Tiempo de respuesta del servidor en milisegundos |
| timestamp | DateTime | Fecha y hora exacta del evento |
| usuario | Usuario? | RelaciÃ³n con el usuario (si aplica) |

## Modelo: ParametroSistema
**Descripción:** ConfiguraciÃ³n global de variables de operaciÃ³n del sistema

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| clave | String | Nombre Ãºnico de la variable (ej: TIEMPO_SESION) |
| valor | String | Valor asignado a la configuraciÃ³n |
| descripcion | String? | ExplicaciÃ³n del impacto del parÃ¡metro en el sistema |
| creadoEn | DateTime | Fecha de creaciÃ³n inicial |
| actualizadoEn | DateTime | Fecha de Ãºltima actualizaciÃ³n |

## Modelo: Dispensacion
**Descripción:** Registro de la entrega fÃ­sica de medicamentos al paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| recetaId | Int | ID de la receta que se estÃ¡ surtiendo |
| usuarioId | Int | ID del usuario de farmacia que entrega |
| establecimientoId | Int | ID del establecimiento donde ocurre la entrega |
| fecha | DateTime | Fecha y hora de la entrega |
| receta | Receta | RelaciÃ³n con la receta |
| usuario | Usuario | RelaciÃ³n con el usuario farmacÃ©utico |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| detalles | DispensacionDetalle[] | Medicamentos especÃ­ficos entregados en esta transacciÃ³n |

## Modelo: DispensacionDetalle
**Descripción:** Detalle de las unidades entregadas por cada Ã­tem de la receta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| dispensacionId | Int | ID de la transacciÃ³n de dispensaciÃ³n |
| detalleRecetaId | Int | ID del renglÃ³n de la receta original |
| inventarioId | Int | ID del registro de inventario (lote) de donde saliÃ³ el producto |
| cantidad | Int | Cantidad fÃ­sica entregada al paciente |
| dispensacion | Dispensacion | RelaciÃ³n con la cabecera de dispensaciÃ³n |
| detalleReceta | DetalleReceta | RelaciÃ³n con el detalle de la receta |
| inventario | Inventario | RelaciÃ³n con el lote de inventario |

## Modelo: Departamento
**Descripción:** Listado de los 18 departamentos de Honduras

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico (CÃ³digo INE) |
| codigo | String | CÃ³digo alfanumÃ©rico de 2 dÃ­gitos (ej: 01, 08) |
| nombre | String | Nombre oficial del departamento |
| municipios | Municipio[] | Municipios pertenecientes al departamento |
| establecimientos | Establecimiento[] | Establecimientos de salud ubicados en el departamento |
| pacientes | Paciente[] | Pacientes que residen en el departamento |

## Modelo: Municipio
**Descripción:** Listado de los 298 municipios de Honduras

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico (CÃ³digo INE de 4 dÃ­gitos) |
| codigo | String | CÃ³digo alfanumÃ©rico de 4 dÃ­gitos (ej: 0801) |
| nombre | String | Nombre oficial del municipio |
| departamentoId | Int | ID del departamento al que pertenece |
| departamento | Departamento | RelaciÃ³n con el departamento padre |
| establecimientos | Establecimiento[] | Establecimientos de salud ubicados en el municipio |
| pacientes | Paciente[] | Pacientes que residen en el municipio |

## Modelo: AgendaBase
**Descripción:** DefiniciÃ³n de horarios laborales recurrentes de los mÃ©dicos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| medicoId | Int | ID del mÃ©dico dueÃ±o de la agenda |
| establecimientoId | Int | ID del establecimiento donde labora en este horario |
| diaSemana | Int | DÃ­a de la semana (0=Domingo, 1=Lunes, ..., 6=SÃ¡bado) |
| horaInicio | String | Hora de inicio de la jornada (formato HH:mm) |
| horaFin | String | Hora de fin de la jornada (formato HH:mm) |
| activo | Boolean | Indica si este horario estÃ¡ vigente |
| creadoEn | DateTime | Fecha de registro de la agenda |
| actualizadoEn | DateTime | Fecha de Ãºltima modificaciÃ³n de horarios |
| medico | Usuario | RelaciÃ³n con el usuario mÃ©dico |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |

## Modelo: ExcepcionAgenda
**Descripción:** Registro de ausencias o cambios temporales en la disponibilidad mÃ©dica

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| medicoId | Int | ID del mÃ©dico afectado por la excepciÃ³n |
| establecimientoId | Int | ID del establecimiento donde aplica la excepciÃ³n |
| tipo | TipoExcepcion | Motivo de la ausencia (Vacaciones, Incapacidad, etc.) |
| fechaInicio | DateTime | Fecha y hora de inicio de la excepciÃ³n |
| fechaFin | DateTime | Fecha y hora de fin de la excepciÃ³n |
| descripcion | String? | DescripciÃ³n detallada o notas administrativas |
| creadoEn | DateTime | Fecha de registro del evento |
| creadoPorId | Int? | ID del usuario que registrÃ³ la excepciÃ³n |
| medico | Usuario | RelaciÃ³n con el usuario mÃ©dico |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |

## Modelo: CatVacuna
**Descripción:** ClasificaciÃ³n de los motivos de ausencia mÃ©dica PerÃ­odo de descanso anual Descanso obligatorio por exposiciÃ³n a riesgos (ej: Rayos X) Ausencia por eventos de educaciÃ³n mÃ©dica continua Ausencia justificada por enfermedad propia Permiso con o sin goce de sueldo para asuntos personales Otros motivos de ausencia CatÃ¡logo maestro de vacunas autorizadas (Esquema PAI)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| nombre | String | Nombre oficial de la vacuna (ej: BCG, Sabin) |
| descripcion | String? | DescripciÃ³n de la enfermedad que previene |
| tipo | TipoVacuna | Naturaleza biolÃ³gica de la vacuna |
| poblacionMeta | String? | Grupo de edad o condiciÃ³n para la cual estÃ¡ indicada |
| activo | Boolean | Indica si la vacuna estÃ¡ vigente en el esquema nacional |
| creadoEn | DateTime | Fecha de registro en el catÃ¡logo |
| esquemas | EsquemaVacunacion[] | Definiciones de dosis para esta vacuna |
| lotes | LoteVacuna[] | Lotes fÃ­sicos recibidos de esta vacuna |
| registros | VacunacionRegistro[] | Registros histÃ³ricos de aplicaciones |

## Modelo: EsquemaVacunacion
**Descripción:** ClasificaciÃ³n biolÃ³gica de los biolÃ³gicos Virus vivos debilitados Virus muertos o inactivados Bacterias vivas debilitadas Bacterias muertas o inactivadas IngenierÃ­a genÃ©tica (ej: Hepatitis B) TecnologÃ­a de ARN (ej: COVID-19) Basadas en toxinas bacterianas (ej: TÃ©tanos) DefiniciÃ³n de las dosis y tiempos de aplicaciÃ³n por cada vacuna

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| vacunaId | Int | ID de la vacuna asociada |
| numeroDosis | Int | Orden de la dosis (1=Primera, 2=Segunda, 3=Tercera, 4=Refuerzo) |
| edadRecomendadaMeses | Int | Edad ideal del paciente en meses para la dosis |
| intervaloMinimoDias | Int? | Tiempo mÃ­nimo de espera desde la dosis previa |
| descripcion | String? | Notas sobre la aplicaciÃ³n (ej: Dosis Ãºnica) |
| vacuna | CatVacuna | RelaciÃ³n con la vacuna |
| registros | VacunacionRegistro[] | Registros de pacientes que han recibido esta dosis especÃ­fica |

## Modelo: LoteVacuna
**Descripción:** GestiÃ³n de lotes especÃ­ficos de vacunas y su inventario

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| vacunaId | Int | ID de la vacuna |
| codigoLote | String | CÃ³digo alfanumÃ©rico del lote (fabricante) |
| fabricante | String? | Laboratorio productor del biolÃ³gico |
| fechaVencimiento | DateTime | Fecha de caducidad del lote |
| cantidadInicial | Int | Cantidad de dosis recibidas originalmente |
| cantidadActual | Int | Dosis disponibles actualmente |
| establecimientoId | Int | ID del establecimiento custodio del lote |
| activo | Boolean | Indica si el lote puede ser utilizado |
| creadoEn | DateTime | Fecha de registro en el sistema |
| vacuna | CatVacuna | RelaciÃ³n con la vacuna |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| registros | VacunacionRegistro[] | Aplicaciones realizadas con este lote |
| movimientos | MovimientoVacuna[] | Historial de movimientos (ingresos, pÃ©rdidas) del lote |

## Modelo: MovimientoVacuna
**Descripción:** Registro detallado de transacciones fÃ­sicas de biolÃ³gicos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| loteId | Int | ID del lote afectado |
| tipo | TipoMovimientoVacuna | Tipo de transacciÃ³n de inventario |
| cantidad | Int | NÃºmero de dosis (positivo para ingresos, negativo para egresos) |
| motivo | String? | ExplicaciÃ³n del movimiento |
| usuarioId | Int | ID del usuario que registrÃ³ la transacciÃ³n |
| fecha | DateTime | Fecha y hora del registro |
| lote | LoteVacuna | RelaciÃ³n con el lote |
| usuario | Usuario | RelaciÃ³n con el usuario |

## Modelo: VacunacionRegistro
**Descripción:** ClasificaciÃ³n de transacciones especÃ­ficas para vacunas RecepciÃ³n de biolÃ³gicos Traslado a otro establecimiento Uso directo en paciente CorrecciÃ³n genÃ©rica de stock CorrecciÃ³n por sobrantes CorrecciÃ³n por faltantes PÃ©rdida por interrupciÃ³n de refrigeraciÃ³n Accidente fÃ­sico con el vial El biolÃ³gico alcanzÃ³ su fecha lÃ­mite Registro histÃ³rico de la aplicaciÃ³n de una dosis a un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| pacienteId | Int | ID del paciente inmunizado |
| vacunaId | Int | ID de la vacuna aplicada |
| esquemaId | Int? | ID de la dosis dentro del esquema (si aplica) |
| loteId | Int | ID del lote fÃ­sico utilizado |
| fechaAplicacion | DateTime | Fecha y hora de la aplicaciÃ³n |
| sitioAplicacion | String? | Lugar anatÃ³mico (ej: Brazo derecho) |
| viaAplicacion | String? | TÃ©cnica utilizada (ej: Intramuscular) |
| observaciones | String? | Notas sobre reacciones adversas o incidentes |
| establecimientoId | Int | Establecimiento donde se aplicÃ³ |
| aplicadoPorId | Int | Usuario (enfermera/mÃ©dico) que administrÃ³ la dosis |
| paciente | Paciente | RelaciÃ³n con el paciente |
| vacuna | CatVacuna | RelaciÃ³n con la ficha de la vacuna |
| esquema | EsquemaVacunacion? | RelaciÃ³n con la dosis del esquema |
| lote | LoteVacuna | RelaciÃ³n con el lote fÃ­sico |
| establecimiento | Establecimiento | RelaciÃ³n con el establecimiento |
| aplicadoPor | Usuario | RelaciÃ³n con el vacunador |

## Modelo: NotificacionEpidemiologica
**Descripción:** Reporte de enfermedades de vigilancia obligatoria para salud pÃºblica

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador Ãºnico |
| pacienteId | Int | ID del paciente afectado |
| historiaId | Int | ID del encuentro clÃ­nico donde se detectÃ³ |
| diagnosticoCIE10 | String | CÃ³digo CIE-10 de la enfermedad sospechosa/confirmada |
| latitud | Decimal? | Coordenada geogrÃ¡fica (Eje Y) para mapas de calor |
| longitud | Decimal? | Coordenada geogrÃ¡fica (Eje X) para mapas de calor |
| direccionDetallada | String? | Croquis o puntos de referencia del domicilio |
| fechaInicioSintomas | DateTime? | Fecha estimada del primer sÃ­ntoma reportado |
| antecedentesViaje | String? | Historial de desplazamientos recientes del paciente |
| lugaresVisitados | String? | Centros poblados o Ã¡reas visitadas |
| observaciones | String? | InformaciÃ³n epidemiolÃ³gica adicional |
| creadoEn | DateTime | Fecha de creaciÃ³n del reporte |
| creadoPorId | Int? | ID del mÃ©dico que detectÃ³ el caso |
| estado | String | Estado del proceso de investigaciÃ³n (PENDIENTE, NOTIFICADO) |
| gestionadoEn | DateTime? | Fecha de cierre o escalamiento de la investigaciÃ³n |
| gestionadoPorId | Int? | ID del epidemiÃ³logo que validÃ³ el caso |
| paciente | Paciente | RelaciÃ³n con el paciente |
| historia | HistoriaClinica | RelaciÃ³n con la historia clÃ­nica |
| creadoPor | Usuario? | RelaciÃ³n con el capturador inicial |
| gestionadoPor | Usuario? | RelaciÃ³n con el gestor epidemiolÃ³gico |

## Modelo: IngresoHospitalario
**Descripción:** Representa el ingreso de un paciente a una cama del hospital

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente que ingresa |
| camaId | Int | ID de la cama asignada |
| servicioId | Int | ID del servicio que lo admite |
| fechaIngreso | DateTime | Fecha y hora de ingreso |
| motivoIngreso | String | Motivo clínico del ingreso |
| cie10Ingreso | String? | Código CIE-10 presuntivo |
| diagnosticoIngreso | String? | Descripción del diagnóstico presuntivo |
| medicoIngresoId | Int | ID del médico que autoriza el ingreso |
| estado | EstadoHospitalizacion | Estado actual del internamiento |
| creadoEn | DateTime | Fecha de registro en el sistema |
| creadoPorId | Int | ID del usuario que registró el ingreso (admisionista) |
| paciente | Paciente | Relación con el paciente |
| cama | Cama | Relación con la cama |
| servicio | Servicio | Relación con el servicio |
| medicoIngreso | Usuario | Relación con el médico tratante |
| egreso | EgresoHospitalario? | Registro de egreso asociado (si ya se dio de alta) |
| movimientos | MovimientoHospitalario[] | Historial de movimientos de cama durante la estancia |
| notasEvolucion | NotaEvolucion[] | Relación con las notas de evolución |
| kardexMedicamentos | KardexMedicamento[] | Relación con el Kardex de medicamentos |
| controlSignos | ControlSignosVitales[] | Relación con el control de signos vitales de enfermería |

## Modelo: KardexMedicamento
**Descripción:** Registro de administración de medicamentos (Kardex)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int |  |
| ingresoId | Int |  |
| medicamentoId | Int |  |
| dosis | String |  |
| via | String? |  |
| fechaProgramada | DateTime |  |
| fechaAplicacion | DateTime? |  |
| estado | EstadoAdministracion |  |
| observaciones | String? |  |
| enfermeraId | Int |  |
| ingreso | IngresoHospitalario |  |
| medicamento | Medicamento |  |
| enfermera | Usuario |  |

## Modelo: ControlSignosVitales
**Descripción:** Registro frecuente de signos vitales por enfermería

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int |  |
| ingresoId | Int |  |
| fecha | DateTime |  |
| frecuenciaCardiaca | Int? |  |
| frecuenciaRespiratoria | Int? |  |
| presionArterial | String? |  |
| temperatura | Decimal? |  |
| saturacionOxigeno | Int? |  |
| pesoKg | Decimal? |  |
| glucoMetria | Int? |  |
| observaciones | String? |  |
| usuarioId | Int |  |
| ingreso | IngresoHospitalario |  |
| usuario | Usuario |  |

## Modelo: NotaEvolucion
**Descripción:** Registro cronológico del progreso médico de un paciente hospitalizado

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| ingresoId | Int | ID del ingreso hospitalario al que pertenece la nota |
| fecha | DateTime | Fecha y hora de la evaluación |
| nota | String | Relato médico de la evolución |
| frecuenciaCardiaca | Int? |  |
| frecuenciaRespiratoria | Int? |  |
| presionArterial | String? |  |
| temperatura | Decimal? |  |
| saturacionOxigeno | Int? |  |
| medicoId | Int | ID del médico que realiza la nota |
| ingreso | IngresoHospitalario | Relación con el ingreso |
| medico | Usuario | Relación con el médico (Usuario) |

## Modelo: EgresoHospitalario
**Descripción:** Representa el alta o egreso de un paciente hospitalizado

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| ingresoId | Int | ID del ingreso asociado |
| fechaEgreso | DateTime | Fecha y hora de egreso |
| tipoEgreso | TipoEgreso | Tipo de egreso (Alta médica, Traslado, Fallecimiento, Voluntario) |
| condicionEgreso | String | Condición del paciente al egreso |
| cie10Egreso | String? | Código CIE-10 final o de egreso |
| epicrisis | String? | Resumen clínico final (Epicrisis) |
| medicoEgresoId | Int | ID del médico que da el alta |
| ingreso | IngresoHospitalario | Relación con el ingreso |
| medicoEgreso | Usuario | Relación con el médico que firma el alta |

## Modelo: MovimientoHospitalario
**Descripción:** Historial de movimientos de cama de un paciente dentro de una misma hospitalización

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| ingresoId | Int | ID del ingreso hospitalario |
| camaOrigenId | Int | ID de la cama de origen |
| camaDestinoId | Int | ID de la cama de destino |
| fechaMovimiento | DateTime | Fecha y hora del traslado |
| motivo | String? | Motivo del traslado (ej: empeoramiento, paso a cuidados intermedios) |
| usuarioId | Int | ID del usuario que realizó el traslado en el sistema |
| ingreso | IngresoHospitalario | Relación con el ingreso |
| camaOrigen | Cama | Relación con la cama de origen |
| camaDestino | Cama | Relación con la cama de destino |

## Modelo: ImagenLogin
**Descripción:** Representa las imágenes que se muestran en el carrusel de la pantalla de login

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre descriptivo de la imagen |
| titulo | String? | Título opcional que se muestra sobre la imagen |
| descripcion | String? | Descripción opcional que se muestra sobre la imagen |
| mimetype | String | Tipo de contenido (image/jpeg, image/png, etc.) |
| datos | Bytes | Datos binarios de la imagen |
| activo | Boolean | Indica si la imagen está activa para mostrarse |
| orden | Int | Orden de aparición en el carrusel |
| creadoEn | DateTime | Fecha de registro |
| actualizadoEn | DateTime | Fecha de última actualización |

## Modelo: Configuracion
**Descripción:** Sin descripción

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int |  |
| siglasSistema | String |  |
| nombreSistema | String |  |
| logo | Bytes? |  |
| logoMimetype | String? |  |
| actualizadoEn | DateTime |  |

