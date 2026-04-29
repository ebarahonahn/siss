-- ============================================================
-- Script: apply_comments.sql
-- Descripción: Agrega comentarios a columnas y tablas del SISS
-- Generado: 2026-04-25
-- ============================================================

-- =============================================
-- TABLA: roles
-- =============================================
ALTER TABLE `roles` COMMENT = 'Representa los roles de usuario en el sistema para control de acceso basado en roles (RBAC)';

ALTER TABLE `roles` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único autoincremental del rol';
ALTER TABLE `roles` MODIFY COLUMN `nombre` VARCHAR(50) NOT NULL COMMENT 'Nombre único del rol (ej: ADMIN, MEDICO, ENFERMERA)';
ALTER TABLE `roles` MODIFY COLUMN `descripcion` VARCHAR(200) NULL COMMENT 'Descripción detallada de las funciones del rol';
ALTER TABLE `roles` MODIFY COLUMN `permisos` JSON NOT NULL COMMENT 'Objeto JSON que define los permisos específicos del rol por módulo';

-- =============================================
-- TABLA: usuarios
-- =============================================
ALTER TABLE `usuarios` COMMENT = 'Representa a los usuarios del sistema (personal médico, administrativo y de enfermería)';

ALTER TABLE `usuarios` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único autoincremental del usuario';
ALTER TABLE `usuarios` MODIFY COLUMN `numeroEmpleado` VARCHAR(20) NOT NULL COMMENT 'Número de empleado institucional';
ALTER TABLE `usuarios` MODIFY COLUMN `nombres` VARCHAR(100) NOT NULL COMMENT 'Nombres del usuario';
ALTER TABLE `usuarios` MODIFY COLUMN `apellidos` VARCHAR(100) NOT NULL COMMENT 'Apellidos del usuario';
ALTER TABLE `usuarios` MODIFY COLUMN `correo` VARCHAR(150) NOT NULL COMMENT 'Correo electrónico institucional (usado para login)';
ALTER TABLE `usuarios` MODIFY COLUMN `contrasenaHash` VARCHAR(255) NOT NULL COMMENT 'Hash de la contraseña del usuario (Bcrypt)';
ALTER TABLE `usuarios` MODIFY COLUMN `telefono` VARCHAR(20) NULL COMMENT 'Número de teléfono de contacto';
ALTER TABLE `usuarios` MODIFY COLUMN `especialidadId` INT NULL COMMENT 'ID de la especialidad primaria del usuario (si aplica)';
ALTER TABLE `usuarios` MODIFY COLUMN `numeroColegiado` VARCHAR(50) NULL COMMENT 'Número de colegiación profesional (obligatorio para médicos)';
ALTER TABLE `usuarios` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el usuario está activo en el sistema';
ALTER TABLE `usuarios` MODIFY COLUMN `requiereCambioContrasena` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el usuario debe cambiar su contraseña en el próximo inicio de sesión';
ALTER TABLE `usuarios` MODIFY COLUMN `ultimoAcceso` DATETIME(3) NULL COMMENT 'Fecha y hora del último acceso exitoso';
ALTER TABLE `usuarios` MODIFY COLUMN `rolId` INT NULL COMMENT 'ID del rol principal asignado';
ALTER TABLE `usuarios` MODIFY COLUMN `establecimientoId` INT NULL COMMENT 'ID del establecimiento base donde labora';

-- =============================================
-- TABLA: sesiones
-- =============================================
ALTER TABLE `sesiones` COMMENT = 'Representa las sesiones de autenticación activas mediante Refresh Tokens';

ALTER TABLE `sesiones` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único de la sesión';
ALTER TABLE `sesiones` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario dueño de la sesión';
ALTER TABLE `sesiones` MODIFY COLUMN `refreshTokenHash` VARCHAR(255) NOT NULL COMMENT 'Hash del Refresh Token almacenado para validación de seguridad';
ALTER TABLE `sesiones` MODIFY COLUMN `expiresAt` DATETIME(3) NOT NULL COMMENT 'Fecha de expiración del token';
ALTER TABLE `sesiones` MODIFY COLUMN `ip` VARCHAR(45) NULL COMMENT 'Dirección IP desde la cual se inició la sesión';
ALTER TABLE `sesiones` MODIFY COLUMN `userAgent` VARCHAR(500) NULL COMMENT 'User Agent del navegador/dispositivo que inició la sesión';
ALTER TABLE `sesiones` MODIFY COLUMN `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de creación de la sesión';

-- =============================================
-- TABLA: establecimientos
-- =============================================
ALTER TABLE `establecimientos` COMMENT = 'Representa los centros de salud, hospitales y clínicas de la red de servicios';

ALTER TABLE `establecimientos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único autoincremental';
ALTER TABLE `establecimientos` MODIFY COLUMN `codigo` VARCHAR(20) NOT NULL COMMENT 'Código institucional único (ej: HNT-001)';
ALTER TABLE `establecimientos` MODIFY COLUMN `nombre` VARCHAR(200) NOT NULL COMMENT 'Nombre completo del establecimiento';
ALTER TABLE `establecimientos` MODIFY COLUMN `tipo` ENUM('HOSPITAL_NACIONAL','HOSPITAL_REGIONAL','CENTRO_SALUD','CLINICA_PERIFERICA','CESAMO','CESAR') NOT NULL COMMENT 'Nivel o tipo de establecimiento (Hospital, Centro de Salud, etc.)';
ALTER TABLE `establecimientos` MODIFY COLUMN `departamentoId` INT NOT NULL COMMENT 'ID del departamento geográfico donde se ubica';
ALTER TABLE `establecimientos` MODIFY COLUMN `municipioId` INT NOT NULL COMMENT 'ID del municipio donde se ubica';
ALTER TABLE `establecimientos` MODIFY COLUMN `telefono` VARCHAR(20) NULL COMMENT 'Teléfono de contacto institucional';
ALTER TABLE `establecimientos` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el establecimiento está operativo';
ALTER TABLE `establecimientos` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro en el sistema';
ALTER TABLE `establecimientos` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última actualización de datos';
ALTER TABLE `establecimientos` MODIFY COLUMN `eliminadoEn` DATETIME(3) NULL COMMENT 'Fecha de eliminación lógica (si aplica)';
ALTER TABLE `establecimientos` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del usuario que registró el establecimiento';
ALTER TABLE `establecimientos` MODIFY COLUMN `actualizadoPorId` INT NULL COMMENT 'ID del usuario que realizó la última actualización';
ALTER TABLE `establecimientos` MODIFY COLUMN `eliminadoPorId` INT NULL COMMENT 'ID del usuario que realizó la eliminación lógica';

-- =============================================
-- TABLA: cat_servicios
-- =============================================
ALTER TABLE `cat_servicios` COMMENT = 'Catálogo maestro de servicios o unidades funcionales (ej: Emergencias, Farmacia)';

ALTER TABLE `cat_servicios` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_servicios` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre único del servicio';
ALTER TABLE `cat_servicios` MODIFY COLUMN `descripcion` VARCHAR(300) NULL COMMENT 'Descripción de las funciones del servicio';
ALTER TABLE `cat_servicios` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el servicio está activo para ser asignado';

-- =============================================
-- TABLA: reportes_disponibles
-- =============================================
ALTER TABLE `reportes_disponibles` COMMENT = 'Registro de reportes analíticos disponibles en la plataforma';

ALTER TABLE `reportes_disponibles` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre legible del reporte';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `descripcion` VARCHAR(200) NULL COMMENT 'Descripción de la utilidad y datos que contiene';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `categoria` VARCHAR(50) NOT NULL COMMENT 'Categoría para agrupación en la UI (MEDICA, FARMACIA, etc.)';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `slug` VARCHAR(50) NOT NULL COMMENT 'Identificador interno para la lógica de generación';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `tipo` VARCHAR(10) NOT NULL COMMENT 'Formato de salida (EXCEL, PDF)';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `permiso` VARCHAR(50) NOT NULL COMMENT 'Permiso granular requerido para acceder a este reporte';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `icono` VARCHAR(50) NULL COMMENT 'Nombre del icono decorativo en la UI';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el reporte está disponible actualmente';
ALTER TABLE `reportes_disponibles` MODIFY COLUMN `orden` INT NOT NULL DEFAULT 0 COMMENT 'Orden de aparición en el listado';

-- =============================================
-- TABLA: servicios
-- =============================================
ALTER TABLE `servicios` COMMENT = 'Representa la habilitación de un servicio del catálogo en un establecimiento específico';

ALTER TABLE `servicios` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `servicios` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el servicio está operativo en este establecimiento';
ALTER TABLE `servicios` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento';
ALTER TABLE `servicios` MODIFY COLUMN `catServicioId` INT NOT NULL COMMENT 'ID del servicio del catálogo';

-- =============================================
-- TABLA: asignaciones_usuario
-- =============================================
ALTER TABLE `asignaciones_usuario` COMMENT = 'Permite la gestión de personal en múltiples establecimientos y servicios con roles diferenciados';

ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario asignado';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento de la asignación';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `servicioId` INT NULL COMMENT 'ID del servicio (opcional) si la asignación es a una unidad funcional específica';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `rolId` INT NULL COMMENT 'ID del rol (opcional) si el usuario tiene un rol distinto en este establecimiento';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `especialidadId` INT NULL COMMENT 'ID de la especialidad (opcional) si ejerce una especialidad distinta aquí';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si la asignación está vigente';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `permisos` JSON NULL COMMENT 'Sobrescritura opcional de permisos específicos para esta asignación';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de creación de la asignación';
ALTER TABLE `asignaciones_usuario` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última modificación';

-- =============================================
-- TABLA: especialidades
-- =============================================
ALTER TABLE `especialidades` COMMENT = 'Catálogo de especialidades médicas (ej: Pediatría, Ginecología)';

ALTER TABLE `especialidades` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `especialidades` MODIFY COLUMN `codigo` VARCHAR(20) NOT NULL COMMENT 'Código abreviado de la especialidad (ej: PED, GIN)';
ALTER TABLE `especialidades` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre completo de la especialidad';
ALTER TABLE `especialidades` MODIFY COLUMN `descripcion` VARCHAR(300) NULL COMMENT 'Breve descripción del alcance de la especialidad';
ALTER TABLE `especialidades` MODIFY COLUMN `activa` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si la especialidad está activa para nuevas asignaciones';
ALTER TABLE `especialidades` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro';
ALTER TABLE `especialidades` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última actualización';
ALTER TABLE `especialidades` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del usuario que registró la especialidad';
ALTER TABLE `especialidades` MODIFY COLUMN `actualizadoPorId` INT NULL COMMENT 'ID del usuario que realizó la última actualización';

-- =============================================
-- TABLA: pacientes
-- =============================================
ALTER TABLE `pacientes` COMMENT = 'Registro central de datos personales y demográficos de los pacientes';

ALTER TABLE `pacientes` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único autoincremental';
ALTER TABLE `pacientes` MODIFY COLUMN `numeroExpediente` VARCHAR(20) NOT NULL COMMENT 'Número de expediente único generado por el sistema';
ALTER TABLE `pacientes` MODIFY COLUMN `dni` VARCHAR(13) NOT NULL COMMENT 'Documento Nacional de Identificación (Honduras)';
ALTER TABLE `pacientes` MODIFY COLUMN `nombres` VARCHAR(100) NOT NULL COMMENT 'Nombres del paciente';
ALTER TABLE `pacientes` MODIFY COLUMN `apellidos` VARCHAR(100) NOT NULL COMMENT 'Apellidos del paciente';
ALTER TABLE `pacientes` MODIFY COLUMN `fechaNacimiento` DATE NOT NULL COMMENT 'Fecha de nacimiento';
ALTER TABLE `pacientes` MODIFY COLUMN `sexoId` INT NOT NULL COMMENT 'ID del catálogo de sexos';
ALTER TABLE `pacientes` MODIFY COLUMN `tipoSangreId` INT NULL COMMENT 'ID del catálogo de tipos de sangre';
ALTER TABLE `pacientes` MODIFY COLUMN `telefono` VARCHAR(20) NULL COMMENT 'Teléfono de contacto';
ALTER TABLE `pacientes` MODIFY COLUMN `telefonoEmergencia` VARCHAR(20) NULL COMMENT 'Teléfono de contacto para emergencias';
ALTER TABLE `pacientes` MODIFY COLUMN `correo` VARCHAR(150) NULL COMMENT 'Correo electrónico (opcional)';
ALTER TABLE `pacientes` MODIFY COLUMN `direccion` VARCHAR(300) NULL COMMENT 'Dirección de domicilio detallada';
ALTER TABLE `pacientes` MODIFY COLUMN `departamentoId` INT NOT NULL COMMENT 'ID del departamento de domicilio';
ALTER TABLE `pacientes` MODIFY COLUMN `municipioId` INT NOT NULL COMMENT 'ID del municipio de domicilio';
ALTER TABLE `pacientes` MODIFY COLUMN `comunidad` VARCHAR(100) NULL COMMENT 'Nombre de la comunidad, barrio o colonia';
ALTER TABLE `pacientes` MODIFY COLUMN `escolaridadId` INT NULL COMMENT 'ID del catálogo de escolaridad';
ALTER TABLE `pacientes` MODIFY COLUMN `ocupacionId` INT NULL COMMENT 'ID del catálogo de ocupaciones';
ALTER TABLE `pacientes` MODIFY COLUMN `estadoCivilId` INT NULL COMMENT 'ID del catálogo de estado civil';
ALTER TABLE `pacientes` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el paciente está activo para atención';
ALTER TABLE `pacientes` MODIFY COLUMN `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro inicial en el sistema';
ALTER TABLE `pacientes` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última actualización de datos demográficos';
ALTER TABLE `pacientes` MODIFY COLUMN `eliminadoEn` DATETIME(3) NULL COMMENT 'Fecha de eliminación lógica';
ALTER TABLE `pacientes` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento donde se registró el paciente';
ALTER TABLE `pacientes` MODIFY COLUMN `creadoPorId` INT NOT NULL COMMENT 'ID del usuario que registró al paciente';
ALTER TABLE `pacientes` MODIFY COLUMN `actualizadoPorId` INT NULL COMMENT 'ID del usuario que realizó la última actualización';
ALTER TABLE `pacientes` MODIFY COLUMN `eliminadoPorId` INT NULL COMMENT 'ID del usuario que realizó la eliminación lógica';

-- =============================================
-- TABLA: cat_sexos
-- =============================================
ALTER TABLE `cat_sexos` COMMENT = 'Catálogo de sexos para registro demográfico';

ALTER TABLE `cat_sexos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_sexos` MODIFY COLUMN `nombre` VARCHAR(20) NOT NULL COMMENT 'Nombre del sexo (Masculino, Femenino)';

-- =============================================
-- TABLA: cat_tipos_sangre
-- =============================================
ALTER TABLE `cat_tipos_sangre` COMMENT = 'Catálogo de tipos de sangre y factor RH';

ALTER TABLE `cat_tipos_sangre` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_tipos_sangre` MODIFY COLUMN `nombre` VARCHAR(20) NOT NULL COMMENT 'Nombre del tipo de sangre (ej: O+, A-)';

-- =============================================
-- TABLA: cat_escolaridades
-- =============================================
ALTER TABLE `cat_escolaridades` COMMENT = 'Catálogo de niveles de escolaridad alcanzados';

ALTER TABLE `cat_escolaridades` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_escolaridades` MODIFY COLUMN `nombre` VARCHAR(50) NOT NULL COMMENT 'Nombre del nivel (ej: Primaria, Universitaria)';

-- =============================================
-- TABLA: cat_estados_civiles
-- =============================================
ALTER TABLE `cat_estados_civiles` COMMENT = 'Catálogo de estados civiles';

ALTER TABLE `cat_estados_civiles` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_estados_civiles` MODIFY COLUMN `nombre` VARCHAR(30) NOT NULL COMMENT 'Nombre del estado (ej: Soltero, Casado)';

-- =============================================
-- TABLA: cat_ocupaciones
-- =============================================
ALTER TABLE `cat_ocupaciones` COMMENT = 'Catálogo de ocupaciones o profesiones';

ALTER TABLE `cat_ocupaciones` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_ocupaciones` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre de la ocupación';

-- =============================================
-- TABLA: alergias
-- =============================================
ALTER TABLE `alergias` COMMENT = 'Registro de alergias conocidas de un paciente';

ALTER TABLE `alergias` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `alergias` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente afectado';
ALTER TABLE `alergias` MODIFY COLUMN `tipo` ENUM('MEDICAMENTO','ALIMENTO','AMBIENTAL','LATEX','OTRO') NOT NULL COMMENT 'Categoría de la alergia (Medicamento, Alimento, etc.)';
ALTER TABLE `alergias` MODIFY COLUMN `descripcion` VARCHAR(300) NOT NULL COMMENT 'Descripción de la sustancia y reacción';
ALTER TABLE `alergias` MODIFY COLUMN `severidad` ENUM('LEVE','MODERADA','SEVERA') NOT NULL COMMENT 'Grado de peligrosidad de la alergia';

-- =============================================
-- TABLA: citas
-- =============================================
ALTER TABLE `citas` COMMENT = 'Gestión de citas médicas y programación de consultas';

ALTER TABLE `citas` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `citas` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente que solicita la cita';
ALTER TABLE `citas` MODIFY COLUMN `medicoId` INT NOT NULL COMMENT 'ID del médico asignado (opcional si es urgencia)';
ALTER TABLE `citas` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento donde se realizará la cita';
ALTER TABLE `citas` MODIFY COLUMN `fechaHora` DATETIME(3) NOT NULL COMMENT 'Fecha y hora programada para la atención';
ALTER TABLE `citas` MODIFY COLUMN `duracionMinutos` INT NOT NULL DEFAULT 20 COMMENT 'Tiempo estimado de duración del encuentro médico';
ALTER TABLE `citas` MODIFY COLUMN `tipo` ENUM('CONSULTA_GENERAL','ESPECIALIDAD','CONTROL','URGENCIA','VACUNACION','PLANIFICACION') NOT NULL COMMENT 'Tipo de atención solicitada';
ALTER TABLE `citas` MODIFY COLUMN `estado` ENUM('PROGRAMADA','CONFIRMADA','ATENDIDA','CANCELADA','NO_ASISTIO','EN_SALA') NOT NULL DEFAULT 'PROGRAMADA' COMMENT 'Estado actual de la cita (Programada, Atendida, etc.)';
ALTER TABLE `citas` MODIFY COLUMN `motivo` VARCHAR(500) NULL COMMENT 'Motivo breve de la consulta';
ALTER TABLE `citas` MODIFY COLUMN `notas` TEXT NULL COMMENT 'Observaciones adicionales';
ALTER TABLE `citas` MODIFY COLUMN `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro de la cita';
ALTER TABLE `citas` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del usuario (recepcionista) que registró la cita';
ALTER TABLE `citas` MODIFY COLUMN `canceladoPorId` INT NULL COMMENT 'ID del usuario que canceló la cita (si aplica)';
ALTER TABLE `citas` MODIFY COLUMN `especialidadId` INT NULL COMMENT 'ID de la especialidad bajo la cual se atiende la cita';

-- =============================================
-- TABLA: historia_clinica
-- =============================================
ALTER TABLE `historia_clinica` COMMENT = 'Representa el encuentro clínico (consulta) y el registro médico del paciente';

ALTER TABLE `historia_clinica` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `historia_clinica` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente atendido';
ALTER TABLE `historia_clinica` MODIFY COLUMN `medicoId` INT NOT NULL COMMENT 'ID del médico tratante';
ALTER TABLE `historia_clinica` MODIFY COLUMN `citaId` INT NULL COMMENT 'ID de la cita asociada';
ALTER TABLE `historia_clinica` MODIFY COLUMN `plantillaId` INT NULL COMMENT 'ID de la plantilla de formulario utilizada';
ALTER TABLE `historia_clinica` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de la atención';
ALTER TABLE `historia_clinica` MODIFY COLUMN `subjetivo` TEXT NOT NULL COMMENT '[S]ubjetivo: Motivo de consulta, síntomas y anamnesis';
ALTER TABLE `historia_clinica` MODIFY COLUMN `objetivo` TEXT NOT NULL COMMENT '[O]bjetivo: Hallazgos del examen físico';
ALTER TABLE `historia_clinica` MODIFY COLUMN `analisis` TEXT NOT NULL COMMENT '[A]nálisis: Razonamiento médico y diagnósticos presuntivos';
ALTER TABLE `historia_clinica` MODIFY COLUMN `plan` TEXT NOT NULL COMMENT '[P]lan: Tratamiento, medicamentos, exámenes y recomendaciones';
ALTER TABLE `historia_clinica` MODIFY COLUMN `presionSistolica` INT NULL COMMENT 'Tensión arterial sistólica (mmHg)';
ALTER TABLE `historia_clinica` MODIFY COLUMN `presionDiastolica` INT NULL COMMENT 'Tensión arterial diastólica (mmHg)';
ALTER TABLE `historia_clinica` MODIFY COLUMN `frecuenciaCardiaca` INT NULL COMMENT 'Latidos por minuto';
ALTER TABLE `historia_clinica` MODIFY COLUMN `temperatura` DECIMAL(4,1) NULL COMMENT 'Temperatura corporal (°C)';
ALTER TABLE `historia_clinica` MODIFY COLUMN `peso` DECIMAL(5,2) NULL COMMENT 'Peso del paciente (kg)';
ALTER TABLE `historia_clinica` MODIFY COLUMN `talla` DECIMAL(4,1) NULL COMMENT 'Estatura del paciente (cm)';
ALTER TABLE `historia_clinica` MODIFY COLUMN `saturacionO2` INT NULL COMMENT 'Porcentaje de saturación de oxígeno';
ALTER TABLE `historia_clinica` MODIFY COLUMN `semanaEpidemiologica` INT NULL COMMENT 'Número de semana epidemiológica (1-52)';
ALTER TABLE `historia_clinica` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de la última modificación';
ALTER TABLE `historia_clinica` MODIFY COLUMN `eliminadoEn` DATETIME(3) NULL COMMENT 'Fecha de eliminación lógica';
ALTER TABLE `historia_clinica` MODIFY COLUMN `actualizadoPorId` INT NULL COMMENT 'ID del usuario que actualizó el registro';
ALTER TABLE `historia_clinica` MODIFY COLUMN `eliminadoPorId` INT NULL COMMENT 'ID del usuario que eliminó el registro';
ALTER TABLE `historia_clinica` MODIFY COLUMN `proximaCitaId` INT NULL COMMENT 'ID de la próxima cita programada';

-- =============================================
-- TABLA: diagnosticos
-- =============================================
ALTER TABLE `diagnosticos` COMMENT = 'Diagnósticos asociados a una atención médica (basados en CIE-10)';

ALTER TABLE `diagnosticos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `diagnosticos` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica asociada';
ALTER TABLE `diagnosticos` MODIFY COLUMN `codigoCIE10` VARCHAR(10) NOT NULL COMMENT 'Código alfanumérico CIE-10';
ALTER TABLE `diagnosticos` MODIFY COLUMN `descripcion` VARCHAR(500) NOT NULL COMMENT 'Descripción del diagnóstico según catálogo';
ALTER TABLE `diagnosticos` MODIFY COLUMN `tipo` ENUM('PRINCIPAL','SECUNDARIO','COMORBILIDAD') NOT NULL COMMENT 'Importancia del diagnóstico (Principal, Secundario)';

-- =============================================
-- TABLA: incapacidades
-- =============================================
ALTER TABLE `incapacidades` COMMENT = 'Registro de incapacidades médicas otorgadas al paciente';

ALTER TABLE `incapacidades` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `incapacidades` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica asociada';
ALTER TABLE `incapacidades` MODIFY COLUMN `fechaInicio` DATE NOT NULL COMMENT 'Fecha de inicio del reposo';
ALTER TABLE `incapacidades` MODIFY COLUMN `fechaFin` DATE NOT NULL COMMENT 'Fecha de finalización del reposo';
ALTER TABLE `incapacidades` MODIFY COLUMN `dias` INT NOT NULL COMMENT 'Total de días de incapacidad';
ALTER TABLE `incapacidades` MODIFY COLUMN `tipo` ENUM('LABORAL','ESCOLAR','DEPORTIVA') NOT NULL DEFAULT 'LABORAL' COMMENT 'Ámbito de la incapacidad (Laboral, Escolar)';
ALTER TABLE `incapacidades` MODIFY COLUMN `motivo` VARCHAR(500) NOT NULL COMMENT 'Descripción de la justificación médica';

-- =============================================
-- TABLA: medicamentos
-- =============================================
ALTER TABLE `medicamentos` COMMENT = 'Catálogo maestro de medicamentos y productos farmacéuticos';

ALTER TABLE `medicamentos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `medicamentos` MODIFY COLUMN `codigo` VARCHAR(30) NOT NULL COMMENT 'Código de barras o SKU del medicamento';
ALTER TABLE `medicamentos` MODIFY COLUMN `nombreGenerico` VARCHAR(200) NOT NULL COMMENT 'Denominación Común Internacional (DCI)';
ALTER TABLE `medicamentos` MODIFY COLUMN `nombreComercial` VARCHAR(200) NULL COMMENT 'Nombre bajo el cual se comercializa (opcional)';
ALTER TABLE `medicamentos` MODIFY COLUMN `presentacion` VARCHAR(100) NOT NULL COMMENT 'Forma farmacéutica (ej: Tabletas, Jarabe)';
ALTER TABLE `medicamentos` MODIFY COLUMN `concentracion` VARCHAR(50) NOT NULL COMMENT 'Cantidad de principio activo (ej: 500mg)';
ALTER TABLE `medicamentos` MODIFY COLUMN `via` ENUM('ORAL','INYECTABLE','TOPICA','INHALATORIA','SUBLINGUAL','RECTAL','OFTALMICA','OTICA') NOT NULL COMMENT 'Método de ingreso al organismo';
ALTER TABLE `medicamentos` MODIFY COLUMN `grupoTerapeutico` VARCHAR(100) NOT NULL COMMENT 'Clasificación terapéutica (ej: Antibióticos)';
ALTER TABLE `medicamentos` MODIFY COLUMN `requiereReceta` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si requiere autorización médica para dispensar';
ALTER TABLE `medicamentos` MODIFY COLUMN `esControlado` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el medicamento es psicotrópico o estupefaciente';
ALTER TABLE `medicamentos` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el medicamento está disponible en el catálogo';
ALTER TABLE `medicamentos` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro inicial';
ALTER TABLE `medicamentos` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última actualización de ficha técnica';
ALTER TABLE `medicamentos` MODIFY COLUMN `eliminadoEn` DATETIME(3) NULL COMMENT 'Fecha de eliminación lógica';
ALTER TABLE `medicamentos` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del usuario que registró el medicamento';
ALTER TABLE `medicamentos` MODIFY COLUMN `actualizadoPorId` INT NULL COMMENT 'ID del usuario que realizó la última actualización';
ALTER TABLE `medicamentos` MODIFY COLUMN `eliminadoPorId` INT NULL COMMENT 'ID del usuario que realizó la eliminación lógica';

-- =============================================
-- TABLA: inventario
-- =============================================
ALTER TABLE `inventario` COMMENT = 'Control de existencias físicas de medicamentos por establecimiento y lote';

ALTER TABLE `inventario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `inventario` MODIFY COLUMN `medicamentoId` INT NOT NULL COMMENT 'ID del medicamento asociado';
ALTER TABLE `inventario` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento que posee el stock';
ALTER TABLE `inventario` MODIFY COLUMN `cantidadActual` INT NOT NULL DEFAULT 0 COMMENT 'Cantidad disponible actualmente para dispensar';
ALTER TABLE `inventario` MODIFY COLUMN `cantidadMinima` INT NOT NULL DEFAULT 10 COMMENT 'Nivel mínimo antes de generar alertas de reabastecimiento';
ALTER TABLE `inventario` MODIFY COLUMN `lote` VARCHAR(50) NULL COMMENT 'Código del lote de fabricación para trazabilidad';
ALTER TABLE `inventario` MODIFY COLUMN `fechaVencimiento` DATE NULL COMMENT 'Fecha de expiración del lote';
ALTER TABLE `inventario` MODIFY COLUMN `ubicacion` VARCHAR(100) NULL COMMENT 'Ubicación física dentro de la bodega/farmacia';
ALTER TABLE `inventario` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si este stock está disponible para uso';
ALTER TABLE `inventario` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro del ingreso inicial';
ALTER TABLE `inventario` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de último movimiento o ajuste';
ALTER TABLE `inventario` MODIFY COLUMN `eliminadoEn` DATETIME(3) NULL COMMENT 'Fecha de eliminación (si aplica)';
ALTER TABLE `inventario` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del usuario que registró el ingreso';
ALTER TABLE `inventario` MODIFY COLUMN `actualizadoPorId` INT NULL COMMENT 'ID del usuario que realizó la última modificación';
ALTER TABLE `inventario` MODIFY COLUMN `eliminadoPorId` INT NULL COMMENT 'ID del usuario que eliminó el registro';

-- =============================================
-- TABLA: movimientos_inventario
-- =============================================
ALTER TABLE `movimientos_inventario` COMMENT = 'Registro histórico de transacciones que afectan el stock de medicamentos';

ALTER TABLE `movimientos_inventario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `movimientos_inventario` MODIFY COLUMN `inventarioId` INT NOT NULL COMMENT 'ID del registro de inventario afectado';
ALTER TABLE `movimientos_inventario` MODIFY COLUMN `tipo` ENUM('ENTRADA','SALIDA','AJUSTE','CADUCADO','PERDIDA','DISPENSACION') NOT NULL COMMENT 'Tipo de transacción (Entrada, Salida, etc.)';
ALTER TABLE `movimientos_inventario` MODIFY COLUMN `cantidad` INT NOT NULL COMMENT 'Cantidad de unidades involucradas en el movimiento';
ALTER TABLE `movimientos_inventario` MODIFY COLUMN `motivo` VARCHAR(200) NULL COMMENT 'Explicación del porqué del movimiento';
ALTER TABLE `movimientos_inventario` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario que realizó la transacción';
ALTER TABLE `movimientos_inventario` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora del registro';

-- =============================================
-- TABLA: recetas
-- =============================================
ALTER TABLE `recetas` COMMENT = 'Documento de prescripción médica para un paciente';

ALTER TABLE `recetas` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `recetas` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica donde se originó la receta';
ALTER TABLE `recetas` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente beneficiario';
ALTER TABLE `recetas` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento donde se emitió';
ALTER TABLE `recetas` MODIFY COLUMN `estado` ENUM('PENDIENTE','DISPENSADA','PARCIAL','CANCELADA','DEMANDA_INSATISFECHA') NOT NULL DEFAULT 'PENDIENTE' COMMENT 'Estado actual del flujo de dispensación';
ALTER TABLE `recetas` MODIFY COLUMN `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de emisión';
ALTER TABLE `recetas` MODIFY COLUMN `dispensadaEn` DATETIME(3) NULL COMMENT 'Fecha en la que se completó la entrega total';

-- =============================================
-- TABLA: detalles_receta
-- =============================================
ALTER TABLE `detalles_receta` COMMENT = 'Especificación de un medicamento individual dentro de una receta';

ALTER TABLE `detalles_receta` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `detalles_receta` MODIFY COLUMN `recetaId` INT NOT NULL COMMENT 'ID de la receta a la que pertenece';
ALTER TABLE `detalles_receta` MODIFY COLUMN `medicamentoId` INT NOT NULL COMMENT 'ID del medicamento prescrito';
ALTER TABLE `detalles_receta` MODIFY COLUMN `dosis` VARCHAR(100) NOT NULL COMMENT 'Cantidad y unidad por toma (ej: 1 tableta)';
ALTER TABLE `detalles_receta` MODIFY COLUMN `frecuencia` VARCHAR(100) NOT NULL COMMENT 'Intervalo de tiempo (ej: Cada 8 horas)';
ALTER TABLE `detalles_receta` MODIFY COLUMN `duracion` VARCHAR(100) NOT NULL COMMENT 'Tiempo total de tratamiento (ej: 7 días)';
ALTER TABLE `detalles_receta` MODIFY COLUMN `cantidad` INT NOT NULL COMMENT 'Cantidad total de unidades a dispensar';
ALTER TABLE `detalles_receta` MODIFY COLUMN `cantidadEntregada` INT NOT NULL DEFAULT 0 COMMENT 'Acumulado de unidades ya entregadas';
ALTER TABLE `detalles_receta` MODIFY COLUMN `ultimaDispensacion` DATETIME(3) NULL COMMENT 'Fecha del último despacho parcial';
ALTER TABLE `detalles_receta` MODIFY COLUMN `indicaciones` VARCHAR(500) NULL COMMENT 'Consejos adicionales para el paciente';

-- =============================================
-- TABLA: paciente_medicamentos
-- =============================================
ALTER TABLE `paciente_medicamentos` COMMENT = 'Historial de medicación activa (tratamientos crónicos) de un paciente';

ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente';
ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `medicamentoId` INT NOT NULL COMMENT 'ID del medicamento';
ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `dosis` VARCHAR(100) NOT NULL COMMENT 'Dosis del tratamiento';
ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `frecuencia` VARCHAR(100) NOT NULL COMMENT 'Frecuencia de administración';
ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `inicio` DATE NOT NULL COMMENT 'Fecha de inicio del tratamiento';
ALTER TABLE `paciente_medicamentos` MODIFY COLUMN `fin` DATE NULL COMMENT 'Fecha estimada de finalización (null si es permanente)';

-- =============================================
-- TABLA: cat_examenes_laboratorio
-- =============================================
ALTER TABLE `cat_examenes_laboratorio` COMMENT = 'Catálogo maestro de exámenes de laboratorio clínico disponibles';

ALTER TABLE `cat_examenes_laboratorio` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_examenes_laboratorio` MODIFY COLUMN `codigo` VARCHAR(20) NOT NULL COMMENT 'Código interno único del examen';
ALTER TABLE `cat_examenes_laboratorio` MODIFY COLUMN `nombre` VARCHAR(150) NOT NULL COMMENT 'Nombre descriptivo del examen';
ALTER TABLE `cat_examenes_laboratorio` MODIFY COLUMN `categoria` VARCHAR(100) NOT NULL COMMENT 'Área del laboratorio (ej: Hematología, Química)';
ALTER TABLE `cat_examenes_laboratorio` MODIFY COLUMN `indicaciones` TEXT NULL COMMENT 'Requisitos para el paciente (ej: Ayuno 8h)';
ALTER TABLE `cat_examenes_laboratorio` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el examen está disponible en el catálogo general';

-- =============================================
-- TABLA: examen_establecimientos
-- =============================================
ALTER TABLE `examen_establecimientos` COMMENT = 'Tabla asociativa de exámenes habilitados por cada establecimiento';

ALTER TABLE `examen_establecimientos` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento';
ALTER TABLE `examen_establecimientos` MODIFY COLUMN `examenId` INT NOT NULL COMMENT 'ID del examen del catálogo';

-- =============================================
-- TABLA: solicitudes_laboratorio
-- =============================================
ALTER TABLE `solicitudes_laboratorio` COMMENT = 'Orden de laboratorio clínico emitida durante una consulta';

ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica origen';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento donde se procesará';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `estado` ENUM('SOLICITADO','EN_PROCESO','COMPLETADO','CANCELADO') NOT NULL DEFAULT 'SOLICITADO' COMMENT 'Estado actual del flujo de laboratorio';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `urgente` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Prioridad de procesamiento';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Notas médicas adicionales para el laboratorista';
ALTER TABLE `solicitudes_laboratorio` MODIFY COLUMN `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de emisión de la orden';

-- =============================================
-- TABLA: detalles_solicitud_laboratorio
-- =============================================
ALTER TABLE `detalles_solicitud_laboratorio` COMMENT = 'Detalle de cada examen incluido en una orden de laboratorio';

ALTER TABLE `detalles_solicitud_laboratorio` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `detalles_solicitud_laboratorio` MODIFY COLUMN `solicitudId` INT NOT NULL COMMENT 'ID de la solicitud cabecera';
ALTER TABLE `detalles_solicitud_laboratorio` MODIFY COLUMN `examenId` INT NOT NULL COMMENT 'ID del examen específico';
ALTER TABLE `detalles_solicitud_laboratorio` MODIFY COLUMN `observaciones` VARCHAR(200) NULL COMMENT 'Observaciones específicas para este examen';

-- =============================================
-- TABLA: resultados_laboratorio
-- =============================================
ALTER TABLE `resultados_laboratorio` COMMENT = 'Registro de resultados numéricos o cualitativos de exámenes de laboratorio';

ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `solicitudId` INT NOT NULL COMMENT 'ID de la solicitud a la que pertenece el resultado';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `historiaId` INT NULL COMMENT 'ID opcional de la historia clínica para vinculación directa';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `prueba` VARCHAR(200) NOT NULL COMMENT 'Nombre del parámetro o prueba analizada';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `valor` VARCHAR(200) NOT NULL COMMENT 'Resultado obtenido';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `unidad` VARCHAR(50) NULL COMMENT 'Unidad de medida (ej: mg/dL, %)';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `valorReferencia` VARCHAR(100) NULL COMMENT 'Rango esperado para un paciente sano';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `anormal` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el valor está fuera de los rangos normales';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Interpretación del microbiólogo o analista';
ALTER TABLE `resultados_laboratorio` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de validación del resultado';

-- =============================================
-- TABLA: cat_examenes_radiologia
-- =============================================
ALTER TABLE `cat_examenes_radiologia` COMMENT = 'Catálogo maestro de estudios radiológicos e imagenología';

ALTER TABLE `cat_examenes_radiologia` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_examenes_radiologia` MODIFY COLUMN `codigo` VARCHAR(20) NOT NULL COMMENT 'Código interno único (ej: RX-01, TAC-05)';
ALTER TABLE `cat_examenes_radiologia` MODIFY COLUMN `nombre` VARCHAR(150) NOT NULL COMMENT 'Nombre del estudio (ej: Rayos X de Tórax)';
ALTER TABLE `cat_examenes_radiologia` MODIFY COLUMN `categoria` VARCHAR(100) NOT NULL COMMENT 'Modalidad de imagen (RX, ECO, TAC, RM, etc.)';
ALTER TABLE `cat_examenes_radiologia` MODIFY COLUMN `indicaciones` TEXT NULL COMMENT 'Requisitos técnicos o del paciente';
ALTER TABLE `cat_examenes_radiologia` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el estudio está disponible en el catálogo';

-- =============================================
-- TABLA: estudio_radiologia_establecimientos
-- =============================================
ALTER TABLE `estudio_radiologia_establecimientos` COMMENT = 'Tabla asociativa de estudios de imagen habilitados por establecimiento';

ALTER TABLE `estudio_radiologia_establecimientos` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento';
ALTER TABLE `estudio_radiologia_establecimientos` MODIFY COLUMN `estudioId` INT NOT NULL COMMENT 'ID del estudio del catálogo';

-- =============================================
-- TABLA: solicitudes_radiologia
-- =============================================
ALTER TABLE `solicitudes_radiologia` COMMENT = 'Orden de estudios de imagenología emitida por un médico';

ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica origen';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento de destino';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `estado` ENUM('SOLICITADO','EN_PROCESO','COMPLETADO','CANCELADO') NOT NULL DEFAULT 'SOLICITADO' COMMENT 'Estado del flujo (Solicitado, Completado)';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `urgente` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Prioridad de atención';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Justificación clínica del estudio';
ALTER TABLE `solicitudes_radiologia` MODIFY COLUMN `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de emisión de la orden';

-- =============================================
-- TABLA: detalles_solicitud_radiologia
-- =============================================
ALTER TABLE `detalles_solicitud_radiologia` COMMENT = 'Detalle de cada estudio individual en una orden de radiología';

ALTER TABLE `detalles_solicitud_radiologia` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `detalles_solicitud_radiologia` MODIFY COLUMN `solicitudId` INT NOT NULL COMMENT 'ID de la solicitud cabecera';
ALTER TABLE `detalles_solicitud_radiologia` MODIFY COLUMN `estudioId` INT NOT NULL COMMENT 'ID del estudio específico';
ALTER TABLE `detalles_solicitud_radiologia` MODIFY COLUMN `observaciones` VARCHAR(200) NULL COMMENT 'Observaciones o sospechas diagnósticas para el radiólogo';

-- =============================================
-- TABLA: resultados_radiologia
-- =============================================
ALTER TABLE `resultados_radiologia` COMMENT = 'Registro de la interpretación médica de un estudio de imagen';

ALTER TABLE `resultados_radiologia` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `resultados_radiologia` MODIFY COLUMN `solicitudId` INT NOT NULL COMMENT 'ID de la solicitud a la que pertenece el informe';
ALTER TABLE `resultados_radiologia` MODIFY COLUMN `hallazgos` TEXT NULL COMMENT 'Descripción detallada de lo observado en la imagen';
ALTER TABLE `resultados_radiologia` MODIFY COLUMN `conclusion` TEXT NULL COMMENT 'Diagnóstico radiológico final';
ALTER TABLE `resultados_radiologia` MODIFY COLUMN `imageUrl` VARCHAR(500) NULL COMMENT 'Enlace al visor PACS o almacenamiento de la imagen digital';
ALTER TABLE `resultados_radiologia` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora del informe';

-- =============================================
-- TABLA: referidos
-- =============================================
ALTER TABLE `referidos` COMMENT = 'Gestión de referencias de pacientes entre establecimientos de la red';

ALTER TABLE `referidos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `referidos` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica donde se origina el referido';
ALTER TABLE `referidos` MODIFY COLUMN `establecimientoOrigenId` INT NOT NULL COMMENT 'Establecimiento que envía al paciente';
ALTER TABLE `referidos` MODIFY COLUMN `establecimientoDestinoId` INT NOT NULL COMMENT 'Establecimiento que recibirá al paciente';
ALTER TABLE `referidos` MODIFY COLUMN `especialidadDestino` VARCHAR(100) NOT NULL COMMENT 'Especialidad a la que se remite';
ALTER TABLE `referidos` MODIFY COLUMN `motivo` TEXT NOT NULL COMMENT 'Justificación clínica del traslado';
ALTER TABLE `referidos` MODIFY COLUMN `urgente` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Prioridad de la referencia';
ALTER TABLE `referidos` MODIFY COLUMN `estado` ENUM('EMITIDO','RECIBIDO','ATENDIDO','RECHAZADO') NOT NULL DEFAULT 'EMITIDO' COMMENT 'Estado del trámite administrativo';
ALTER TABLE `referidos` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de emisión';

-- =============================================
-- TABLA: plantillas_formulario
-- =============================================
ALTER TABLE `plantillas_formulario` COMMENT = 'Definición de formularios clínicos dinámicos por especialidad';

ALTER TABLE `plantillas_formulario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `especialidadId` INT NOT NULL COMMENT 'ID de la especialidad a la que pertenece el formulario';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `nombre` VARCHAR(150) NOT NULL COMMENT 'Nombre descriptivo del formulario (ej: Control Prenatal)';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `descripcion` TEXT NULL COMMENT 'Propósito del formulario';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `version` INT NOT NULL DEFAULT 1 COMMENT 'Número de versión para control de cambios';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `activa` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si es la versión que se muestra actualmente';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `creadoPorId` INT NOT NULL COMMENT 'ID del usuario que diseñó la plantilla';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de creación';
ALTER TABLE `plantillas_formulario` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última modificación';

-- =============================================
-- TABLA: secciones_formulario
-- =============================================
ALTER TABLE `secciones_formulario` COMMENT = 'Agrupador de campos dentro de un formulario dinámico';

ALTER TABLE `secciones_formulario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `secciones_formulario` MODIFY COLUMN `plantillaId` INT NOT NULL COMMENT 'ID de la plantilla padre';
ALTER TABLE `secciones_formulario` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Título de la sección';
ALTER TABLE `secciones_formulario` MODIFY COLUMN `descripcion` VARCHAR(300) NULL COMMENT 'Texto de ayuda para la sección';
ALTER TABLE `secciones_formulario` MODIFY COLUMN `orden` INT NOT NULL DEFAULT 0 COMMENT 'Posición relativa en el formulario';
ALTER TABLE `secciones_formulario` MODIFY COLUMN `colapsable` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la sección se puede contraer en la UI';
ALTER TABLE `secciones_formulario` MODIFY COLUMN `visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si la sección se muestra por defecto';

-- =============================================
-- TABLA: campos_formulario
-- =============================================
ALTER TABLE `campos_formulario` COMMENT = 'Definición de un campo individual de captura de datos';

ALTER TABLE `campos_formulario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `campos_formulario` MODIFY COLUMN `seccionId` INT NOT NULL COMMENT 'ID de la sección contenedora';
ALTER TABLE `campos_formulario` MODIFY COLUMN `tipo` ENUM('TEXTO','TEXTAREA','NUMERO','DECIMAL','FECHA','BOOLEANO','SELECT','MULTISELECT','RADIO','CHECKBOX_GRUPO','ESCALA','TABLA','SEPARADOR','TITULO') NOT NULL COMMENT 'Tipo de control de entrada (Texto, Número, etc.)';
ALTER TABLE `campos_formulario` MODIFY COLUMN `etiqueta` VARCHAR(150) NOT NULL COMMENT 'Texto que ve el usuario (Label)';
ALTER TABLE `campos_formulario` MODIFY COLUMN `clave` VARCHAR(80) NOT NULL COMMENT 'Nombre técnico del campo para almacenamiento';
ALTER TABLE `campos_formulario` MODIFY COLUMN `placeholder` VARCHAR(200) NULL COMMENT 'Texto sugerido dentro del campo';
ALTER TABLE `campos_formulario` MODIFY COLUMN `ayuda` VARCHAR(300) NULL COMMENT 'Texto de ayuda u orientación médica';
ALTER TABLE `campos_formulario` MODIFY COLUMN `requerido` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si el campo es obligatorio';
ALTER TABLE `campos_formulario` MODIFY COLUMN `orden` INT NOT NULL DEFAULT 0 COMMENT 'Posición dentro de la sección';
ALTER TABLE `campos_formulario` MODIFY COLUMN `ancho` ENUM('CUARTO','TERCIO','MEDIO','COMPLETO') NOT NULL DEFAULT 'COMPLETO' COMMENT 'Porcentaje de ancho que ocupa en la pantalla';
ALTER TABLE `campos_formulario` MODIFY COLUMN `visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el campo es visible inicialmente';
ALTER TABLE `campos_formulario` MODIFY COLUMN `configuracion` JSON NULL COMMENT 'Objeto JSON con validaciones u opciones adicionales';
ALTER TABLE `campos_formulario` MODIFY COLUMN `condicionVisibilidad` JSON NULL COMMENT 'Lógica JSON para mostrar/ocultar según otros campos';

-- =============================================
-- TABLA: respuestas_formulario
-- =============================================
ALTER TABLE `respuestas_formulario` COMMENT = 'Almacenamiento de los datos capturados en un formulario dinámico';

ALTER TABLE `respuestas_formulario` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `respuestas_formulario` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID de la historia clínica vinculada';
ALTER TABLE `respuestas_formulario` MODIFY COLUMN `plantillaId` INT NOT NULL COMMENT 'ID de la plantilla utilizada';
ALTER TABLE `respuestas_formulario` MODIFY COLUMN `respuestas` JSON NOT NULL COMMENT 'Objeto JSON con los valores capturados (Clave-Valor)';
ALTER TABLE `respuestas_formulario` MODIFY COLUMN `completado` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si se completaron todos los campos requeridos';
ALTER TABLE `respuestas_formulario` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro de datos';
ALTER TABLE `respuestas_formulario` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última modificación de los datos';

-- =============================================
-- TABLA: triajes
-- =============================================
ALTER TABLE `triajes` COMMENT = 'Evaluación inicial de signos vitales y priorización de atención';

ALTER TABLE `triajes` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `triajes` MODIFY COLUMN `citaId` INT NOT NULL COMMENT 'ID de la cita para la cual se realiza el triaje';
ALTER TABLE `triajes` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente evaluado';
ALTER TABLE `triajes` MODIFY COLUMN `enfermeraId` INT NOT NULL COMMENT 'ID de la enfermera que realiza la evaluación';
ALTER TABLE `triajes` MODIFY COLUMN `motivoConsulta` TEXT NOT NULL COMMENT 'Descripción breve del síntoma principal';
ALTER TABLE `triajes` MODIFY COLUMN `presionSistolica` INT NULL COMMENT 'Tensión arterial sistólica (mmHg)';
ALTER TABLE `triajes` MODIFY COLUMN `presionDiastolica` INT NULL COMMENT 'Tensión arterial diastólica (mmHg)';
ALTER TABLE `triajes` MODIFY COLUMN `frecuenciaCardiaca` INT NULL COMMENT 'Latidos por minuto';
ALTER TABLE `triajes` MODIFY COLUMN `frecuenciaRespiratoria` INT NULL COMMENT 'Respiraciones por minuto';
ALTER TABLE `triajes` MODIFY COLUMN `temperatura` DECIMAL(4,1) NULL COMMENT 'Temperatura corporal (°C)';
ALTER TABLE `triajes` MODIFY COLUMN `saturacionO2` INT NULL COMMENT 'Porcentaje de oxígeno en sangre';
ALTER TABLE `triajes` MODIFY COLUMN `glucometria` DECIMAL(5,1) NULL COMMENT 'Nivel de azúcar en sangre (mg/dL)';
ALTER TABLE `triajes` MODIFY COLUMN `peso` DECIMAL(5,2) NULL COMMENT 'Peso actual (kg)';
ALTER TABLE `triajes` MODIFY COLUMN `talla` DECIMAL(4,1) NULL COMMENT 'Estatura actual (cm)';
ALTER TABLE `triajes` MODIFY COLUMN `escalaDolor` INT NULL COMMENT 'Intensidad del dolor percibido (0-10)';
ALTER TABLE `triajes` MODIFY COLUMN `nivelConciencia` ENUM('ALERTA','RESPONDE_VOZ','RESPONDE_DOLOR','INCONSCIENTE') NOT NULL DEFAULT 'ALERTA' COMMENT 'Estado neurológico del paciente';
ALTER TABLE `triajes` MODIFY COLUMN `categoria` ENUM('ROJO','NARANJA','AMARILLO','VERDE','AZUL') NOT NULL COMMENT 'Clasificación de prioridad según colores (Manchester/Sistema local)';
ALTER TABLE `triajes` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Hallazgos adicionales de enfermería';
ALTER TABLE `triajes` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de la evaluación';

-- =============================================
-- TABLA: cat_diagnostico
-- =============================================
ALTER TABLE `cat_diagnostico` COMMENT = 'Catálogo oficial de enfermedades CIE-10 (Clasificación Internacional de Enfermedades)';

ALTER TABLE `cat_diagnostico` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_diagnostico` MODIFY COLUMN `codigo` VARCHAR(10) NOT NULL COMMENT 'Código alfanumérico estándar (ej: A00.0)';
ALTER TABLE `cat_diagnostico` MODIFY COLUMN `descripcion` VARCHAR(500) NOT NULL COMMENT 'Descripción clínica de la patología';
ALTER TABLE `cat_diagnostico` MODIFY COLUMN `capitulo` VARCHAR(150) NULL COMMENT 'Grupo o capítulo al que pertenece la enfermedad';
ALTER TABLE `cat_diagnostico` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el diagnóstico está vigente';
ALTER TABLE `cat_diagnostico` MODIFY COLUMN `notificable` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si la enfermedad es de reporte obligatorio a vigilancia';
ALTER TABLE `cat_diagnostico` MODIFY COLUMN `notificacionInmediata` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica si se debe notificar en menos de 24 horas';

-- =============================================
-- TABLA: audit_logs
-- =============================================
ALTER TABLE `audit_logs` COMMENT = 'Registro de trazabilidad de acciones críticas realizadas en el sistema';

ALTER TABLE `audit_logs` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `audit_logs` MODIFY COLUMN `usuarioId` INT NULL COMMENT 'ID del usuario que realizó la acción';
ALTER TABLE `audit_logs` MODIFY COLUMN `accion` VARCHAR(50) NOT NULL COMMENT 'Tipo de operación (CREATE, UPDATE, DELETE, LOGIN)';
ALTER TABLE `audit_logs` MODIFY COLUMN `entidad` VARCHAR(100) NOT NULL COMMENT 'Nombre de la tabla o entidad afectada';
ALTER TABLE `audit_logs` MODIFY COLUMN `entidadId` INT NULL COMMENT 'ID del registro específico afectado';
ALTER TABLE `audit_logs` MODIFY COLUMN `detalle` TEXT NULL COMMENT 'Descripción detallada del cambio o error';
ALTER TABLE `audit_logs` MODIFY COLUMN `ip` VARCHAR(45) NULL COMMENT 'Dirección IP del cliente';
ALTER TABLE `audit_logs` MODIFY COLUMN `duracionMs` INT NULL COMMENT 'Tiempo de respuesta del servidor en milisegundos';
ALTER TABLE `audit_logs` MODIFY COLUMN `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora exacta del evento';

-- =============================================
-- TABLA: parametros_sistema
-- =============================================
ALTER TABLE `parametros_sistema` COMMENT = 'Configuración global de variables de operación del sistema';

ALTER TABLE `parametros_sistema` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `parametros_sistema` MODIFY COLUMN `clave` VARCHAR(50) NOT NULL COMMENT 'Nombre único de la variable (ej: TIEMPO_SESION)';
ALTER TABLE `parametros_sistema` MODIFY COLUMN `valor` VARCHAR(500) NOT NULL COMMENT 'Valor asignado a la configuración';
ALTER TABLE `parametros_sistema` MODIFY COLUMN `descripcion` VARCHAR(200) NULL COMMENT 'Explicación del impacto del parámetro en el sistema';
ALTER TABLE `parametros_sistema` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de creación inicial';
ALTER TABLE `parametros_sistema` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última actualización';

-- =============================================
-- TABLA: dispensaciones
-- =============================================
ALTER TABLE `dispensaciones` COMMENT = 'Registro de la entrega física de medicamentos al paciente';

ALTER TABLE `dispensaciones` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `dispensaciones` MODIFY COLUMN `recetaId` INT NOT NULL COMMENT 'ID de la receta que se está surtiendo';
ALTER TABLE `dispensaciones` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario de farmacia que entrega';
ALTER TABLE `dispensaciones` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento donde ocurre la entrega';
ALTER TABLE `dispensaciones` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de la entrega';

-- =============================================
-- TABLA: dispensacion_detalles
-- =============================================
ALTER TABLE `dispensacion_detalles` COMMENT = 'Detalle de las unidades entregadas por cada ítem de la receta';

ALTER TABLE `dispensacion_detalles` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `dispensacion_detalles` MODIFY COLUMN `dispensacionId` INT NOT NULL COMMENT 'ID de la transacción de dispensación';
ALTER TABLE `dispensacion_detalles` MODIFY COLUMN `detalleRecetaId` INT NOT NULL COMMENT 'ID del renglón de la receta original';
ALTER TABLE `dispensacion_detalles` MODIFY COLUMN `inventarioId` INT NOT NULL COMMENT 'ID del registro de inventario (lote) de donde salió el producto';
ALTER TABLE `dispensacion_detalles` MODIFY COLUMN `cantidad` INT NOT NULL COMMENT 'Cantidad física entregada al paciente';

-- =============================================
-- TABLA: departamentos
-- =============================================
ALTER TABLE `departamentos` COMMENT = 'Listado de los 18 departamentos de Honduras';

ALTER TABLE `departamentos` MODIFY COLUMN `id` INT NOT NULL COMMENT 'Identificador único (Código INE)';
ALTER TABLE `departamentos` MODIFY COLUMN `codigo` VARCHAR(2) NOT NULL COMMENT 'Código alfanumérico de 2 dígitos (ej: 01, 08)';
ALTER TABLE `departamentos` MODIFY COLUMN `nombre` VARCHAR(50) NOT NULL COMMENT 'Nombre oficial del departamento';

-- =============================================
-- TABLA: municipios
-- =============================================
ALTER TABLE `municipios` COMMENT = 'Listado de los 298 municipios de Honduras';

ALTER TABLE `municipios` MODIFY COLUMN `id` INT NOT NULL COMMENT 'Identificador único (Código INE de 4 dígitos)';
ALTER TABLE `municipios` MODIFY COLUMN `codigo` VARCHAR(4) NOT NULL COMMENT 'Código alfanumérico de 4 dígitos (ej: 0801)';
ALTER TABLE `municipios` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre oficial del municipio';
ALTER TABLE `municipios` MODIFY COLUMN `departamentoId` INT NOT NULL COMMENT 'ID del departamento al que pertenece';

-- =============================================
-- TABLA: agendas_base
-- =============================================
ALTER TABLE `agendas_base` COMMENT = 'Definición de horarios laborales recurrentes de los médicos';

ALTER TABLE `agendas_base` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `agendas_base` MODIFY COLUMN `medicoId` INT NOT NULL COMMENT 'ID del médico dueño de la agenda';
ALTER TABLE `agendas_base` MODIFY COLUMN `establecimientoId` INT NOT NULL DEFAULT 1 COMMENT 'ID del establecimiento donde labora en este horario';
ALTER TABLE `agendas_base` MODIFY COLUMN `diaSemana` INT NOT NULL COMMENT 'Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)';
ALTER TABLE `agendas_base` MODIFY COLUMN `horaInicio` VARCHAR(5) NOT NULL COMMENT 'Hora de inicio de la jornada (formato HH:mm)';
ALTER TABLE `agendas_base` MODIFY COLUMN `horaFin` VARCHAR(5) NOT NULL COMMENT 'Hora de fin de la jornada (formato HH:mm)';
ALTER TABLE `agendas_base` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si este horario está vigente';
ALTER TABLE `agendas_base` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro de la agenda';
ALTER TABLE `agendas_base` MODIFY COLUMN `actualizadoEn` DATETIME(3) NULL COMMENT 'Fecha de última modificación de horarios';

-- =============================================
-- TABLA: excepciones_agenda
-- =============================================
ALTER TABLE `excepciones_agenda` COMMENT = 'Registro de ausencias o cambios temporales en la disponibilidad médica';

ALTER TABLE `excepciones_agenda` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `medicoId` INT NOT NULL COMMENT 'ID del médico afectado por la excepción';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `establecimientoId` INT NOT NULL DEFAULT 1 COMMENT 'ID del establecimiento donde aplica la excepción';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `tipo` ENUM('VACACIONES_NORMALES','VACACIONES_PROFILACTICAS','CURSO_CONGRESO','INCAPACIDAD','PERMISO_PERSONAL','OTRO') NOT NULL COMMENT 'Motivo de la ausencia (Vacaciones, Incapacidad, etc.)';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `fechaInicio` DATETIME(3) NOT NULL COMMENT 'Fecha y hora de inicio de la excepción';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `fechaFin` DATETIME(3) NOT NULL COMMENT 'Fecha y hora de fin de la excepción';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `descripcion` VARCHAR(500) NULL COMMENT 'Descripción detallada o notas administrativas';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro del evento';
ALTER TABLE `excepciones_agenda` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del usuario que registró la excepción';

-- =============================================
-- TABLA: cat_vacunas
-- =============================================
ALTER TABLE `cat_vacunas` COMMENT = 'Catálogo maestro de vacunas autorizadas (Esquema PAI)';

ALTER TABLE `cat_vacunas` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `cat_vacunas` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre oficial de la vacuna (ej: BCG, Sabin)';
ALTER TABLE `cat_vacunas` MODIFY COLUMN `descripcion` VARCHAR(500) NULL COMMENT 'Descripción de la enfermedad que previene';
ALTER TABLE `cat_vacunas` MODIFY COLUMN `tipo` ENUM('VIRAL_ATENUADA','VIRAL_INACTIVADA','BACTERIANA_ATENUADA','BACTERIANA_INACTIVADA','RECOMBINANTE','ARN_MENSAJERO','TOXOIDE') NOT NULL DEFAULT 'VIRAL_ATENUADA' COMMENT 'Naturaleza biológica de la vacuna';
ALTER TABLE `cat_vacunas` MODIFY COLUMN `poblacionMeta` VARCHAR(100) NULL COMMENT 'Grupo de edad o condición para la cual está indicada';
ALTER TABLE `cat_vacunas` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si la vacuna está vigente en el esquema nacional';
ALTER TABLE `cat_vacunas` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro en el catálogo';

-- =============================================
-- TABLA: esquemas_vacunacion
-- =============================================
ALTER TABLE `esquemas_vacunacion` COMMENT = 'Definición de las dosis y tiempos de aplicación por cada vacuna';

ALTER TABLE `esquemas_vacunacion` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `esquemas_vacunacion` MODIFY COLUMN `vacunaId` INT NOT NULL COMMENT 'ID de la vacuna asociada';
ALTER TABLE `esquemas_vacunacion` MODIFY COLUMN `numeroDosis` INT NOT NULL COMMENT 'Orden de la dosis (1=Primera, 2=Segunda, 3=Tercera, 4=Refuerzo)';
ALTER TABLE `esquemas_vacunacion` MODIFY COLUMN `edadRecomendadaMeses` INT NOT NULL COMMENT 'Edad ideal del paciente en meses para la dosis';
ALTER TABLE `esquemas_vacunacion` MODIFY COLUMN `intervaloMinimoDias` INT NULL COMMENT 'Tiempo mínimo de espera desde la dosis previa';
ALTER TABLE `esquemas_vacunacion` MODIFY COLUMN `descripcion` VARCHAR(200) NULL COMMENT 'Notas sobre la aplicación (ej: Dosis única)';

-- =============================================
-- TABLA: lotes_vacunas
-- =============================================
ALTER TABLE `lotes_vacunas` COMMENT = 'Gestión de lotes específicos de vacunas y su inventario';

ALTER TABLE `lotes_vacunas` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `vacunaId` INT NOT NULL COMMENT 'ID de la vacuna';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `codigoLote` VARCHAR(50) NOT NULL COMMENT 'Código alfanumérico del lote (fabricante)';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `fabricante` VARCHAR(100) NULL COMMENT 'Laboratorio productor del biológico';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `fechaVencimiento` DATETIME(3) NOT NULL COMMENT 'Fecha de caducidad del lote';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `cantidadInicial` INT NOT NULL COMMENT 'Cantidad de dosis recibidas originalmente';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `cantidadActual` INT NOT NULL COMMENT 'Dosis disponibles actualmente';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'ID del establecimiento custodio del lote';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el lote puede ser utilizado';
ALTER TABLE `lotes_vacunas` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro en el sistema';

-- =============================================
-- TABLA: movimientos_vacunas
-- =============================================
ALTER TABLE `movimientos_vacunas` COMMENT = 'Registro detallado de transacciones físicas de biológicos';

ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `loteId` INT NOT NULL COMMENT 'ID del lote afectado';
ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `tipo` ENUM('ENTRADA','SALIDA','APLICACION','AJUSTE','AJUSTE_POSITIVO','AJUSTE_NEGATIVO','PERDIDA_CADENA_FRIO','FRASCO_QUEBRADO','VENCIMIENTO') NOT NULL COMMENT 'Tipo de transacción de inventario';
ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `cantidad` INT NOT NULL COMMENT 'Número de dosis (positivo para ingresos, negativo para egresos)';
ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `motivo` VARCHAR(200) NULL COMMENT 'Explicación del movimiento';
ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario que registró la transacción';
ALTER TABLE `movimientos_vacunas` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora del registro';

-- =============================================
-- TABLA: registros_vacunacion
-- =============================================
ALTER TABLE `registros_vacunacion` COMMENT = 'Registro histórico de la aplicación de una dosis a un paciente';

ALTER TABLE `registros_vacunacion` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente inmunizado';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `vacunaId` INT NOT NULL COMMENT 'ID de la vacuna aplicada';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `esquemaId` INT NULL COMMENT 'ID de la dosis dentro del esquema (si aplica)';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `loteId` INT NOT NULL COMMENT 'ID del lote físico utilizado';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `fechaAplicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de la aplicación';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `sitioAplicacion` VARCHAR(50) NULL COMMENT 'Lugar anatómico (ej: Brazo derecho)';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `viaAplicacion` VARCHAR(50) NULL COMMENT 'Técnica utilizada (ej: Intramuscular)';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Notas sobre reacciones adversas o incidentes';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `establecimientoId` INT NOT NULL COMMENT 'Establecimiento donde se aplicó';
ALTER TABLE `registros_vacunacion` MODIFY COLUMN `aplicadoPorId` INT NOT NULL COMMENT 'Usuario (enfermera/médico) que administró la dosis';

-- =============================================
-- TABLA: notificaciones_epidemiologicas
-- =============================================
ALTER TABLE `notificaciones_epidemiologicas` COMMENT = 'Reporte de enfermedades de vigilancia obligatoria para salud pública';

ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente afectado';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `historiaId` INT NOT NULL COMMENT 'ID del encuentro clínico donde se detectó';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `diagnosticoCIE10` VARCHAR(10) NOT NULL COMMENT 'Código CIE-10 de la enfermedad sospechosa/confirmada';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `latitud` DECIMAL(10,8) NULL COMMENT 'Coordenada geográfica (Eje Y) para mapas de calor';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `longitud` DECIMAL(11,8) NULL COMMENT 'Coordenada geográfica (Eje X) para mapas de calor';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `direccionDetallada` TEXT NULL COMMENT 'Croquis o puntos de referencia del domicilio';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `fechaInicioSintomas` DATE NULL COMMENT 'Fecha estimada del primer síntoma reportado';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `antecedentesViaje` TEXT NULL COMMENT 'Historial de desplazamientos recientes del paciente';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `lugaresVisitados` TEXT NULL COMMENT 'Centros poblados o áreas visitadas';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Información epidemiológica adicional';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de creación del reporte';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `creadoPorId` INT NULL COMMENT 'ID del médico que detectó el caso';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE' COMMENT 'Estado del proceso de investigación (PENDIENTE, NOTIFICADO)';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `gestionadoEn` DATETIME(3) NULL COMMENT 'Fecha de cierre o escalamiento de la investigación';
ALTER TABLE `notificaciones_epidemiologicas` MODIFY COLUMN `gestionadoPorId` INT NULL COMMENT 'ID del epidemiólogo que validó el caso';

-- =============================================
-- TABLA: ingresos_hospitalarios
-- =============================================
ALTER TABLE `ingresos_hospitalarios` COMMENT = 'Representa el ingreso de un paciente a una cama del hospital';

ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `pacienteId` INT NOT NULL COMMENT 'ID del paciente que ingresa';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `camaId` INT NOT NULL COMMENT 'ID de la cama asignada';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `servicioId` INT NOT NULL COMMENT 'ID del servicio que lo admite';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `fechaIngreso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de ingreso';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `motivoIngreso` TEXT NOT NULL COMMENT 'Motivo clínico del ingreso';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `cie10Ingreso` VARCHAR(10) NULL COMMENT 'Código CIE-10 presuntivo';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `diagnosticoIngreso` VARCHAR(500) NULL COMMENT 'Descripción del diagnóstico presuntivo';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `medicoIngresoId` INT NOT NULL COMMENT 'ID del médico que autoriza el ingreso';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `estado` ENUM('ACTIVO','EGRESADO','TRASLADADO','FALLECIDO') NOT NULL DEFAULT 'ACTIVO' COMMENT 'Estado actual del internamiento';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro en el sistema';
ALTER TABLE `ingresos_hospitalarios` MODIFY COLUMN `creadoPorId` INT NOT NULL COMMENT 'ID del usuario que registró el ingreso (admisionista)';

-- =============================================
-- TABLA: kardex_medicamentos
-- =============================================
ALTER TABLE `kardex_medicamentos` COMMENT = 'Registro de administración de medicamentos (Kardex)';

ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `ingresoId` INT NOT NULL COMMENT 'ID del ingreso hospitalario';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `medicamentoId` INT NOT NULL COMMENT 'ID del medicamento prescrito';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `dosis` VARCHAR(100) NOT NULL COMMENT 'Dosis a administrar';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `via` VARCHAR(50) NULL COMMENT 'Vía de administración';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `fechaProgramada` DATETIME(3) NOT NULL COMMENT 'Fecha y hora programada para la dosis';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `fechaAplicacion` DATETIME(3) NULL COMMENT 'Fecha y hora real de aplicación';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `estado` ENUM('PENDIENTE','ADMINISTRADO','OMITIDO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE' COMMENT 'Estado de la administración';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Notas de enfermería sobre la aplicación';
ALTER TABLE `kardex_medicamentos` MODIFY COLUMN `enfermeraId` INT NOT NULL COMMENT 'ID del personal que registró la aplicación';

-- =============================================
-- TABLA: control_signos_vitales
-- =============================================
ALTER TABLE `control_signos_vitales` COMMENT = 'Registro frecuente de signos vitales por enfermería';

ALTER TABLE `control_signos_vitales` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `ingresoId` INT NOT NULL COMMENT 'ID del ingreso hospitalario';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de la toma';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `frecuenciaCardiaca` INT NULL COMMENT 'Latidos por minuto';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `frecuenciaRespiratoria` INT NULL COMMENT 'Respiraciones por minuto';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `presionArterial` VARCHAR(20) NULL COMMENT 'Tensión arterial (ej: 120/80)';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `temperatura` DECIMAL(4, 2) NULL COMMENT 'Temperatura corporal (°C)';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `saturacionOxigeno` INT NULL COMMENT 'Saturación de oxígeno (%)';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `pesoKg` DECIMAL(5, 2) NULL COMMENT 'Peso del paciente (kg)';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `glucoMetria` INT NULL COMMENT 'Nivel de glucosa en sangre';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `observaciones` TEXT NULL COMMENT 'Observaciones de enfermería';
ALTER TABLE `control_signos_vitales` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario que registró los signos';

-- =============================================
-- TABLA: notas_evolucion
-- =============================================
ALTER TABLE `notas_evolucion` COMMENT = 'Registro cronológico del progreso médico de un paciente hospitalizado';

ALTER TABLE `notas_evolucion` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `ingresoId` INT NOT NULL COMMENT 'ID del ingreso hospitalario al que pertenece la nota';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de la evaluación';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `nota` TEXT NOT NULL COMMENT 'Relato médico de la evolución';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `frecuenciaCardiaca` INT NULL COMMENT 'Frecuencia cardíaca en el momento';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `frecuenciaRespiratoria` INT NULL COMMENT 'Frecuencia respiratoria en el momento';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `presionArterial` VARCHAR(20) NULL COMMENT 'Presión arterial registrada';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `temperatura` DECIMAL(4, 2) NULL COMMENT 'Temperatura corporal registrada';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `saturacionOxigeno` INT NULL COMMENT 'Saturación de oxígeno registrada';
ALTER TABLE `notas_evolucion` MODIFY COLUMN `medicoId` INT NOT NULL COMMENT 'ID del médico que realiza la nota';

-- =============================================
-- TABLA: egresos_hospitalarios
-- =============================================
ALTER TABLE `egresos_hospitalarios` COMMENT = 'Representa el alta o egreso de un paciente hospitalizado';

ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `ingresoId` INT NOT NULL COMMENT 'ID del ingreso asociado';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `fechaEgreso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora de egreso';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `tipoEgreso` ENUM('ALTA_MEDICA','ALTA_VOLUNTARIA','TRASLADADO_OTRO_HOSPITAL','FALLECIMIENTO','FUGA') NOT NULL COMMENT 'Tipo de egreso (Alta médica, Traslado, Fallecimiento, Voluntario)';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `condicionEgreso` TEXT NOT NULL COMMENT 'Condición del paciente al egreso';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `cie10Egreso` VARCHAR(10) NULL COMMENT 'Código CIE-10 final o de egreso';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `epicrisis` TEXT NULL COMMENT 'Resumen clínico final (Epicrisis)';
ALTER TABLE `egresos_hospitalarios` MODIFY COLUMN `medicoEgresoId` INT NOT NULL COMMENT 'ID del médico que da el alta';

-- =============================================
-- TABLA: movimientos_hospitalarios
-- =============================================
ALTER TABLE `movimientos_hospitalarios` COMMENT = 'Historial de movimientos de cama de un paciente dentro de una misma hospitalización';

ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `ingresoId` INT NOT NULL COMMENT 'ID del ingreso hospitalario';
ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `camaOrigenId` INT NOT NULL COMMENT 'ID de la cama de origen';
ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `camaDestinoId` INT NOT NULL COMMENT 'ID de la cama de destino';
ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `fechaMovimiento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha y hora del traslado';
ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `motivo` VARCHAR(250) NULL COMMENT 'Motivo del traslado (ej: empeoramiento, paso a cuidados intermedios)';
ALTER TABLE `movimientos_hospitalarios` MODIFY COLUMN `usuarioId` INT NOT NULL COMMENT 'ID del usuario que realizó el traslado en el sistema';

-- =============================================
-- TABLA: imagenes_login
-- =============================================
ALTER TABLE `imagenes_login` COMMENT = 'Representa las imágenes que se muestran en el carrusel de la pantalla de login';

ALTER TABLE `imagenes_login` MODIFY COLUMN `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Identificador único';
ALTER TABLE `imagenes_login` MODIFY COLUMN `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre descriptivo de la imagen';
ALTER TABLE `imagenes_login` MODIFY COLUMN `titulo` VARCHAR(100) NULL COMMENT 'Título opcional que se muestra sobre la imagen';
ALTER TABLE `imagenes_login` MODIFY COLUMN `descripcion` VARCHAR(300) NULL COMMENT 'Descripción opcional que se muestra sobre la imagen';
ALTER TABLE `imagenes_login` MODIFY COLUMN `mimetype` VARCHAR(50) NOT NULL COMMENT 'Tipo de contenido (image/jpeg, image/png, etc.)';
ALTER TABLE `imagenes_login` MODIFY COLUMN `datos` MEDIUMBLOB NOT NULL COMMENT 'Datos binarios de la imagen';
ALTER TABLE `imagenes_login` MODIFY COLUMN `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si la imagen está activa para mostrarse';
ALTER TABLE `imagenes_login` MODIFY COLUMN `orden` INT NOT NULL DEFAULT 0 COMMENT 'Orden de aparición en el carrusel';
ALTER TABLE `imagenes_login` MODIFY COLUMN `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de registro';
ALTER TABLE `imagenes_login` MODIFY COLUMN `actualizadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT 'Fecha de última actualización';

-- =============================================
-- TABLA: configuraciones
-- =============================================
ALTER TABLE `configuraciones` COMMENT = 'Configuración visual del sistema (Nombre, Logotipo)';

ALTER TABLE `configuraciones` MODIFY COLUMN `id` INT NOT NULL DEFAULT 1 COMMENT 'Identificador único';
ALTER TABLE `configuraciones` MODIFY COLUMN `siglas_sistema` VARCHAR(191) NOT NULL DEFAULT 'SISS' COMMENT 'Siglas del sistema';
ALTER TABLE `configuraciones` MODIFY COLUMN `nombre_sistema` VARCHAR(191) NOT NULL DEFAULT 'Sistema Integral de Servicios de Salud' COMMENT 'Nombre completo del sistema';
ALTER TABLE `configuraciones` MODIFY COLUMN `logo` MEDIUMBLOB NULL COMMENT 'Logotipo institucional';
ALTER TABLE `configuraciones` MODIFY COLUMN `logo_mimetype` VARCHAR(191) NULL COMMENT 'Tipo de archivo del logo';
ALTER TABLE `configuraciones` MODIFY COLUMN `actualizado_en` DATETIME(3) NOT NULL COMMENT 'Fecha de última actualización';
