# Diccionario de Datos (Prisma Schema)

Este documento detalla las entidades y campos definidos en la base de datos del SISS.

## Modelo: Rol
**Descripción:** Representa los roles de usuario en el sistema para control de acceso basado en roles (RBAC)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único autoincremental del rol |
| nombre | String | Nombre único del rol (ej: ADMIN, MEDICO, ENFERMERA) |
| descripcion | String? | Descripción detallada de las funciones del rol |
| permisos | Json | Objeto JSON que define los permisos específicos del rol por módulo |
| usuarios | Usuario[] | Relación con los usuarios que tienen asignado este rol directamente |
| asignaciones | AsignacionUsuario[] | Relación con las asignaciones específicas por establecimiento |

## Modelo: Usuario
**Descripción:** Representa a los usuarios del sistema (personal médico, administrativo y de enfermería)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único autoincremental del usuario |
| numeroEmpleado | String | Número de empleado institucional |
| nombres | String | Nombres del usuario |
| apellidos | String | Apellidos del usuario |
| correo | String | Correo electrónico institucional (usado para login) |
| contrasenaHash | String | Hash de la contraseña del usuario (Bcrypt) |
| telefono | String? | Número de teléfono de contacto |
| especialidadId | Int? | ID de la especialidad primaria del usuario (si aplica) |
| numeroColegiado | String? | Número de colegiación profesional (obligatorio para médicos) |
| activo | Boolean | Indica si el usuario está activo en el sistema |
| requiereCambioContrasena | Boolean | Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión |
| ultimoAcceso | DateTime? | Fecha y hora del último acceso exitoso |
| rolId | Int? | ID del rol principal asignado |
| establecimientoId | Int? | ID del establecimiento base donde labora |
| rol | Rol? | Relación con el modelo de Rol |
| establecimiento | Establecimiento? | Relación con el establecimiento base |
| especialidad | Especialidad? | Relación con la especialidad profesional |
| asignaciones | AsignacionUsuario[] | Historial de asignaciones a diferentes establecimientos y servicios |
| sesiones | Sesion[] | Sesiones activas e históricas del usuario |
| citasMedico | Cita[] | Citas médicas donde el usuario actúa como médico tratante |
| historiales | HistoriaClinica[] | Historias clínicas creadas por este usuario |
| auditLogs | AuditLog[] | Registros de auditoría generados por acciones de este usuario |
| plantillasCreadas | PlantillaFormulario[] | Plantillas de formularios clínicos creadas por el usuario |
| triajes | Triaje[] | Triajes realizados por el usuario (en rol de enfermería) |
| medicamentosCreados | Medicamento[] | Medicamentos registrados por este usuario |
| medicamentosActualizados | Medicamento[] | Medicamentos actualizados por este usuario |
| medicamentosEliminados | Medicamento[] | Medicamentos eliminados lógicamente por este usuario |
| pacientesEliminados | Paciente[] | Pacientes eliminados lógicamente por este usuario |
| citasCreadas | Cita[] | Citas registradas por este usuario |
| citasCanceladas | Cita[] | Citas canceladas por este usuario |
| historiasActualizadas | HistoriaClinica[] | Historias clínicas actualizadas por este usuario |
| historiasEliminadas | HistoriaClinica[] | Historias clínicas eliminadas por este usuario |
| establecimientosCreados | Establecimiento[] | Establecimientos registrados por este usuario |
| establecimientosActualizados | Establecimiento[] | Establecimientos actualizados por este usuario |
| establecimientosEliminados | Establecimiento[] | Establecimientos eliminados por este usuario |
| notificacionesGestionadas | NotificacionEpidemiologica[] | Notificaciones epidemiológicas gestionadas por este usuario |
| especialidadesCreadas | Especialidad[] | Especialidades registradas por este usuario |
| especialidadesActualizadas | Especialidad[] | Especialidades actualizadas por este usuario |
| inventariosCreados | Inventario[] | Inventarios registrados por este usuario |
| inventariosActualizados | Inventario[] | Inventarios actualizados por este usuario |
| inventariosEliminados | Inventario[] | Inventarios eliminados por este usuario |
| dispensaciones | Dispensacion[] | Dispensaciones de medicamentos realizadas por este usuario |
| agendasBase | AgendaBase[] | Configuraciones de agenda base para este médico |
| excepcionesAgenda | ExcepcionAgenda[] | Excepciones a la agenda (vacaciones, permisos) de este médico |
| vacunasAplicadas | VacunacionRegistro[] | Registros de vacunas aplicadas por este usuario |
| movimientosVacunas | MovimientoVacuna[] | Movimientos de inventario de vacunas realizados por este usuario |
| notificacionesCreadas | NotificacionEpidemiologica[] | Notificaciones epidemiológicas creadas por este usuario |
| ingresosAutorizados | IngresoHospitalario[] | Ingresos hospitalarios autorizados por este médico |
| egresosFirmados | EgresoHospitalario[] | Egresos hospitalarios firmados por este médico |
| notasEvolucion | NotaEvolucion[] | Notas de evolución realizadas por el médico |
| kardexMedicamentos | KardexMedicamento[] |  |
| controlSignosVitales | ControlSignosVitales[] |  |
| movimientosInventario | MovimientoInventario[] | Movimientos de inventario realizados por este usuario |

## Modelo: Sesion
**Descripción:** Representa las sesiones de autenticación activas mediante Refresh Tokens

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único de la sesión |
| usuarioId | Int | ID del usuario dueño de la sesión |
| refreshTokenHash | String | Hash del Refresh Token almacenado para validación de seguridad |
| expiresAt | DateTime | Fecha de expiración del token |
| ip | String? | Dirección IP desde la cual se inició la sesión |
| userAgent | String? | User Agent del navegador/dispositivo que inició la sesión |
| creadaEn | DateTime | Fecha y hora de creación de la sesión |
| usuario | Usuario | Relación con el usuario |

## Modelo: Establecimiento
**Descripción:** Representa los centros de salud, hospitales y clínicas de la red de servicios

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único autoincremental |
| codigo | String | Código institucional único (ej: HNT-001) |
| nombre | String | Nombre completo del establecimiento |
| tipo | TipoEstablecimiento | Nivel o tipo de establecimiento (Hospital, Centro de Salud, etc.) |
| departamentoId | Int | ID del departamento geográfico donde se ubica |
| municipioId | Int | ID del municipio donde se ubica |
| telefono | String? | Teléfono de contacto institucional |
| activo | Boolean | Indica si el establecimiento está operativo |
| creadoEn | DateTime | Fecha de registro en el sistema |
| actualizadoEn | DateTime? | Fecha de última actualización de datos |
| eliminadoEn | DateTime? | Fecha de eliminación lógica (si aplica) |
| creadoPorId | Int? | ID del usuario que registró el establecimiento |
| actualizadoPorId | Int? | ID del usuario que realizó la última actualización |
| eliminadoPorId | Int? | ID del usuario que realizó la eliminación lógica |
| departamento | Departamento | Relación con el departamento |
| municipio | Municipio | Relación con el municipio |
| creadoPor | Usuario? | Relación con el usuario creador |
| actualizadoPor | Usuario? | Relación con el usuario actualizador |
| eliminadoPor | Usuario? | Relación con el usuario eliminador |
| usuarios | Usuario[] | Usuarios asociados a este establecimiento |
| pacientes | Paciente[] | Pacientes registrados en este establecimiento |
| citas | Cita[] | Citas programadas en este establecimiento |
| inventarios | Inventario[] | Inventarios de farmacia de este establecimiento |
| laboratorios | ExamenEstablecimiento[] | Exámenes de laboratorio disponibles en este establecimiento |
| radiologia | EstudioRadiologicoEstablecimiento[] | Estudios de radiología disponibles en este establecimiento |
| solicitudesLab | SolicitudLaboratorio[] | Solicitudes de laboratorio realizadas desde/hacia este establecimiento |
| solicitudesRad | SolicitudRadiologia[] | Solicitudes de radiología realizadas desde/hacia este establecimiento |
| servicios | Servicio[] | Servicios (unidades funcionales) habilitados en este establecimiento |
| referidosOrigen | Referido[] | Referencias emitidas por este establecimiento |
| referidosDestino | Referido[] | Referencias recibidas por este establecimiento |
| asignaciones | AsignacionUsuario[] | Personal asignado a este establecimiento |
| recetas | Receta[] | Recetas emitidas en este establecimiento |
| dispensaciones | Dispensacion[] | Dispensaciones realizadas en la farmacia de este establecimiento |
| agendasBase | AgendaBase[] | Configuraciones de agenda base en este establecimiento |
| excepcionesAgenda | ExcepcionAgenda[] | Excepciones temporales a la agenda en este establecimiento |
| lotesVacunas | LoteVacuna[] | Lotes de vacunas almacenados en este establecimiento |
| registrosVacunas | VacunacionRegistro[] | Registros de vacunación aplicados en este establecimiento |

## Modelo: CatServicio
**Descripción:** Clasificación oficial de establecimientos de salud en Honduras Hospital de referencia nacional Hospital departamental o regional Centro de salud con atención médica Clínica de atención de emergencias periférica Centro de Salud con Médico y Odontólogo Centro de Salud Rural Catálogo maestro de servicios o unidades funcionales (ej: Emergencias, Farmacia)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre único del servicio |
| descripcion | String? | Descripción de las funciones del servicio |
| activo | Boolean | Indica si el servicio está activo para ser asignado |
| servicios | Servicio[] | Relación con las instancias de este servicio en diferentes establecimientos |

## Modelo: ReporteDisponible
**Descripción:** Registro de reportes analíticos disponibles en la plataforma

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre legible del reporte |
| descripcion | String? | Descripción de la utilidad y datos que contiene |
| categoria | String | Categoría para agrupación en la UI (MEDICA, FARMACIA, etc.) |
| slug | String | Identificador interno para la lógica de generación |
| tipo | String | Formato de salida (EXCEL, PDF) |
| permiso | String | Permiso granular requerido para acceder a este reporte |
| icono | String? | Nombre del icono decorativo en la UI |
| activo | Boolean | Indica si el reporte está disponible actualmente |
| orden | Int | Orden de aparición en el listado |

## Modelo: Servicio
**Descripción:** Representa la habilitación de un servicio del catálogo en un establecimiento específico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| activo | Boolean | Indica si el servicio está operativo en este establecimiento |
| establecimientoId | Int | ID del establecimiento |
| catServicioId | Int | ID del servicio del catálogo |
| establecimiento | Establecimiento | Relación con el establecimiento |
| catServicio | CatServicio | Relación con el catálogo de servicios |
| asignaciones | AsignacionUsuario[] | Personal asignado específicamente a esta unidad funcional |
| salas | Sala[] | Salas o pabellones pertenecientes a este servicio |
| ingresos | IngresoHospitalario[] | Ingresos hospitalarios admitidos en este servicio |

## Modelo: CatTipoHabitacion
**Descripción:** Catálogo maestro de tipos de habitaciones (ej: Privada, Bipersonal, Sala Común)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre del tipo de habitación |
| descripcion | String? | Descripción de las características |
| habitaciones | Habitacion[] | Habitaciones de este tipo |

## Modelo: CatTipoCama
**Descripción:** Catálogo maestro de tipos de camas (ej: Cama Eléctrica, Camilla, Cuna, Incubadora)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre del tipo de cama |
| descripcion | String? | Descripción técnica |
| camas | Cama[] | Camas de este tipo |

## Modelo: Sala
**Descripción:** Representa una sala o pabellón dentro de un servicio médico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre descriptivo (ej: Sala de Hombres) |
| codigo | String? | Código interno de la sala |
| activo | Boolean | Indica si la sala está activa |
| servicioId | Int | ID del servicio al que pertenece |
| servicio | Servicio | Relación con el servicio |
| habitaciones | Habitacion[] | Habitaciones contenidas en la sala |

## Modelo: Habitacion
**Descripción:** Representa una habitación o pieza física dentro de una sala

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| numero | String | Número o nombre de la habitación (ej: 101, A-1) |
| activo | Boolean | Indica si la habitación está operativa |
| salaId | Int | ID de la sala a la que pertenece |
| sala | Sala | Relación con la sala |
| tipoHabitacionId | Int | ID del tipo de habitación |
| tipoHabitacion | CatTipoHabitacion | Relación con el catálogo de tipos de habitación |
| camas | Cama[] | Camas disponibles en esta habitación |

## Modelo: Cama
**Descripción:** Representa la unidad funcional final de hospitalización

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| codigo | String | Código único de identificación de la cama |
| estado | EstadoCama | Estado actual de la cama |
| activo | Boolean | Indica si la cama está activa físicamente |
| habitacionId | Int | ID de la habitación a la que pertenece |
| habitacion | Habitacion | Relación con la habitación |
| tipoCamaId | Int | ID del tipo de cama |
| tipoCama | CatTipoCama | Relación con el catálogo de tipos de cama |
| ingresos | IngresoHospitalario[] | Ingresos hospitalarios asociados a esta cama |
| movimientosOrigen | MovimientoHospitalario[] | Movimientos donde esta cama fue el origen |
| movimientosDestino | MovimientoHospitalario[] | Movimientos donde esta cama fue el destino |

## Modelo: AsignacionUsuario
**Descripción:** Estados operativos posibles de una cama Lista para recibir paciente Con paciente asignado Apartada para un ingreso próximo Fuera de servicio por desperfecto En proceso de desinfección/limpieza Permite la gestión de personal en múltiples establecimientos y servicios con roles diferenciados

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| usuarioId | Int | ID del usuario asignado |
| establecimientoId | Int | ID del establecimiento de la asignación |
| servicioId | Int? | ID del servicio (opcional) si la asignación es a una unidad funcional específica |
| rolId | Int? | ID del rol (opcional) si el usuario tiene un rol distinto en este establecimiento |
| especialidadId | Int? | ID de la especialidad (opcional) si ejerce una especialidad distinta aquí |
| activo | Boolean | Indica si la asignación está vigente |
| permisos | Json? | Sobrescritura opcional de permisos específicos para esta asignación |
| creadoEn | DateTime | Fecha de creación de la asignación |
| actualizadoEn | DateTime | Fecha de última modificación |
| usuario | Usuario | Relación con el usuario |
| establecimiento | Establecimiento | Relación con el establecimiento |
| servicio | Servicio? | Relación con el servicio específico |
| rol | Rol? | Relación con el rol específico |
| especialidad | Especialidad? | Relación con la especialidad específica |

## Modelo: Especialidad
**Descripción:** Catálogo de especialidades médicas (ej: Pediatría, Ginecología)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| codigo | String | Código abreviado de la especialidad (ej: PED, GIN) |
| nombre | String | Nombre completo de la especialidad |
| descripcion | String? | Breve descripción del alcance de la especialidad |
| activa | Boolean | Indica si la especialidad está activa para nuevas asignaciones |
| creadoEn | DateTime | Fecha de registro |
| actualizadoEn | DateTime? | Fecha de última actualización |
| creadoPorId | Int? | ID del usuario que registró la especialidad |
| actualizadoPorId | Int? | ID del usuario que realizó la última actualización |
| creadoPor | Usuario? | Relación con el usuario creador |
| actualizadoPor | Usuario? | Relación con el usuario actualizador |
| plantillas | PlantillaFormulario[] | Plantillas de formularios clínicos asociadas a esta especialidad |
| usuarios | Usuario[] | Usuarios (médicos) que tienen esta especialidad como primaria |
| asignaciones | AsignacionUsuario[] | Asignaciones de personal donde se ejerce esta especialidad |
| citas | Cita[] | Citas médicas programadas para esta especialidad |

## Modelo: Paciente
**Descripción:** Registro central de datos personales y demográficos de los pacientes

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único autoincremental |
| numeroExpediente | String | Número de expediente único generado por el sistema |
| dni | String | Documento Nacional de Identificación (Honduras) |
| nombres | String | Nombres del paciente |
| apellidos | String | Apellidos del paciente |
| fechaNacimiento | DateTime | Fecha de nacimiento |
| sexoId | Int | ID del catálogo de sexos |
| tipoSangreId | Int? | ID del catálogo de tipos de sangre |
| telefono | String? | Teléfono de contacto |
| telefonoEmergencia | String? | Teléfono de contacto para emergencias |
| correo | String? | Correo electrónico (opcional) |
| direccion | String? | Dirección de domicilio detallada |
| departamentoId | Int | ID del departamento de domicilio |
| municipioId | Int | ID del municipio de domicilio |
| comunidad | String? | Nombre de la comunidad, barrio o colonia |
| escolaridadId | Int? | ID del catálogo de escolaridad |
| ocupacionId | Int? | ID del catálogo de ocupaciones |
| estadoCivilId | Int? | ID del catálogo de estado civil |
| activo | Boolean | Indica si el paciente está activo para atención |
| fechaRegistro | DateTime | Fecha de registro inicial en el sistema |
| actualizadoEn | DateTime? | Fecha de última actualización de datos demográficos |
| eliminadoEn | DateTime? | Fecha de eliminación lógica |
| establecimientoId | Int | ID del establecimiento donde se registró el paciente |
| creadoPorId | Int | ID del usuario que registró al paciente |
| actualizadoPorId | Int? | ID del usuario que realizó la última actualización |
| eliminadoPorId | Int? | ID del usuario que realizó la eliminación lógica |
| establecimiento | Establecimiento | Relación con el establecimiento de registro |
| departamento | Departamento | Relación con el departamento |
| municipio | Municipio | Relación con el municipio |
| sexo | Sexo | Relación con el catálogo de sexos |
| tipoSangre | TipoSangre? | Relación con el catálogo de tipos de sangre |
| escolaridad | Escolaridad? | Relación con el catálogo de escolaridad |
| ocupacion | Ocupacion? | Relación con el catálogo de ocupaciones |
| estadoCivil | EstadoCivil? | Relación con el catálogo de estado civil |
| eliminadoPor | Usuario? | Relación con el usuario que eliminó el registro |
| alergias | Alergia[] | Historial de alergias del paciente |
| citas | Cita[] | Historial de citas médicas |
| historialClinico | HistoriaClinica[] | Historial de atenciones (Historia Clínica) |
| medicamentosActivos | PacienteMedicamento[] | Listado de medicamentos de uso crónico o actual |
| triajes | Triaje[] | Historial de triajes realizados |
| recetas | Receta[] | Historial de recetas emitidas |
| solicitudesLab | SolicitudLaboratorio[] | Solicitudes de laboratorio realizadas |
| solicitudesRad | SolicitudRadiologia[] | Solicitudes de radiología realizadas |
| vacunas | VacunacionRegistro[] | Historial de vacunación PAI |
| notificacionesEpidemiologicas | NotificacionEpidemiologica[] | Notificaciones epidemiológicas asociadas al paciente |
| ingresos | IngresoHospitalario[] | Historial de internamientos hospitalarios |

## Modelo: Sexo
**Descripción:** Catálogo de sexos para registro demográfico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre del sexo (Masculino, Femenino) |
| pacientes | Paciente[] | Pacientes asociados a este sexo |

## Modelo: TipoSangre
**Descripción:** Catálogo de tipos de sangre y factor RH

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre del tipo de sangre (ej: O+, A-) |
| pacientes | Paciente[] | Pacientes asociados a este tipo de sangre |

## Modelo: Escolaridad
**Descripción:** Catálogo de niveles de escolaridad alcanzados

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre del nivel (ej: Primaria, Universitaria) |
| pacientes | Paciente[] | Pacientes con este nivel de escolaridad |

## Modelo: EstadoCivil
**Descripción:** Catálogo de estados civiles

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre del estado (ej: Soltero, Casado) |
| pacientes | Paciente[] | Pacientes con este estado civil |

## Modelo: Ocupacion
**Descripción:** Catálogo de ocupaciones o profesiones

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre de la ocupación |
| pacientes | Paciente[] | Pacientes que ejercen esta ocupación |

## Modelo: Alergia
**Descripción:** Registro de alergias conocidas de un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente afectado |
| tipo | TipoAlergia | Categoría de la alergia (Medicamento, Alimento, etc.) |
| descripcion | String | Descripción de la sustancia y reacción |
| severidad | Severidad | Grado de peligrosidad de la alergia |
| paciente | Paciente | Relación con el paciente |

## Modelo: Cita
**Descripción:** Clasificación del tipo de alérgeno Reacción a fármacos Reacción a comidas Reacción a factores del entorno Reacción específica al látex Otros tipos de alergias Escala de severidad de la reacción alérgica Reacción leve, no compromete la vida Reacción que requiere tratamiento médico moderado Reacción anafiláctica o de alto riesgo Gestión de citas médicas y programación de consultas

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente que solicita la cita |
| medicoId | Int | ID del médico asignado (opcional si es urgencia) |
| establecimientoId | Int | ID del establecimiento donde se realizará la cita |
| fechaHora | DateTime | Fecha y hora programada para la atención |
| duracionMinutos | Int | Tiempo estimado de duración del encuentro médico |
| tipo | TipoCita | Tipo de atención solicitada |
| estado | EstadoCita | Estado actual de la cita (Programada, Atendida, etc.) |
| motivo | String? | Motivo breve de la consulta |
| notas | String? | Observaciones adicionales |
| creadaEn | DateTime | Fecha de registro de la cita |
| creadoPorId | Int? | ID del usuario (recepcionista) que registró la cita |
| canceladoPorId | Int? | ID del usuario que canceló la cita (si aplica) |
| especialidadId | Int? | ID de la especialidad bajo la cual se atiende la cita |
| paciente | Paciente | Relación con el paciente |
| medico | Usuario | Relación con el médico tratante |
| establecimiento | Establecimiento | Relación con el establecimiento |
| creadoPor | Usuario? | Relación con el usuario creador |
| canceladoPor | Usuario? | Relación con el usuario que canceló |
| especialidad | Especialidad? | Relación con la especialidad |
| historia | HistoriaClinica? | Historia clínica resultante de esta cita |
| triaje | Triaje? | Datos de triaje previo a la consulta |
| historiaOrigen | HistoriaClinica? | Relación con la atención previa que originó esta cita (si fue una re-cita) |

## Modelo: HistoriaClinica
**Descripción:** Clasificación del tipo de encuentro médico Consulta médica general Consulta con médico especialista Cita de seguimiento o control Atención inmediata por urgencia Cita para aplicación de vacunas Consulta de salud reproductiva Estados posibles en el ciclo de vida de una cita Cita registrada pero pendiente de confirmación/llegada El paciente ha confirmado su asistencia El encuentro médico ha concluido exitosamente La cita ha sido anulada por el paciente o el centro El paciente no se presentó a su cita programada El paciente está presente en el establecimiento esperando atención Representa el encuentro clínico (consulta) y el registro médico del paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente atendido |
| medicoId | Int | ID del médico tratante |
| citaId | Int? | ID de la cita asociada |
| plantillaId | Int? | ID de la plantilla de formulario utilizada |
| fecha | DateTime | Fecha y hora de la atención |
| subjetivo | String | [S]ubjetivo: Motivo de consulta, síntomas y anamnesis |
| objetivo | String | [O]bjetivo: Hallazgos del examen físico |
| analisis | String | [A]nálisis: Razonamiento médico y diagnósticos presuntivos |
| plan | String | [P]lan: Tratamiento, medicamentos, exámenes y recomendaciones |
| presionSistolica | Int? | Tensión arterial sistólica (mmHg) |
| presionDiastolica | Int? | Tensión arterial diastólica (mmHg) |
| frecuenciaCardiaca | Int? | Latidos por minuto |
| temperatura | Decimal? | Temperatura corporal (Â°C) |
| peso | Decimal? | Peso del paciente (kg) |
| talla | Decimal? | Estatura del paciente (cm) |
| saturacionO2 | Int? | Porcentaje de saturación de oxígeno |
| semanaEpidemiologica | Int? | Número de semana epidemiológica (1-52) |
| actualizadoEn | DateTime? | Fecha de la última modificación |
| eliminadoEn | DateTime? | Fecha de eliminación lógica |
| actualizadoPorId | Int? | ID del usuario que actualizó el registro |
| eliminadoPorId | Int? | ID del usuario que eliminó el registro |
| paciente | Paciente | Relación con el paciente |
| medico | Usuario | Relación con el médico |
| actualizadoPor | Usuario? | Relación con el usuario actualizador |
| eliminadoPor | Usuario? | Relación con el usuario eliminador |
| cita | Cita? | Relación con la cita |
| plantilla | PlantillaFormulario? | Relación con la plantilla de formulario |
| proximaCitaId | Int? | ID de la próxima cita programada |
| proximaCita | Cita? | Relación con la próxima cita |
| diagnosticos | Diagnostico[] | Listado de diagnósticos realizados en la consulta |
| recetas | Receta[] | Recetas emitidas |
| referidos | Referido[] | Referencias emitidas |
| resultadosLab | ResultadoLaboratorio[] | Resultados de laboratorio asociados |
| solicitudesLab | SolicitudLaboratorio[] | Solicitudes de laboratorio generadas |
| solicitudesRad | SolicitudRadiologia[] | Solicitudes de radiología generadas |
| respuestaFormulario | RespuestaFormulario? | Respuestas detalladas del formulario dinámico |
| incapacidades | Incapacidad[] | Registro de incapacidades (si aplica) |
| notificacionEpidemiologica | NotificacionEpidemiologica? | Notificación epidemiológica obligatoria |

## Modelo: Diagnostico
**Descripción:** Diagnósticos asociados a una atención médica (basados en CIE-10)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica asociada |
| codigoCIE10 | String | Código alfanumérico CIE-10 |
| descripcion | String | Descripción del diagnóstico según catálogo |
| tipo | TipoDiagnostico | Importancia del diagnóstico (Principal, Secundario) |
| historia | HistoriaClinica | Relación con la historia clínica |

## Modelo: Incapacidad
**Descripción:** Clasificación de la relevancia del diagnóstico Causa principal de la consulta Patologías adicionales detectadas Enfermedades preexistentes relevantes Registro de incapacidades médicas otorgadas al paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica asociada |
| fechaInicio | DateTime | Fecha de inicio del reposo |
| fechaFin | DateTime | Fecha de finalización del reposo |
| dias | Int | Total de días de incapacidad |
| tipo | TipoIncapacidad | Ãmbito de la incapacidad (Laboral, Escolar) |
| motivo | String | Descripción de la justificación médica |
| historia | HistoriaClinica | Relación con la historia clínica |

## Modelo: Medicamento
**Descripción:** Tipo de justificación de ausencia Reposo para trabajadores Justificación para estudiantes Recomendación para atletas Catálogo maestro de medicamentos y productos farmacéuticos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| codigo | String | Código de barras o SKU del medicamento |
| nombreGenerico | String | Denominación Común Internacional (DCI) |
| nombreComercial | String? | Nombre bajo el cual se comercializa (opcional) |
| presentacion | String | Forma farmacéutica (ej: Tabletas, Jarabe) |
| concentracion | String | Cantidad de principio activo (ej: 500mg) |
| via | ViaAdministracion | Método de ingreso al organismo |
| grupoTerapeutico | String | Clasificación terapéutica (ej: Antibióticos) |
| requiereReceta | Boolean | Indica si requiere autorización médica para dispensar |
| esControlado | Boolean | Indica si el medicamento es psicotrópico o estupefaciente |
| activo | Boolean | Indica si el medicamento está disponible en el catálogo |
| creadoEn | DateTime | Fecha de registro inicial |
| actualizadoEn | DateTime? | Fecha de última actualización de ficha técnica |
| eliminadoEn | DateTime? | Fecha de eliminación lógica |
| creadoPorId | Int? | ID del usuario que registró el medicamento |
| actualizadoPorId | Int? | ID del usuario que realizó la última actualización |
| eliminadoPorId | Int? | ID del usuario que realizó la eliminación lógica |
| creadoPor | Usuario? | Relación con el usuario creador |
| actualizadoPor | Usuario? | Relación con el usuario actualizador |
| eliminadoPor | Usuario? | Relación con el usuario eliminador |
| inventario | Inventario[] | Existencias de este medicamento en distintos establecimientos |
| detallesReceta | DetalleReceta[] | Apariciones de este medicamento en recetas emitidas |
| kardexMedicamentos | KardexMedicamento[] |  |

## Modelo: Inventario
**Descripción:** Listado de vías de administración de medicamentos Ingestión por la boca Administración mediante jeringas (IM, IV, SC) Aplicación sobre la piel Administración por vías respiratorias Debajo de la lengua Introducción por el recto Aplicación en los ojos Aplicación en los oídos Control de existencias físicas de medicamentos por establecimiento y lote

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| medicamentoId | Int | ID del medicamento asociado |
| establecimientoId | Int | ID del establecimiento que posee el stock |
| cantidadActual | Int | Cantidad disponible actualmente para dispensar |
| cantidadMinima | Int | Nivel mínimo antes de generar alertas de reabastecimiento |
| lote | String? | Código del lote de fabricación para trazabilidad |
| fechaVencimiento | DateTime? | Fecha de expiración del lote |
| ubicacion | String? | Ubicación física dentro de la bodega/farmacia |
| activo | Boolean | Indica si este stock está disponible para uso |
| creadoEn | DateTime | Fecha de registro del ingreso inicial |
| actualizadoEn | DateTime? | Fecha de último movimiento o ajuste |
| eliminadoEn | DateTime? | Fecha de eliminación (si aplica) |
| creadoPorId | Int? | ID del usuario que registró el ingreso |
| actualizadoPorId | Int? | ID del usuario que realizó la última modificación |
| eliminadoPorId | Int? | ID del usuario que eliminó el registro |
| medicamento | Medicamento | Relación con la ficha del medicamento |
| establecimiento | Establecimiento | Relación con el establecimiento de salud |
| creadoPor | Usuario? | Relación con el usuario creador |
| actualizadoPor | Usuario? | Relación con el usuario actualizador |
| eliminadoPor | Usuario? | Relación con el usuario eliminador |
| movimientos | MovimientoInventario[] | Historial de entradas y salidas asociadas a este inventario |
| dispensaciones | DispensacionDetalle[] | Detalles de dispensaciones realizadas desde este stock |

## Modelo: MovimientoInventario
**Descripción:** Registro histórico de transacciones que afectan el stock de medicamentos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| inventarioId | Int | ID del registro de inventario afectado |
| tipo | TipoMovimiento | Tipo de transacción (Entrada, Salida, etc.) |
| cantidad | Int | Cantidad de unidades involucradas en el movimiento |
| motivo | String? | Explicación del porqué del movimiento |
| usuarioId | Int | ID del usuario que realizó la transacción |
| fecha | DateTime | Fecha y hora del registro |
| inventario | Inventario | Relación con el inventario |
| usuario | Usuario | Relación con el usuario que realizó el movimiento |

## Modelo: Receta
**Descripción:** Clasificación de transacciones de inventario Ingreso de nuevo stock por compras o donaciones Salida por traslados o suministros internos Correcciones manuales por inventario físico Eliminación por fecha de vencimiento alcanzada Salida por daño, robo o extravío Entrega directa al paciente mediante receta Documento de prescripción médica para un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica donde se originó la receta |
| pacienteId | Int | ID del paciente beneficiario |
| establecimientoId | Int | ID del establecimiento donde se emitió |
| estado | EstadoReceta | Estado actual del flujo de dispensación |
| creadaEn | DateTime | Fecha de emisión |
| dispensadaEn | DateTime? | Fecha en la que se completó la entrega total |
| historia | HistoriaClinica | Relación con la historia clínica |
| paciente | Paciente | Relación con el paciente |
| establecimiento | Establecimiento | Relación con el establecimiento |
| detalles | DetalleReceta[] | Listado de medicamentos prescritos |
| dispensaciones | Dispensacion[] | Historial de entregas asociadas a esta receta |

## Modelo: DetalleReceta
**Descripción:** Ciclo de vida de una receta médica Receta emitida pero aún no presentada en farmacia Se han entregado todos los medicamentos prescritos Se han entregado solo algunos medicamentos o cantidades Receta anulada por el médico No se pudo dispensar por falta de existencias (stock agotado) Especificación de un medicamento individual dentro de una receta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| recetaId | Int | ID de la receta a la que pertenece |
| medicamentoId | Int | ID del medicamento prescrito |
| dosis | String | Cantidad y unidad por toma (ej: 1 tableta) |
| frecuencia | String | Intervalo de tiempo (ej: Cada 8 horas) |
| duracion | String | Tiempo total de tratamiento (ej: 7 días) |
| cantidad | Int | Cantidad total de unidades a dispensar |
| cantidadEntregada | Int | Acumulado de unidades ya entregadas |
| ultimaDispensacion | DateTime? | Fecha del último despacho parcial |
| indicaciones | String? | Consejos adicionales para el paciente |
| receta | Receta | Relación con la receta cabecera |
| medicamento | Medicamento | Relación con la ficha del medicamento |
| dispensaciones | DispensacionDetalle[] | Relación con los despachos físicos realizados |

## Modelo: PacienteMedicamento
**Descripción:** Historial de medicación activa (tratamientos crónicos) de un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente |
| medicamentoId | Int | ID del medicamento |
| dosis | String | Dosis del tratamiento |
| frecuencia | String | Frecuencia de administración |
| inicio | DateTime | Fecha de inicio del tratamiento |
| fin | DateTime? | Fecha estimada de finalización (null si es permanente) |
| paciente | Paciente | Relación con el paciente |

## Modelo: CatExamenLaboratorio
**Descripción:** Catálogo maestro de exámenes de laboratorio clínico disponibles

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| codigo | String | Código interno único del examen |
| nombre | String | Nombre descriptivo del examen |
| categoria | String | Ãrea del laboratorio (ej: Hematología, Química) |
| indicaciones | String? | Requisitos para el paciente (ej: Ayuno 8h) |
| activo | Boolean | Indica si el examen está disponible en el catálogo general |
| establecimientos | ExamenEstablecimiento[] | Establecimientos que ofrecen este examen |
| detallesSolicitud | DetalleSolicitudLaboratorio[] | Solicitudes que incluyen este examen |

## Modelo: ExamenEstablecimiento
**Descripción:** Tabla asociativa de exámenes habilitados por cada establecimiento

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| establecimientoId | Int | ID del establecimiento |
| examenId | Int | ID del examen del catálogo |
| establecimiento | Establecimiento | Relación con el establecimiento |
| examen | CatExamenLaboratorio | Relación con el catálogo de exámenes |

## Modelo: SolicitudLaboratorio
**Descripción:** Orden de laboratorio clínico emitida durante una consulta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica origen |
| pacienteId | Int | ID del paciente |
| establecimientoId | Int | ID del establecimiento donde se procesará |
| estado | EstadoLab | Estado actual del flujo de laboratorio |
| urgente | Boolean | Prioridad de procesamiento |
| observaciones | String? | Notas médicas adicionales para el laboratorista |
| creadaEn | DateTime | Fecha de emisión de la orden |
| historia | HistoriaClinica | Relación con la historia clínica |
| paciente | Paciente | Relación con el paciente |
| establecimiento | Establecimiento | Relación con el establecimiento |
| detalles | DetalleSolicitudLaboratorio[] | Listado de exámenes específicos solicitados |
| resultados | ResultadoLaboratorio[] | Resultados cargados para esta solicitud |

## Modelo: DetalleSolicitudLaboratorio
**Descripción:** Detalle de cada examen incluido en una orden de laboratorio

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| solicitudId | Int | ID de la solicitud cabecera |
| examenId | Int | ID del examen específico |
| observaciones | String? | Observaciones específicas para este examen |
| solicitud | SolicitudLaboratorio | Relación con la solicitud |
| examen | CatExamenLaboratorio | Relación con el catálogo de exámenes |

## Modelo: ResultadoLaboratorio
**Descripción:** Estados del flujo de trabajo del laboratorio Orden emitida por el médico Muestras tomadas o en análisis Resultados validados y disponibles Orden anulada Registro de resultados numéricos o cualitativos de exámenes de laboratorio

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| solicitudId | Int | ID de la solicitud a la que pertenece el resultado |
| historiaId | Int? | ID opcional de la historia clínica para vinculación directa |
| prueba | String | Nombre del parámetro o prueba analizada |
| valor | String | Resultado obtenido |
| unidad | String? | Unidad de medida (ej: mg/dL, %) |
| valorReferencia | String? | Rango esperado para un paciente sano |
| anormal | Boolean | Indica si el valor está fuera de los rangos normales |
| observaciones | String? | Interpretación del microbiólogo o analista |
| fecha | DateTime | Fecha y hora de validación del resultado |
| solicitud | SolicitudLaboratorio | Relación con la solicitud cabecera |
| historia | HistoriaClinica? | Relación con la historia clínica |

## Modelo: CatExamenRadiologico
**Descripción:** Catálogo maestro de estudios radiológicos e imagenología

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| codigo | String | Código interno único (ej: RX-01, TAC-05) |
| nombre | String | Nombre del estudio (ej: Rayos X de Tórax) |
| categoria | String | Modalidad de imagen (RX, ECO, TAC, RM, etc.) |
| indicaciones | String? | Requisitos técnicos o del paciente |
| activo | Boolean | Indica si el estudio está disponible en el catálogo |
| establecimientos | EstudioRadiologicoEstablecimiento[] | Establecimientos que cuentan con el equipo para este estudio |
| detallesSolicitud | DetalleSolicitudRadiologia[] | Solicitudes que incluyen este estudio |

## Modelo: EstudioRadiologicoEstablecimiento
**Descripción:** Tabla asociativa de estudios de imagen habilitados por establecimiento

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| establecimientoId | Int | ID del establecimiento |
| estudioId | Int | ID del estudio del catálogo |
| establecimiento | Establecimiento | Relación con el establecimiento |
| estudio | CatExamenRadiologico | Relación con el catálogo de radiología |

## Modelo: SolicitudRadiologia
**Descripción:** Orden de estudios de imagenología emitida por un médico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica origen |
| pacienteId | Int | ID del paciente |
| establecimientoId | Int | ID del establecimiento de destino |
| estado | EstadoLab | Estado del flujo (Solicitado, Completado) |
| urgente | Boolean | Prioridad de atención |
| observaciones | String? | Justificación clínica del estudio |
| creadaEn | DateTime | Fecha de emisión de la orden |
| historia | HistoriaClinica | Relación con la historia clínica |
| paciente | Paciente | Relación con el paciente |
| establecimiento | Establecimiento | Relación con el establecimiento |
| detalles | DetalleSolicitudRadiologia[] | Listado de estudios específicos requeridos |
| resultados | ResultadoRadiologia[] | Interpretaciones de los resultados |

## Modelo: DetalleSolicitudRadiologia
**Descripción:** Detalle de cada estudio individual en una orden de radiología

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| solicitudId | Int | ID de la solicitud cabecera |
| estudioId | Int | ID del estudio específico |
| observaciones | String? | Observaciones o sospechas diagnósticas para el radiólogo |
| solicitud | SolicitudRadiologia | Relación con la solicitud |
| estudio | CatExamenRadiologico | Relación con el catálogo de estudios |

## Modelo: ResultadoRadiologia
**Descripción:** Registro de la interpretación médica de un estudio de imagen

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| solicitudId | Int | ID de la solicitud a la que pertenece el informe |
| hallazgos | String? | Descripción detallada de lo observado en la imagen |
| conclusion | String? | Diagnóstico radiológico final |
| imageUrl | String? | Enlace al visor PACS o almacenamiento de la imagen digital |
| fecha | DateTime | Fecha y hora del informe |
| solicitud | SolicitudRadiologia | Relación con la solicitud cabecera |

## Modelo: Referido
**Descripción:** Gestión de referencias de pacientes entre establecimientos de la red

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica donde se origina el referido |
| establecimientoOrigenId | Int | Establecimiento que envía al paciente |
| establecimientoDestinoId | Int | Establecimiento que recibirá al paciente |
| especialidadDestino | String | Especialidad a la que se remite |
| motivo | String | Justificación clínica del traslado |
| urgente | Boolean | Prioridad de la referencia |
| estado | EstadoReferido | Estado del trámite administrativo |
| creadoEn | DateTime | Fecha de emisión |
| historia | HistoriaClinica | Relación con la historia clínica |
| origen | Establecimiento | Relación con el centro de origen |
| destino | Establecimiento | Relación con el centro de destino |

## Modelo: PlantillaFormulario
**Descripción:** Estados del proceso de referencia y contrarreferencia Referencia emitida por el médico Referencia aceptada por el centro de destino El paciente ya fue evaluado en el centro de destino Referencia no aceptada por el centro de destino Definición de formularios clínicos dinámicos por especialidad

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| especialidadId | Int | ID de la especialidad a la que pertenece el formulario |
| nombre | String | Nombre descriptivo del formulario (ej: Control Prenatal) |
| descripcion | String? | Propósito del formulario |
| version | Int | Número de versión para control de cambios |
| activa | Boolean | Indica si es la versión que se muestra actualmente |
| creadoPorId | Int | ID del usuario que diseñó la plantilla |
| creadoEn | DateTime | Fecha de creación |
| actualizadoEn | DateTime | Fecha de última modificación |
| especialidad | Especialidad | Relación con la especialidad |
| creadoPor | Usuario | Relación con el usuario diseñador |
| secciones | SeccionFormulario[] | Secciones que componen el formulario |
| historiales | HistoriaClinica[] | Historias clínicas que han utilizado esta plantilla |
| respuestas | RespuestaFormulario[] | Datos capturados mediante esta plantilla |

## Modelo: SeccionFormulario
**Descripción:** Agrupador de campos dentro de un formulario dinámico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| plantillaId | Int | ID de la plantilla padre |
| nombre | String | Título de la sección |
| descripcion | String? | Texto de ayuda para la sección |
| orden | Int | Posición relativa en el formulario |
| colapsable | Boolean | Indica si la sección se puede contraer en la UI |
| visible | Boolean | Indica si la sección se muestra por defecto |
| plantilla | PlantillaFormulario | Relación con la plantilla |
| campos | CampoFormulario[] | Campos contenidos en esta sección |

## Modelo: CampoFormulario
**Descripción:** Definición de un campo individual de captura de datos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| seccionId | Int | ID de la sección contenedora |
| tipo | TipoCampo | Tipo de control de entrada (Texto, Número, etc.) |
| etiqueta | String | Texto que ve el usuario (Label) |
| clave | String | Nombre técnico del campo para almacenamiento |
| placeholder | String? | Texto sugerido dentro del campo |
| ayuda | String? | Texto de ayuda u orientación médica |
| requerido | Boolean | Indica si el campo es obligatorio |
| orden | Int | Posición dentro de la sección |
| ancho | AnchoCampo | Porcentaje de ancho que ocupa en la pantalla |
| visible | Boolean | Indica si el campo es visible inicialmente |
| configuracion | Json? | Objeto JSON con validaciones u opciones adicionales |
| condicionVisibilidad | Json? | Lógica JSON para mostrar/ocultar según otros campos |
| seccion | SeccionFormulario | Relación con la sección |

## Modelo: RespuestaFormulario
**Descripción:** Tipos de controles de entrada soportados por el generador de formularios Línea de texto corta Ãrea de texto multilinea Valor entero Valor con decimales Selector de fecha Interruptor Sí/No Lista desplegable de selección única Lista de selección múltiple Botones de selección única Grupo de casillas de verificación Selector de rango numérico Grid de captura de datos repetitivos Línea divisoria visual Texto decorativo o encabezado Opciones de diseño responsivo para los campos 25% del ancho disponible 33.3% del ancho disponible 50% del ancho disponible 100% del ancho disponible Almacenamiento de los datos capturados en un formulario dinámico

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| historiaId | Int | ID de la historia clínica vinculada |
| plantillaId | Int | ID de la plantilla utilizada |
| respuestas | Json | Objeto JSON con los valores capturados (Clave-Valor) |
| completado | Boolean | Indica si se completaron todos los campos requeridos |
| creadoEn | DateTime | Fecha de registro de datos |
| actualizadoEn | DateTime | Fecha de última modificación de los datos |
| historia | HistoriaClinica | Relación con la historia clínica |
| plantilla | PlantillaFormulario | Relación con la plantilla |

## Modelo: Triaje
**Descripción:** Evaluación inicial de signos vitales y priorización de atención

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| citaId | Int | ID de la cita para la cual se realiza el triaje |
| pacienteId | Int | ID del paciente evaluado |
| enfermeraId | Int | ID de la enfermera que realiza la evaluación |
| motivoConsulta | String | Descripción breve del síntoma principal |
| presionSistolica | Int? | Tensión arterial sistólica (mmHg) |
| presionDiastolica | Int? | Tensión arterial diastólica (mmHg) |
| frecuenciaCardiaca | Int? | Latidos por minuto |
| frecuenciaRespiratoria | Int? | Respiraciones por minuto |
| temperatura | Decimal? | Temperatura corporal (Â°C) |
| saturacionO2 | Int? | Porcentaje de oxígeno en sangre |
| glucometria | Decimal? | Nivel de azúcar en sangre (mg/dL) |
| peso | Decimal? | Peso actual (kg) |
| talla | Decimal? | Estatura actual (cm) |
| escalaDolor | Int? | Intensidad del dolor percibido (0-10) |
| nivelConciencia | NivelConciencia | Estado neurológico del paciente |
| categoria | CategoriaTriaje | Clasificación de prioridad según colores (Manchester/Sistema local) |
| observaciones | String? | Hallazgos adicionales de enfermería |
| creadoEn | DateTime | Fecha y hora de la evaluación |
| cita | Cita | Relación con la cita |
| paciente | Paciente | Relación con el paciente |
| enfermera | Usuario | Relación con el personal de enfermería |

## Modelo: CatDiagnostico
**Descripción:** Estados de alerta neurológica del paciente (Escala AVDI) Paciente consciente y orientado Reacciona solo al estímulo verbal Reacciona solo ante estímulos dolorosos Sin respuesta a ningún estímulo Clasificación internacional de urgencias Riesgo vital inmediato (Atención inmediata) Muy urgente (Espera < 10-15 min) Urgente (Espera < 60 min) Estándar (Espera < 120 min) No urgente (Atención demorable) Catálogo oficial de enfermedades CIE-10 (Clasificación Internacional de Enfermedades)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| codigo | String | Código alfanumérico estándar (ej: A00.0) |
| descripcion | String | Descripción clínica de la patología |
| capitulo | String? | Grupo o capítulo al que pertenece la enfermedad |
| activo | Boolean | Indica si el diagnóstico está vigente |
| notificable | Boolean | Indica si la enfermedad es de reporte obligatorio a vigilancia |
| notificacionInmediata | Boolean | Indica si se debe notificar en menos de 24 horas |

## Modelo: AuditLog
**Descripción:** Registro de trazabilidad de acciones críticas realizadas en el sistema

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| usuarioId | Int? | ID del usuario que realizó la acción |
| accion | String | Tipo de operación (CREATE, UPDATE, DELETE, LOGIN) |
| entidad | String | Nombre de la tabla o entidad afectada |
| entidadId | Int? | ID del registro específico afectado |
| detalle | String? | Descripción detallada del cambio o error |
| ip | String? | Dirección IP del cliente |
| duracionMs | Int? | Tiempo de respuesta del servidor en milisegundos |
| timestamp | DateTime | Fecha y hora exacta del evento |
| usuario | Usuario? | Relación con el usuario (si aplica) |

## Modelo: ParametroSistema
**Descripción:** Configuración global de variables de operación del sistema

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| clave | String | Nombre único de la variable (ej: TIEMPO_SESION) |
| valor | String | Valor asignado a la configuración |
| descripcion | String? | Explicación del impacto del parámetro en el sistema |
| creadoEn | DateTime | Fecha de creación inicial |
| actualizadoEn | DateTime | Fecha de última actualización |

## Modelo: Dispensacion
**Descripción:** Registro de la entrega física de medicamentos al paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| recetaId | Int | ID de la receta que se está surtiendo |
| usuarioId | Int | ID del usuario de farmacia que entrega |
| establecimientoId | Int | ID del establecimiento donde ocurre la entrega |
| fecha | DateTime | Fecha y hora de la entrega |
| receta | Receta | Relación con la receta |
| usuario | Usuario | Relación con el usuario farmacéutico |
| establecimiento | Establecimiento | Relación con el establecimiento |
| detalles | DispensacionDetalle[] | Medicamentos específicos entregados en esta transacción |

## Modelo: DispensacionDetalle
**Descripción:** Detalle de las unidades entregadas por cada ítem de la receta

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| dispensacionId | Int | ID de la transacción de dispensación |
| detalleRecetaId | Int | ID del renglón de la receta original |
| inventarioId | Int | ID del registro de inventario (lote) de donde salió el producto |
| cantidad | Int | Cantidad física entregada al paciente |
| dispensacion | Dispensacion | Relación con la cabecera de dispensación |
| detalleReceta | DetalleReceta | Relación con el detalle de la receta |
| inventario | Inventario | Relación con el lote de inventario |

## Modelo: Departamento
**Descripción:** Listado de los 18 departamentos de Honduras

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único (Código INE) |
| codigo | String | Código alfanumérico de 2 dígitos (ej: 01, 08) |
| nombre | String | Nombre oficial del departamento |
| municipios | Municipio[] | Municipios pertenecientes al departamento |
| establecimientos | Establecimiento[] | Establecimientos de salud ubicados en el departamento |
| pacientes | Paciente[] | Pacientes que residen en el departamento |

## Modelo: Municipio
**Descripción:** Listado de los 298 municipios de Honduras

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único (Código INE de 4 dígitos) |
| codigo | String | Código alfanumérico de 4 dígitos (ej: 0801) |
| nombre | String | Nombre oficial del municipio |
| departamentoId | Int | ID del departamento al que pertenece |
| departamento | Departamento | Relación con el departamento padre |
| establecimientos | Establecimiento[] | Establecimientos de salud ubicados en el municipio |
| pacientes | Paciente[] | Pacientes que residen en el municipio |

## Modelo: AgendaBase
**Descripción:** Definición de horarios laborales recurrentes de los médicos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| medicoId | Int | ID del médico dueño de la agenda |
| establecimientoId | Int | ID del establecimiento donde labora en este horario |
| diaSemana | Int | Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado) |
| horaInicio | String | Hora de inicio de la jornada (formato HH:mm) |
| horaFin | String | Hora de fin de la jornada (formato HH:mm) |
| activo | Boolean | Indica si este horario está vigente |
| creadoEn | DateTime | Fecha de registro de la agenda |
| actualizadoEn | DateTime | Fecha de última modificación de horarios |
| medico | Usuario | Relación con el usuario médico |
| establecimiento | Establecimiento | Relación con el establecimiento |

## Modelo: ExcepcionAgenda
**Descripción:** Registro de ausencias o cambios temporales en la disponibilidad médica

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| medicoId | Int | ID del médico afectado por la excepción |
| establecimientoId | Int | ID del establecimiento donde aplica la excepción |
| tipo | TipoExcepcion | Motivo de la ausencia (Vacaciones, Incapacidad, etc.) |
| fechaInicio | DateTime | Fecha y hora de inicio de la excepción |
| fechaFin | DateTime | Fecha y hora de fin de la excepción |
| descripcion | String? | Descripción detallada o notas administrativas |
| creadoEn | DateTime | Fecha de registro del evento |
| creadoPorId | Int? | ID del usuario que registró la excepción |
| medico | Usuario | Relación con el usuario médico |
| establecimiento | Establecimiento | Relación con el establecimiento |

## Modelo: CatVacuna
**Descripción:** Clasificación de los motivos de ausencia médica Período de descanso anual Descanso obligatorio por exposición a riesgos (ej: Rayos X) Ausencia por eventos de educación médica continua Ausencia justificada por enfermedad propia Permiso con o sin goce de sueldo para asuntos personales Otros motivos de ausencia Catálogo maestro de vacunas autorizadas (Esquema PAI)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| nombre | String | Nombre oficial de la vacuna (ej: BCG, Sabin) |
| descripcion | String? | Descripción de la enfermedad que previene |
| tipo | TipoVacuna | Naturaleza biológica de la vacuna |
| poblacionMeta | String? | Grupo de edad o condición para la cual está indicada |
| activo | Boolean | Indica si la vacuna está vigente en el esquema nacional |
| creadoEn | DateTime | Fecha de registro en el catálogo |
| esquemas | EsquemaVacunacion[] | Definiciones de dosis para esta vacuna |
| lotes | LoteVacuna[] | Lotes físicos recibidos de esta vacuna |
| registros | VacunacionRegistro[] | Registros históricos de aplicaciones |

## Modelo: EsquemaVacunacion
**Descripción:** Clasificación biológica de los biológicos Virus vivos debilitados Virus muertos o inactivados Bacterias vivas debilitadas Bacterias muertas o inactivadas Ingeniería genética (ej: Hepatitis B) Tecnología de ARN (ej: COVID-19) Basadas en toxinas bacterianas (ej: Tétanos) Definición de las dosis y tiempos de aplicación por cada vacuna

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| vacunaId | Int | ID de la vacuna asociada |
| numeroDosis | Int | Orden de la dosis (1=Primera, 2=Segunda, 3=Tercera, 4=Refuerzo) |
| edadRecomendadaMeses | Int | Edad ideal del paciente en meses para la dosis |
| intervaloMinimoDias | Int? | Tiempo mínimo de espera desde la dosis previa |
| descripcion | String? | Notas sobre la aplicación (ej: Dosis única) |
| vacuna | CatVacuna | Relación con la vacuna |
| registros | VacunacionRegistro[] | Registros de pacientes que han recibido esta dosis específica |

## Modelo: LoteVacuna
**Descripción:** Gestión de lotes específicos de vacunas y su inventario

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| vacunaId | Int | ID de la vacuna |
| codigoLote | String | Código alfanumérico del lote (fabricante) |
| fabricante | String? | Laboratorio productor del biológico |
| fechaVencimiento | DateTime | Fecha de caducidad del lote |
| cantidadInicial | Int | Cantidad de dosis recibidas originalmente |
| cantidadActual | Int | Dosis disponibles actualmente |
| establecimientoId | Int | ID del establecimiento custodio del lote |
| activo | Boolean | Indica si el lote puede ser utilizado |
| creadoEn | DateTime | Fecha de registro en el sistema |
| vacuna | CatVacuna | Relación con la vacuna |
| establecimiento | Establecimiento | Relación con el establecimiento |
| registros | VacunacionRegistro[] | Aplicaciones realizadas con este lote |
| movimientos | MovimientoVacuna[] | Historial de movimientos (ingresos, pérdidas) del lote |

## Modelo: MovimientoVacuna
**Descripción:** Registro detallado de transacciones físicas de biológicos

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| loteId | Int | ID del lote afectado |
| tipo | TipoMovimientoVacuna | Tipo de transacción de inventario |
| cantidad | Int | Número de dosis (positivo para ingresos, negativo para egresos) |
| motivo | String? | Explicación del movimiento |
| usuarioId | Int | ID del usuario que registró la transacción |
| fecha | DateTime | Fecha y hora del registro |
| lote | LoteVacuna | Relación con el lote |
| usuario | Usuario | Relación con el usuario |

## Modelo: VacunacionRegistro
**Descripción:** Clasificación de transacciones específicas para vacunas Recepción de biológicos Traslado a otro establecimiento Uso directo en paciente Corrección genérica de stock Corrección por sobrantes Corrección por faltantes Pérdida por interrupción de refrigeración Accidente físico con el vial El biológico alcanzó su fecha límite Registro histórico de la aplicación de una dosis a un paciente

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente inmunizado |
| vacunaId | Int | ID de la vacuna aplicada |
| esquemaId | Int? | ID de la dosis dentro del esquema (si aplica) |
| loteId | Int | ID del lote físico utilizado |
| fechaAplicacion | DateTime | Fecha y hora de la aplicación |
| sitioAplicacion | String? | Lugar anatómico (ej: Brazo derecho) |
| viaAplicacion | String? | Técnica utilizada (ej: Intramuscular) |
| observaciones | String? | Notas sobre reacciones adversas o incidentes |
| establecimientoId | Int | Establecimiento donde se aplicó |
| aplicadoPorId | Int | Usuario (enfermera/médico) que administró la dosis |
| paciente | Paciente | Relación con el paciente |
| vacuna | CatVacuna | Relación con la ficha de la vacuna |
| esquema | EsquemaVacunacion? | Relación con la dosis del esquema |
| lote | LoteVacuna | Relación con el lote físico |
| establecimiento | Establecimiento | Relación con el establecimiento |
| aplicadoPor | Usuario | Relación con el vacunador |

## Modelo: NotificacionEpidemiologica
**Descripción:** Reporte de enfermedades de vigilancia obligatoria para salud pública

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | Int | Identificador único |
| pacienteId | Int | ID del paciente afectado |
| historiaId | Int | ID del encuentro clínico donde se detectó |
| diagnosticoCIE10 | String | Código CIE-10 de la enfermedad sospechosa/confirmada |
| latitud | Decimal? | Coordenada geográfica (Eje Y) para mapas de calor |
| longitud | Decimal? | Coordenada geográfica (Eje X) para mapas de calor |
| direccionDetallada | String? | Croquis o puntos de referencia del domicilio |
| fechaInicioSintomas | DateTime? | Fecha estimada del primer síntoma reportado |
| antecedentesViaje | String? | Historial de desplazamientos recientes del paciente |
| lugaresVisitados | String? | Centros poblados o áreas visitadas |
| observaciones | String? | Información epidemiológica adicional |
| creadoEn | DateTime | Fecha de creación del reporte |
| creadoPorId | Int? | ID del médico que detectó el caso |
| estado | String | Estado del proceso de investigación (PENDIENTE, NOTIFICADO) |
| gestionadoEn | DateTime? | Fecha de cierre o escalamiento de la investigación |
| gestionadoPorId | Int? | ID del epidemiólogo que validó el caso |
| paciente | Paciente | Relación con el paciente |
| historia | HistoriaClinica | Relación con la historia clínica |
| creadoPor | Usuario? | Relación con el capturador inicial |
| gestionadoPor | Usuario? | Relación con el gestor epidemiológico |

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

