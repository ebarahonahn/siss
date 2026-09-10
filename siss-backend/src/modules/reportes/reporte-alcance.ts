import { ForbiddenException } from '@nestjs/common';

export function resolverAlcanceReporte(
  user: { id: number; rol: string; establecimientoId?: number },
  solicitado?: string,
): { establecimientoId?: number; usuarioId?: number } {
  if (user.rol === 'ADMIN') {
    const establecimientoId = solicitado ? Number(solicitado) : undefined;
    if (establecimientoId !== undefined && (!Number.isInteger(establecimientoId) || establecimientoId <= 0)) {
      throw new ForbiddenException('Establecimiento inválido');
    }
    return { establecimientoId };
  }
  if (!Number.isInteger(user.establecimientoId) || user.establecimientoId! <= 0 ||
      !Number.isInteger(user.id) || user.id <= 0) {
    throw new ForbiddenException('La sesión no tiene un usuario y establecimiento válidos');
  }
  if (solicitado && Number(solicitado) !== user.establecimientoId) {
    throw new ForbiddenException('No puede consultar reportes de otro establecimiento');
  }
  const administrativo = ['ADMIN_ESTABLECIMIENTO', 'RECEPCIONISTA'].includes(user.rol);
  return {
    establecimientoId: user.establecimientoId,
    usuarioId: administrativo ? undefined : user.id,
  };
}
