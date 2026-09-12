-- Migración aditiva: crea la configuración de documentos sin alterar tablas ni datos existentes.
CREATE TABLE `configuraciones_documento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `titulo_encabezado` VARCHAR(200) NOT NULL,
    `subtitulo` VARCHAR(200) NOT NULL,
    `titulo_visor` VARCHAR(160) NOT NULL,
    `nombre_archivo` VARCHAR(160) NOT NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `configuraciones_documento_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Conserva cualquier personalización previa si el registro ya fue creado manualmente.
INSERT INTO `configuraciones_documento`
  (`codigo`, `titulo_encabezado`, `subtitulo`, `titulo_visor`, `nombre_archivo`)
VALUES
  (
    'HISTORIAL_UNIFICADO',
    'REPÚBLICA DE HONDURAS - SECRETARÍA DE SALUD',
    'EXPEDIENTE CLÍNICO UNIFICADO DEL PACIENTE',
    'Expediente clínico unificado',
    'expediente-clinico-{expediente}.pdf'
  )
ON DUPLICATE KEY UPDATE `codigo` = VALUES(`codigo`);
