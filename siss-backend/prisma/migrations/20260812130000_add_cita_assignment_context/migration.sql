-- Cambio aditivo: conserva todas las citas existentes con valores NULL.
ALTER TABLE `citas`
  ADD COLUMN `servicioId` INTEGER NULL,
  ADD COLUMN `asignacionId` INTEGER NULL;

CREATE INDEX `citas_servicioId_fkey` ON `citas`(`servicioId`);
CREATE INDEX `citas_asignacionId_fkey` ON `citas`(`asignacionId`);

ALTER TABLE `citas`
  ADD CONSTRAINT `citas_servicioId_fkey`
    FOREIGN KEY (`servicioId`) REFERENCES `servicios`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `citas_asignacionId_fkey`
    FOREIGN KEY (`asignacionId`) REFERENCES `asignaciones_usuario`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
