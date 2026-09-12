import { abrirPdfEnVisor } from './pdf-viewer';

describe('Visor PDF interno', () => {
  afterEach(() => document.querySelectorAll('dialog').forEach(d => d.close()));

  it('abre un diálogo con PDF y descarga, sin abrir ventanas', () => {
    const open = spyOn(window, 'open');
    abrirPdfEnVisor(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
      'Reporte de prueba',
      'reporte-prueba.pdf',
    );
    const dialog = document.querySelector('dialog')!;
    expect(dialog.open).toBeTrue();
    expect(dialog.querySelector('iframe')!.title).toBe('Reporte de prueba');
    expect(dialog.querySelector('a')!.download).toBe('reporte-prueba.pdf');
    expect(open).not.toHaveBeenCalled();
  });

  it('libera el PDF al cerrar y retira el diálogo', (done) => {
    const revoke = spyOn(URL, 'revokeObjectURL');
    abrirPdfEnVisor(new Blob(['%PDF-1.7']));
    const dialog = document.querySelector('dialog[open]') as HTMLDialogElement;
    const url = dialog.querySelector('iframe')!.src;
    dialog.addEventListener('close', () => {
      expect(revoke).toHaveBeenCalledWith(url);
      expect(dialog.isConnected).toBeFalse();
      done();
    });
    dialog.querySelector('button')!.click();
  });

  it('rechaza enlaces externos', () => {
    expect(() => abrirPdfEnVisor('https://example.com')).toThrow();
  });
});
