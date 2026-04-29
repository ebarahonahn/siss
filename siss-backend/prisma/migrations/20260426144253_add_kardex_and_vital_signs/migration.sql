-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(200) NULL,
    `permisos` JSON NOT NULL,

    UNIQUE INDEX `roles_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroEmpleado` VARCHAR(20) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `correo` VARCHAR(150) NOT NULL,
    `contrasenaHash` VARCHAR(255) NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `especialidadId` INTEGER NULL,
    `numeroColegiado` VARCHAR(50) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `ultimoAcceso` DATETIME(3) NULL,
    `rolId` INTEGER NULL,
    `establecimientoId` INTEGER NULL,

    UNIQUE INDEX `usuarios_numeroEmpleado_key`(`numeroEmpleado`),
    UNIQUE INDEX `usuarios_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sesiones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `refreshTokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(500) NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `establecimientos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `tipo` ENUM('HOSPITAL_NACIONAL', 'HOSPITAL_REGIONAL', 'CENTRO_SALUD', 'CLINICA_PERIFERICA', 'CESAMO', 'CESAR') NOT NULL,
    `departamentoId` INTEGER NOT NULL,
    `municipioId` INTEGER NOT NULL,
    `telefono` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NULL,
    `eliminadoEn` DATETIME(3) NULL,
    `creadoPorId` INTEGER NULL,
    `actualizadoPorId` INTEGER NULL,
    `eliminadoPorId` INTEGER NULL,

    UNIQUE INDEX `establecimientos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_servicios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(300) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `cat_servicios_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reportes_disponibles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(200) NULL,
    `categoria` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `tipo` VARCHAR(10) NOT NULL,
    `permiso` VARCHAR(50) NOT NULL,
    `icono` VARCHAR(50) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `orden` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `reportes_disponibles_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `establecimientoId` INTEGER NOT NULL,
    `catServicioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_tipos_habitacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(200) NULL,

    UNIQUE INDEX `cat_tipos_habitacion_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_tipos_cama` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` VARCHAR(200) NULL,

    UNIQUE INDEX `cat_tipos_cama_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `codigo` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `servicioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `habitaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(20) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `salaId` INTEGER NOT NULL,
    `tipoHabitacionId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `camas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `estado` ENUM('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO', 'LIMPIEZA') NOT NULL DEFAULT 'DISPONIBLE',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `habitacionId` INTEGER NOT NULL,
    `tipoCamaId` INTEGER NOT NULL,

    UNIQUE INDEX `camas_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asignaciones_usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `servicioId` INTEGER NULL,
    `rolId` INTEGER NULL,
    `especialidadId` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `permisos` JSON NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `asignaciones_usuario_usuarioId_establecimientoId_servicioId__key`(`usuarioId`, `establecimientoId`, `servicioId`, `especialidadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `especialidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(300) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NULL,
    `creadoPorId` INTEGER NULL,
    `actualizadoPorId` INTEGER NULL,

    UNIQUE INDEX `especialidades_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroExpediente` VARCHAR(20) NOT NULL,
    `dni` VARCHAR(13) NOT NULL,
    `nombres` VARCHAR(100) NOT NULL,
    `apellidos` VARCHAR(100) NOT NULL,
    `fechaNacimiento` DATE NOT NULL,
    `sexoId` INTEGER NOT NULL,
    `tipoSangreId` INTEGER NULL,
    `telefono` VARCHAR(20) NULL,
    `telefonoEmergencia` VARCHAR(20) NULL,
    `correo` VARCHAR(150) NULL,
    `direccion` VARCHAR(300) NULL,
    `departamentoId` INTEGER NOT NULL,
    `municipioId` INTEGER NOT NULL,
    `comunidad` VARCHAR(100) NULL,
    `escolaridadId` INTEGER NULL,
    `ocupacionId` INTEGER NULL,
    `estadoCivilId` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaRegistro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NULL,
    `eliminadoEn` DATETIME(3) NULL,
    `establecimientoId` INTEGER NOT NULL,
    `creadoPorId` INTEGER NOT NULL,
    `actualizadoPorId` INTEGER NULL,
    `eliminadoPorId` INTEGER NULL,

    UNIQUE INDEX `pacientes_numeroExpediente_key`(`numeroExpediente`),
    UNIQUE INDEX `pacientes_dni_key`(`dni`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_sexos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `cat_sexos_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_tipos_sangre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `cat_tipos_sangre_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_escolaridades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `cat_escolaridades_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_estados_civiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `cat_estados_civiles_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_ocupaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `cat_ocupaciones_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alergias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `tipo` ENUM('MEDICAMENTO', 'ALIMENTO', 'AMBIENTAL', 'LATEX', 'OTRO') NOT NULL,
    `descripcion` VARCHAR(300) NOT NULL,
    `severidad` ENUM('LEVE', 'MODERADA', 'SEVERA') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `medicoId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `fechaHora` DATETIME(3) NOT NULL,
    `duracionMinutos` INTEGER NOT NULL DEFAULT 20,
    `tipo` ENUM('CONSULTA_GENERAL', 'ESPECIALIDAD', 'CONTROL', 'URGENCIA', 'VACUNACION', 'PLANIFICACION') NOT NULL,
    `estado` ENUM('PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO', 'EN_SALA') NOT NULL DEFAULT 'PROGRAMADA',
    `motivo` VARCHAR(500) NULL,
    `notas` TEXT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NULL,
    `canceladoPorId` INTEGER NULL,
    `especialidadId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historia_clinica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `medicoId` INTEGER NOT NULL,
    `citaId` INTEGER NULL,
    `plantillaId` INTEGER NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `subjetivo` TEXT NOT NULL,
    `objetivo` TEXT NOT NULL,
    `analisis` TEXT NOT NULL,
    `plan` TEXT NOT NULL,
    `presionSistolica` INTEGER NULL,
    `presionDiastolica` INTEGER NULL,
    `frecuenciaCardiaca` INTEGER NULL,
    `temperatura` DECIMAL(4, 1) NULL,
    `peso` DECIMAL(5, 2) NULL,
    `talla` DECIMAL(4, 1) NULL,
    `saturacionO2` INTEGER NULL,
    `semanaEpidemiologica` INTEGER NULL,
    `actualizadoEn` DATETIME(3) NULL,
    `eliminadoEn` DATETIME(3) NULL,
    `actualizadoPorId` INTEGER NULL,
    `eliminadoPorId` INTEGER NULL,
    `proximaCitaId` INTEGER NULL,

    UNIQUE INDEX `historia_clinica_citaId_key`(`citaId`),
    UNIQUE INDEX `historia_clinica_proximaCitaId_key`(`proximaCitaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diagnosticos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `codigoCIE10` VARCHAR(10) NOT NULL,
    `descripcion` VARCHAR(500) NOT NULL,
    `tipo` ENUM('PRINCIPAL', 'SECUNDARIO', 'COMORBILIDAD') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `incapacidades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `fechaInicio` DATE NOT NULL,
    `fechaFin` DATE NOT NULL,
    `dias` INTEGER NOT NULL,
    `tipo` ENUM('LABORAL', 'ESCOLAR', 'DEPORTIVA') NOT NULL DEFAULT 'LABORAL',
    `motivo` VARCHAR(500) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medicamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `nombreGenerico` VARCHAR(200) NOT NULL,
    `nombreComercial` VARCHAR(200) NULL,
    `presentacion` VARCHAR(100) NOT NULL,
    `concentracion` VARCHAR(50) NOT NULL,
    `via` ENUM('ORAL', 'INYECTABLE', 'TOPICA', 'INHALATORIA', 'SUBLINGUAL', 'RECTAL', 'OFTALMICA', 'OTICA') NOT NULL,
    `grupoTerapeutico` VARCHAR(100) NOT NULL,
    `requiereReceta` BOOLEAN NOT NULL DEFAULT true,
    `esControlado` BOOLEAN NOT NULL DEFAULT false,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NULL,
    `eliminadoEn` DATETIME(3) NULL,
    `creadoPorId` INTEGER NULL,
    `actualizadoPorId` INTEGER NULL,
    `eliminadoPorId` INTEGER NULL,

    UNIQUE INDEX `medicamentos_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicamentoId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `cantidadActual` INTEGER NOT NULL DEFAULT 0,
    `cantidadMinima` INTEGER NOT NULL DEFAULT 10,
    `lote` VARCHAR(50) NULL,
    `fechaVencimiento` DATE NULL,
    `ubicacion` VARCHAR(100) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NULL,
    `eliminadoEn` DATETIME(3) NULL,
    `creadoPorId` INTEGER NULL,
    `actualizadoPorId` INTEGER NULL,
    `eliminadoPorId` INTEGER NULL,

    UNIQUE INDEX `inventario_medicamentoId_establecimientoId_lote_key`(`medicamentoId`, `establecimientoId`, `lote`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `inventarioId` INTEGER NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'AJUSTE', 'CADUCADO', 'PERDIDA', 'DISPENSACION') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `motivo` VARCHAR(200) NULL,
    `usuarioId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recetas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `estado` ENUM('PENDIENTE', 'DISPENSADA', 'PARCIAL', 'CANCELADA', 'DEMANDA_INSATISFECHA') NOT NULL DEFAULT 'PENDIENTE',
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dispensadaEn` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_receta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recetaId` INTEGER NOT NULL,
    `medicamentoId` INTEGER NOT NULL,
    `dosis` VARCHAR(100) NOT NULL,
    `frecuencia` VARCHAR(100) NOT NULL,
    `duracion` VARCHAR(100) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `cantidadEntregada` INTEGER NOT NULL DEFAULT 0,
    `ultimaDispensacion` DATETIME(3) NULL,
    `indicaciones` VARCHAR(500) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paciente_medicamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `medicamentoId` INTEGER NOT NULL,
    `dosis` VARCHAR(100) NOT NULL,
    `frecuencia` VARCHAR(100) NOT NULL,
    `inicio` DATE NOT NULL,
    `fin` DATE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_examenes_laboratorio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `categoria` VARCHAR(100) NOT NULL,
    `indicaciones` TEXT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `cat_examenes_laboratorio_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `examen_establecimientos` (
    `establecimientoId` INTEGER NOT NULL,
    `examenId` INTEGER NOT NULL,

    PRIMARY KEY (`establecimientoId`, `examenId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_laboratorio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `estado` ENUM('SOLICITADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
    `urgente` BOOLEAN NOT NULL DEFAULT false,
    `observaciones` TEXT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_solicitud_laboratorio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitudId` INTEGER NOT NULL,
    `examenId` INTEGER NOT NULL,
    `observaciones` VARCHAR(200) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resultados_laboratorio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitudId` INTEGER NOT NULL,
    `historiaId` INTEGER NULL,
    `prueba` VARCHAR(200) NOT NULL,
    `valor` VARCHAR(200) NOT NULL,
    `unidad` VARCHAR(50) NULL,
    `valorReferencia` VARCHAR(100) NULL,
    `anormal` BOOLEAN NOT NULL DEFAULT false,
    `observaciones` TEXT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_examenes_radiologia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `categoria` VARCHAR(100) NOT NULL,
    `indicaciones` TEXT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `cat_examenes_radiologia_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estudio_radiologia_establecimientos` (
    `establecimientoId` INTEGER NOT NULL,
    `estudioId` INTEGER NOT NULL,

    PRIMARY KEY (`establecimientoId`, `estudioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `solicitudes_radiologia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `estado` ENUM('SOLICITADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
    `urgente` BOOLEAN NOT NULL DEFAULT false,
    `observaciones` TEXT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `detalles_solicitud_radiologia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitudId` INTEGER NOT NULL,
    `estudioId` INTEGER NOT NULL,
    `observaciones` VARCHAR(200) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resultados_radiologia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `solicitudId` INTEGER NOT NULL,
    `hallazgos` TEXT NULL,
    `conclusion` TEXT NULL,
    `imageUrl` VARCHAR(500) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `establecimientoOrigenId` INTEGER NOT NULL,
    `establecimientoDestinoId` INTEGER NOT NULL,
    `especialidadDestino` VARCHAR(100) NOT NULL,
    `motivo` TEXT NOT NULL,
    `urgente` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('EMITIDO', 'RECIBIDO', 'ATENDIDO', 'RECHAZADO') NOT NULL DEFAULT 'EMITIDO',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plantillas_formulario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `especialidadId` INTEGER NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `descripcion` TEXT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `activa` BOOLEAN NOT NULL DEFAULT false,
    `creadoPorId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `plantillas_formulario_especialidadId_version_key`(`especialidadId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `secciones_formulario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plantillaId` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(300) NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `colapsable` BOOLEAN NOT NULL DEFAULT false,
    `visible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campos_formulario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seccionId` INTEGER NOT NULL,
    `tipo` ENUM('TEXTO', 'TEXTAREA', 'NUMERO', 'DECIMAL', 'FECHA', 'BOOLEANO', 'SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX_GRUPO', 'ESCALA', 'TABLA', 'SEPARADOR', 'TITULO') NOT NULL,
    `etiqueta` VARCHAR(150) NOT NULL,
    `clave` VARCHAR(80) NOT NULL,
    `placeholder` VARCHAR(200) NULL,
    `ayuda` VARCHAR(300) NULL,
    `requerido` BOOLEAN NOT NULL DEFAULT false,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `ancho` ENUM('CUARTO', 'TERCIO', 'MEDIO', 'COMPLETO') NOT NULL DEFAULT 'COMPLETO',
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `configuracion` JSON NULL,
    `condicionVisibilidad` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `respuestas_formulario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `historiaId` INTEGER NOT NULL,
    `plantillaId` INTEGER NOT NULL,
    `respuestas` JSON NOT NULL,
    `completado` BOOLEAN NOT NULL DEFAULT false,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `respuestas_formulario_historiaId_key`(`historiaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `triajes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `citaId` INTEGER NOT NULL,
    `pacienteId` INTEGER NOT NULL,
    `enfermeraId` INTEGER NOT NULL,
    `motivoConsulta` TEXT NOT NULL,
    `presionSistolica` INTEGER NULL,
    `presionDiastolica` INTEGER NULL,
    `frecuenciaCardiaca` INTEGER NULL,
    `frecuenciaRespiratoria` INTEGER NULL,
    `temperatura` DECIMAL(4, 1) NULL,
    `saturacionO2` INTEGER NULL,
    `glucometria` DECIMAL(5, 1) NULL,
    `peso` DECIMAL(5, 2) NULL,
    `talla` DECIMAL(4, 1) NULL,
    `escalaDolor` INTEGER NULL,
    `nivelConciencia` ENUM('ALERTA', 'RESPONDE_VOZ', 'RESPONDE_DOLOR', 'INCONSCIENTE') NOT NULL DEFAULT 'ALERTA',
    `categoria` ENUM('ROJO', 'NARANJA', 'AMARILLO', 'VERDE', 'AZUL') NOT NULL,
    `observaciones` TEXT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `triajes_citaId_key`(`citaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_diagnostico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(10) NOT NULL,
    `descripcion` VARCHAR(500) NOT NULL,
    `capitulo` VARCHAR(150) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `notificable` BOOLEAN NOT NULL DEFAULT false,
    `notificacionInmediata` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `cat_diagnostico_codigo_key`(`codigo`),
    INDEX `cat_diagnostico_codigo_idx`(`codigo`),
    INDEX `cat_diagnostico_descripcion_idx`(`descripcion`(100)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NULL,
    `accion` VARCHAR(50) NOT NULL,
    `entidad` VARCHAR(100) NOT NULL,
    `entidadId` INTEGER NULL,
    `detalle` TEXT NULL,
    `ip` VARCHAR(45) NULL,
    `duracionMs` INTEGER NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_timestamp_idx`(`timestamp`),
    INDEX `audit_logs_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parametros_sistema` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(50) NOT NULL,
    `valor` VARCHAR(500) NOT NULL,
    `descripcion` VARCHAR(200) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `parametros_sistema_clave_key`(`clave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dispensaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recetaId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dispensacion_detalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dispensacionId` INTEGER NOT NULL,
    `detalleRecetaId` INTEGER NOT NULL,
    `inventarioId` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departamentos` (
    `id` INTEGER NOT NULL,
    `codigo` VARCHAR(2) NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `departamentos_codigo_key`(`codigo`),
    UNIQUE INDEX `departamentos_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `municipios` (
    `id` INTEGER NOT NULL,
    `codigo` VARCHAR(4) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `departamentoId` INTEGER NOT NULL,

    UNIQUE INDEX `municipios_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agendas_base` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicoId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL DEFAULT 1,
    `diaSemana` INTEGER NOT NULL,
    `horaInicio` VARCHAR(5) NOT NULL,
    `horaFin` VARCHAR(5) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizadoEn` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agendas_base_medicoId_establecimientoId_diaSemana_horaInicio_key`(`medicoId`, `establecimientoId`, `diaSemana`, `horaInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `excepciones_agenda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `medicoId` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL DEFAULT 1,
    `tipo` ENUM('VACACIONES_NORMALES', 'VACACIONES_PROFILACTICAS', 'CURSO_CONGRESO', 'INCAPACIDAD', 'PERMISO_PERSONAL', 'OTRO') NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cat_vacunas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` VARCHAR(500) NULL,
    `tipo` ENUM('VIRAL_ATENUADA', 'VIRAL_INACTIVADA', 'BACTERIANA_ATENUADA', 'BACTERIANA_INACTIVADA', 'RECOMBINANTE', 'ARN_MENSAJERO', 'TOXOIDE') NOT NULL DEFAULT 'VIRAL_ATENUADA',
    `poblacionMeta` VARCHAR(100) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cat_vacunas_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `esquemas_vacunacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vacunaId` INTEGER NOT NULL,
    `numeroDosis` INTEGER NOT NULL,
    `edadRecomendadaMeses` INTEGER NOT NULL,
    `intervaloMinimoDias` INTEGER NULL,
    `descripcion` VARCHAR(200) NULL,

    UNIQUE INDEX `esquemas_vacunacion_vacunaId_numeroDosis_key`(`vacunaId`, `numeroDosis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lotes_vacunas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vacunaId` INTEGER NOT NULL,
    `codigoLote` VARCHAR(50) NOT NULL,
    `fabricante` VARCHAR(100) NULL,
    `fechaVencimiento` DATETIME(3) NOT NULL,
    `cantidadInicial` INTEGER NOT NULL,
    `cantidadActual` INTEGER NOT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lotes_vacunas_establecimientoId_vacunaId_codigoLote_key`(`establecimientoId`, `vacunaId`, `codigoLote`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_vacunas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loteId` INTEGER NOT NULL,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'APLICACION', 'AJUSTE', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'PERDIDA_CADENA_FRIO', 'FRASCO_QUEBRADO', 'VENCIMIENTO') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `motivo` VARCHAR(200) NULL,
    `usuarioId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registros_vacunacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `vacunaId` INTEGER NOT NULL,
    `esquemaId` INTEGER NULL,
    `loteId` INTEGER NOT NULL,
    `fechaAplicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sitioAplicacion` VARCHAR(50) NULL,
    `viaAplicacion` VARCHAR(50) NULL,
    `observaciones` TEXT NULL,
    `establecimientoId` INTEGER NOT NULL,
    `aplicadoPorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificaciones_epidemiologicas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `historiaId` INTEGER NOT NULL,
    `diagnosticoCIE10` VARCHAR(10) NOT NULL,
    `latitud` DECIMAL(10, 8) NULL,
    `longitud` DECIMAL(11, 8) NULL,
    `direccionDetallada` TEXT NULL,
    `fechaInicioSintomas` DATE NULL,
    `antecedentesViaje` TEXT NULL,
    `lugaresVisitados` TEXT NULL,
    `observaciones` TEXT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
    `gestionadoEn` DATETIME(3) NULL,
    `gestionadoPorId` INTEGER NULL,

    UNIQUE INDEX `notificaciones_epidemiologicas_historiaId_key`(`historiaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ingresos_hospitalarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pacienteId` INTEGER NOT NULL,
    `camaId` INTEGER NOT NULL,
    `servicioId` INTEGER NOT NULL,
    `fechaIngreso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivoIngreso` TEXT NOT NULL,
    `cie10Ingreso` VARCHAR(10) NULL,
    `diagnosticoIngreso` VARCHAR(500) NULL,
    `medicoIngresoId` INTEGER NOT NULL,
    `estado` ENUM('ACTIVO', 'EGRESADO', 'TRASLADADO', 'FALLECIDO') NOT NULL DEFAULT 'ACTIVO',
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kardex_medicamentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingresoId` INTEGER NOT NULL,
    `medicamentoId` INTEGER NOT NULL,
    `dosis` VARCHAR(100) NOT NULL,
    `via` VARCHAR(50) NULL,
    `fechaProgramada` DATETIME(3) NOT NULL,
    `fechaAplicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `estado` ENUM('PENDIENTE', 'ADMINISTRADO', 'OMITIDO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    `observaciones` TEXT NULL,
    `enfermeraId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `control_signos_vitales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingresoId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `frecuenciaCardiaca` INTEGER NULL,
    `frecuenciaRespiratoria` INTEGER NULL,
    `presionArterial` VARCHAR(20) NULL,
    `temperatura` DECIMAL(4, 2) NULL,
    `saturacionOxigeno` INTEGER NULL,
    `pesoKg` DECIMAL(5, 2) NULL,
    `glucoMetria` INTEGER NULL,
    `observaciones` TEXT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notas_evolucion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingresoId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nota` TEXT NOT NULL,
    `frecuenciaCardiaca` INTEGER NULL,
    `frecuenciaRespiratoria` INTEGER NULL,
    `presionArterial` VARCHAR(20) NULL,
    `temperatura` DECIMAL(4, 2) NULL,
    `saturacionOxigeno` INTEGER NULL,
    `medicoId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresos_hospitalarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingresoId` INTEGER NOT NULL,
    `fechaEgreso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipoEgreso` ENUM('ALTA_MEDICA', 'ALTA_VOLUNTARIA', 'TRASLADADO_OTRO_HOSPITAL', 'FALLECIMIENTO', 'FUGA') NOT NULL,
    `condicionEgreso` TEXT NOT NULL,
    `cie10Egreso` VARCHAR(10) NULL,
    `epicrisis` TEXT NULL,
    `medicoEgresoId` INTEGER NOT NULL,

    UNIQUE INDEX `egresos_hospitalarios_ingresoId_key`(`ingresoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimientos_hospitalarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ingresoId` INTEGER NOT NULL,
    `camaOrigenId` INTEGER NOT NULL,
    `camaDestinoId` INTEGER NOT NULL,
    `fechaMovimiento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `motivo` VARCHAR(250) NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_especialidadId_fkey` FOREIGN KEY (`especialidadId`) REFERENCES `especialidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sesiones` ADD CONSTRAINT `sesiones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `establecimientos` ADD CONSTRAINT `establecimientos_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `departamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `establecimientos` ADD CONSTRAINT `establecimientos_municipio_fkey_unique` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `establecimientos` ADD CONSTRAINT `establecimientos_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `establecimientos` ADD CONSTRAINT `establecimientos_actualizadoPorId_fkey` FOREIGN KEY (`actualizadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `establecimientos` ADD CONSTRAINT `establecimientos_eliminadoPorId_fkey` FOREIGN KEY (`eliminadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicios` ADD CONSTRAINT `servicios_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicios` ADD CONSTRAINT `servicios_catServicioId_fkey` FOREIGN KEY (`catServicioId`) REFERENCES `cat_servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `salas` ADD CONSTRAINT `salas_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `habitaciones` ADD CONSTRAINT `habitaciones_salaId_fkey` FOREIGN KEY (`salaId`) REFERENCES `salas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `habitaciones` ADD CONSTRAINT `habitaciones_tipoHabitacionId_fkey` FOREIGN KEY (`tipoHabitacionId`) REFERENCES `cat_tipos_habitacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camas` ADD CONSTRAINT `camas_habitacionId_fkey` FOREIGN KEY (`habitacionId`) REFERENCES `habitaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `camas` ADD CONSTRAINT `camas_tipoCamaId_fkey` FOREIGN KEY (`tipoCamaId`) REFERENCES `cat_tipos_cama`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_usuario` ADD CONSTRAINT `asignaciones_usuario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_usuario` ADD CONSTRAINT `asignaciones_usuario_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_usuario` ADD CONSTRAINT `asignaciones_usuario_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `servicios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_usuario` ADD CONSTRAINT `asignaciones_usuario_rolId_fkey` FOREIGN KEY (`rolId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asignaciones_usuario` ADD CONSTRAINT `asignaciones_usuario_especialidadId_fkey` FOREIGN KEY (`especialidadId`) REFERENCES `especialidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especialidades` ADD CONSTRAINT `especialidades_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `especialidades` ADD CONSTRAINT `especialidades_actualizadoPorId_fkey` FOREIGN KEY (`actualizadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `departamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_municipioId_fkey` FOREIGN KEY (`municipioId`) REFERENCES `municipios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_sexoId_fkey` FOREIGN KEY (`sexoId`) REFERENCES `cat_sexos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_tipoSangreId_fkey` FOREIGN KEY (`tipoSangreId`) REFERENCES `cat_tipos_sangre`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_escolaridadId_fkey` FOREIGN KEY (`escolaridadId`) REFERENCES `cat_escolaridades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_ocupacionId_fkey` FOREIGN KEY (`ocupacionId`) REFERENCES `cat_ocupaciones`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_estadoCivilId_fkey` FOREIGN KEY (`estadoCivilId`) REFERENCES `cat_estados_civiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_eliminadoPorId_fkey` FOREIGN KEY (`eliminadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alergias` ADD CONSTRAINT `alergias_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_canceladoPorId_fkey` FOREIGN KEY (`canceladoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_especialidadId_fkey` FOREIGN KEY (`especialidadId`) REFERENCES `especialidades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_actualizadoPorId_fkey` FOREIGN KEY (`actualizadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_eliminadoPorId_fkey` FOREIGN KEY (`eliminadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `citas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_plantillaId_fkey` FOREIGN KEY (`plantillaId`) REFERENCES `plantillas_formulario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historia_clinica` ADD CONSTRAINT `historia_clinica_proximaCitaId_fkey` FOREIGN KEY (`proximaCitaId`) REFERENCES `citas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diagnosticos` ADD CONSTRAINT `diagnosticos_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `incapacidades` ADD CONSTRAINT `incapacidades_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicamentos` ADD CONSTRAINT `medicamentos_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicamentos` ADD CONSTRAINT `medicamentos_actualizadoPorId_fkey` FOREIGN KEY (`actualizadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medicamentos` ADD CONSTRAINT `medicamentos_eliminadoPorId_fkey` FOREIGN KEY (`eliminadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventario` ADD CONSTRAINT `inventario_medicamentoId_fkey` FOREIGN KEY (`medicamentoId`) REFERENCES `medicamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventario` ADD CONSTRAINT `inventario_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventario` ADD CONSTRAINT `inventario_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventario` ADD CONSTRAINT `inventario_actualizadoPorId_fkey` FOREIGN KEY (`actualizadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventario` ADD CONSTRAINT `inventario_eliminadoPorId_fkey` FOREIGN KEY (`eliminadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_inventario` ADD CONSTRAINT `movimientos_inventario_inventarioId_fkey` FOREIGN KEY (`inventarioId`) REFERENCES `inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_receta` ADD CONSTRAINT `detalles_receta_recetaId_fkey` FOREIGN KEY (`recetaId`) REFERENCES `recetas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_receta` ADD CONSTRAINT `detalles_receta_medicamentoId_fkey` FOREIGN KEY (`medicamentoId`) REFERENCES `medicamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `paciente_medicamentos` ADD CONSTRAINT `paciente_medicamentos_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examen_establecimientos` ADD CONSTRAINT `examen_establecimientos_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `examen_establecimientos` ADD CONSTRAINT `examen_establecimientos_examenId_fkey` FOREIGN KEY (`examenId`) REFERENCES `cat_examenes_laboratorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_laboratorio` ADD CONSTRAINT `solicitudes_laboratorio_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_laboratorio` ADD CONSTRAINT `solicitudes_laboratorio_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_laboratorio` ADD CONSTRAINT `solicitudes_laboratorio_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_solicitud_laboratorio` ADD CONSTRAINT `detalles_solicitud_laboratorio_solicitudId_fkey` FOREIGN KEY (`solicitudId`) REFERENCES `solicitudes_laboratorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_solicitud_laboratorio` ADD CONSTRAINT `detalles_solicitud_laboratorio_examenId_fkey` FOREIGN KEY (`examenId`) REFERENCES `cat_examenes_laboratorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_laboratorio` ADD CONSTRAINT `resultados_laboratorio_solicitudId_fkey` FOREIGN KEY (`solicitudId`) REFERENCES `solicitudes_laboratorio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_laboratorio` ADD CONSTRAINT `resultados_laboratorio_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudio_radiologia_establecimientos` ADD CONSTRAINT `estudio_radiologia_establecimientos_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estudio_radiologia_establecimientos` ADD CONSTRAINT `estudio_radiologia_establecimientos_estudioId_fkey` FOREIGN KEY (`estudioId`) REFERENCES `cat_examenes_radiologia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_radiologia` ADD CONSTRAINT `solicitudes_radiologia_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_radiologia` ADD CONSTRAINT `solicitudes_radiologia_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitudes_radiologia` ADD CONSTRAINT `solicitudes_radiologia_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_solicitud_radiologia` ADD CONSTRAINT `detalles_solicitud_radiologia_solicitudId_fkey` FOREIGN KEY (`solicitudId`) REFERENCES `solicitudes_radiologia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `detalles_solicitud_radiologia` ADD CONSTRAINT `detalles_solicitud_radiologia_estudioId_fkey` FOREIGN KEY (`estudioId`) REFERENCES `cat_examenes_radiologia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resultados_radiologia` ADD CONSTRAINT `resultados_radiologia_solicitudId_fkey` FOREIGN KEY (`solicitudId`) REFERENCES `solicitudes_radiologia`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referidos` ADD CONSTRAINT `referidos_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referidos` ADD CONSTRAINT `referidos_establecimientoOrigenId_fkey` FOREIGN KEY (`establecimientoOrigenId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referidos` ADD CONSTRAINT `referidos_establecimientoDestinoId_fkey` FOREIGN KEY (`establecimientoDestinoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plantillas_formulario` ADD CONSTRAINT `plantillas_formulario_especialidadId_fkey` FOREIGN KEY (`especialidadId`) REFERENCES `especialidades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plantillas_formulario` ADD CONSTRAINT `plantillas_formulario_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `secciones_formulario` ADD CONSTRAINT `secciones_formulario_plantillaId_fkey` FOREIGN KEY (`plantillaId`) REFERENCES `plantillas_formulario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campos_formulario` ADD CONSTRAINT `campos_formulario_seccionId_fkey` FOREIGN KEY (`seccionId`) REFERENCES `secciones_formulario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas_formulario` ADD CONSTRAINT `respuestas_formulario_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `respuestas_formulario` ADD CONSTRAINT `respuestas_formulario_plantillaId_fkey` FOREIGN KEY (`plantillaId`) REFERENCES `plantillas_formulario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `triajes` ADD CONSTRAINT `triajes_citaId_fkey` FOREIGN KEY (`citaId`) REFERENCES `citas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `triajes` ADD CONSTRAINT `triajes_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `triajes` ADD CONSTRAINT `triajes_enfermeraId_fkey` FOREIGN KEY (`enfermeraId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensaciones` ADD CONSTRAINT `dispensaciones_recetaId_fkey` FOREIGN KEY (`recetaId`) REFERENCES `recetas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensaciones` ADD CONSTRAINT `dispensaciones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensaciones` ADD CONSTRAINT `dispensaciones_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensacion_detalles` ADD CONSTRAINT `dispensacion_detalles_dispensacionId_fkey` FOREIGN KEY (`dispensacionId`) REFERENCES `dispensaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensacion_detalles` ADD CONSTRAINT `dispensacion_detalles_detalleRecetaId_fkey` FOREIGN KEY (`detalleRecetaId`) REFERENCES `detalles_receta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dispensacion_detalles` ADD CONSTRAINT `dispensacion_detalles_inventarioId_fkey` FOREIGN KEY (`inventarioId`) REFERENCES `inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `municipios` ADD CONSTRAINT `municipios_departamentoId_fkey` FOREIGN KEY (`departamentoId`) REFERENCES `departamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendas_base` ADD CONSTRAINT `agendas_base_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendas_base` ADD CONSTRAINT `agendas_base_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `excepciones_agenda` ADD CONSTRAINT `excepciones_agenda_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `excepciones_agenda` ADD CONSTRAINT `excepciones_agenda_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `esquemas_vacunacion` ADD CONSTRAINT `esquemas_vacunacion_vacunaId_fkey` FOREIGN KEY (`vacunaId`) REFERENCES `cat_vacunas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lotes_vacunas` ADD CONSTRAINT `lotes_vacunas_vacunaId_fkey` FOREIGN KEY (`vacunaId`) REFERENCES `cat_vacunas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lotes_vacunas` ADD CONSTRAINT `lotes_vacunas_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_vacunas` ADD CONSTRAINT `movimientos_vacunas_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `lotes_vacunas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_vacunas` ADD CONSTRAINT `movimientos_vacunas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `registros_vacunacion_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `registros_vacunacion_vacunaId_fkey` FOREIGN KEY (`vacunaId`) REFERENCES `cat_vacunas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `registros_vacunacion_esquemaId_fkey` FOREIGN KEY (`esquemaId`) REFERENCES `esquemas_vacunacion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `registros_vacunacion_loteId_fkey` FOREIGN KEY (`loteId`) REFERENCES `lotes_vacunas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `registros_vacunacion_establecimientoId_fkey` FOREIGN KEY (`establecimientoId`) REFERENCES `establecimientos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registros_vacunacion` ADD CONSTRAINT `registros_vacunacion_aplicadoPorId_fkey` FOREIGN KEY (`aplicadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones_epidemiologicas` ADD CONSTRAINT `notificaciones_epidemiologicas_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones_epidemiologicas` ADD CONSTRAINT `notificaciones_epidemiologicas_historiaId_fkey` FOREIGN KEY (`historiaId`) REFERENCES `historia_clinica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones_epidemiologicas` ADD CONSTRAINT `notificaciones_epidemiologicas_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones_epidemiologicas` ADD CONSTRAINT `notificaciones_epidemiologicas_gestionadoPorId_fkey` FOREIGN KEY (`gestionadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingresos_hospitalarios` ADD CONSTRAINT `ingresos_hospitalarios_pacienteId_fkey` FOREIGN KEY (`pacienteId`) REFERENCES `pacientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingresos_hospitalarios` ADD CONSTRAINT `ingresos_hospitalarios_camaId_fkey` FOREIGN KEY (`camaId`) REFERENCES `camas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingresos_hospitalarios` ADD CONSTRAINT `ingresos_hospitalarios_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `servicios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ingresos_hospitalarios` ADD CONSTRAINT `ingresos_hospitalarios_medicoIngresoId_fkey` FOREIGN KEY (`medicoIngresoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex_medicamentos` ADD CONSTRAINT `kardex_medicamentos_ingresoId_fkey` FOREIGN KEY (`ingresoId`) REFERENCES `ingresos_hospitalarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex_medicamentos` ADD CONSTRAINT `kardex_medicamentos_medicamentoId_fkey` FOREIGN KEY (`medicamentoId`) REFERENCES `medicamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex_medicamentos` ADD CONSTRAINT `kardex_medicamentos_enfermeraId_fkey` FOREIGN KEY (`enfermeraId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `control_signos_vitales` ADD CONSTRAINT `control_signos_vitales_ingresoId_fkey` FOREIGN KEY (`ingresoId`) REFERENCES `ingresos_hospitalarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `control_signos_vitales` ADD CONSTRAINT `control_signos_vitales_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notas_evolucion` ADD CONSTRAINT `notas_evolucion_ingresoId_fkey` FOREIGN KEY (`ingresoId`) REFERENCES `ingresos_hospitalarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notas_evolucion` ADD CONSTRAINT `notas_evolucion_medicoId_fkey` FOREIGN KEY (`medicoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresos_hospitalarios` ADD CONSTRAINT `egresos_hospitalarios_ingresoId_fkey` FOREIGN KEY (`ingresoId`) REFERENCES `ingresos_hospitalarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresos_hospitalarios` ADD CONSTRAINT `egresos_hospitalarios_medicoEgresoId_fkey` FOREIGN KEY (`medicoEgresoId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_hospitalarios` ADD CONSTRAINT `movimientos_hospitalarios_ingresoId_fkey` FOREIGN KEY (`ingresoId`) REFERENCES `ingresos_hospitalarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_hospitalarios` ADD CONSTRAINT `movimientos_hospitalarios_camaOrigenId_fkey` FOREIGN KEY (`camaOrigenId`) REFERENCES `camas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimientos_hospitalarios` ADD CONSTRAINT `movimientos_hospitalarios_camaDestinoId_fkey` FOREIGN KEY (`camaDestinoId`) REFERENCES `camas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
