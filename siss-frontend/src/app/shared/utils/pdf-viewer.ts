let visorActual: HTMLDialogElement | null = null;

/** Abre un PDF generado localmente en un diálogo de la aplicación. */
export function abrirPdfEnVisor(
  origen: string | Blob,
  titulo = 'Vista previa PDF',
  nombreArchivo = 'documento.pdf',
): void {
  if (typeof origen === 'string' && !origen.startsWith('blob:')) {
    throw new Error('El visor requiere un PDF generado por la aplicación');
  }
  visorActual?.close();
  const url = typeof origen === 'string' ? origen : URL.createObjectURL(new Blob([origen], { type: 'application/pdf' }));
  const anterior = document.activeElement as HTMLElement | null;
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-label', titulo);
  dialog.style.cssText = 'width:96vw;max-width:1440px;height:94vh;max-height:94vh;padding:0;border:0;border-radius:16px;background:white;box-shadow:0 20px 80px #0008;';
  const contenido = document.createElement('div');
  contenido.style.cssText = 'display:flex;flex-direction:column;height:100%;';
  const header = document.createElement('header');
  header.style.cssText = 'display:flex;align-items:center;gap:16px;padding:12px 20px;border-bottom:1px solid #e2e8f0;font-family:system-ui;color:#0f172a;';
  const heading = document.createElement('h2');
  heading.textContent = titulo;
  heading.style.cssText = 'flex:1;font-size:18px;font-weight:700;margin:0;';
  const descargar = document.createElement('a');
  descargar.textContent = 'Descargar PDF';
  descargar.href = url;
  descargar.download = nombreArchivo;
  const cerrar = document.createElement('button');
  cerrar.type = 'button';
  cerrar.textContent = 'Cerrar visor';
  cerrar.style.cssText = 'padding:8px 12px;border-radius:8px;background:#f1f5f9;cursor:pointer;';
  cerrar.onclick = () => dialog.close();
  const iframe = document.createElement('iframe');
  iframe.title = titulo;
  iframe.src = url;
  iframe.style.cssText = 'width:100%;flex:1;min-height:0;border:0;';
  header.append(heading, descargar, cerrar);
  contenido.append(header, iframe);
  dialog.append(contenido);
  dialog.addEventListener('close', () => {
    iframe.src = 'about:blank';
    dialog.remove();
    URL.revokeObjectURL(url);
    if (visorActual === dialog) visorActual = null;
    if (anterior?.isConnected) anterior.focus();
  }, { once: true });
  document.body.append(dialog);
  visorActual = dialog;
  dialog.showModal();
  cerrar.focus();
}
