INSERT INTO `reportes_disponibles`
  (`nombre`, `descripcion`, `categoria`, `slug`, `tipo`, `permiso`, `icono`, `activo`, `orden`)
VALUES
  ('AT-1 · Registro Diario de Atenciones Médicas', 'Excel - Versión SISS, detalle diario de atenciones', 'MEDICA', 'at-1', 'EXCEL', 'reportes:at-1', 'clipboard', true, 3)
ON DUPLICATE KEY UPDATE `slug` = 'at-1';
