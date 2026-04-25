import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';
/**
 * Decorador para requerir un permiso específico.
 * Formato: 'modulo:accion' (ej. 'pacientes:leer', 'historia_clinica:crear')
 */
export const Permissions = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
