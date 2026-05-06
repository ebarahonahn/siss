import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { HistoriaClinica } from './historia-clinica.service';

@Injectable({
  providedIn: 'root'
})
export class ReportePdfService {

  async generarConsultaPdfUrl(h: HistoriaClinica): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    const safeText = (text: any, x: number, y: number, options?: any) => {
      doc.text(String(text || '—'), x, y, options);
    };

    const checkPageBreak = (needed: number) => {
      if (currentY + needed > 275) {
        doc.addPage();
        currentY = margin;
        this.renderHeader(doc, h, margin, pageWidth);
        currentY += 25;
      }
    };

    this.renderHeader(doc, h, margin, pageWidth);
    currentY += 25;

    doc.setFillColor(248, 250, 252);
    doc.rect(margin, currentY, contentWidth, 22, 'F');
    const pac = (h.paciente as any) || {};
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    safeText(`${pac.nombres || ''} ${pac.apellidos || ''}`.trim().toUpperCase(), margin + 5, currentY + 10);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
    const fNac = pac.fechaNacimiento ? String(pac.fechaNacimiento).split('T')[0] : '—';
    const fCon = h.fecha ? String(h.fecha).split('T')[0] : '—';
    safeText(`F. NACIMIENTO: ${fNac}   |   SEXO: ${pac.sexo || '—'}   |   F. ATENCIÓN: ${fCon}`, margin + 5, currentY + 17);
    currentY += 32;

    this.renderSectionTitle(doc, 'I. EVALUACIÓN FÍSICA Y BIOMETRÍA', margin, currentY);
    currentY += 12;
    const vitals = [
      { l: 'P. ARTERIAL', v: `${h.presionSistolica || '—'}/${h.presionDiastolica || '—'}` },
      { l: 'FREC. CARD.', v: `${h.frecuenciaCardiaca || '—'} lpm` },
      { l: 'TEMPERATURA', v: `${h.temperatura || '—'} °C` },
      { l: 'SAT. OXIG.', v: `${h.saturacionO2 || '—'} %` },
      { l: 'PESO ACTUAL', v: `${h.peso || '—'} kg` },
      { l: 'ESTATURA', v: `${h.talla || '—'} cm` },
      { l: 'I.M.C.', v: this.calcularIMC(h.peso, h.talla) }
    ];
    let vX = margin;
    vitals.forEach((vit, i) => {
      doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'bold');
      safeText(vit.l, vX, currentY);
      doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'normal');
      safeText(vit.v, vX, currentY + 5);
      vX += 45;
      if ((i + 1) % 4 === 0) { vX = margin; currentY += 12; }
    });
    currentY += 15;

    const soap = [
      { l: 'II. SUBJETIVO (S)', t: h.subjetivo },
      { l: 'III. OBJETIVO (O)', t: h.objetivo },
      { l: 'IV. ANÁLISIS (A)', t: h.analisis },
      { l: 'V. PLAN (P)', t: h.plan }
    ];
    for (const s of soap) {
      if (!s.t) continue;
      checkPageBreak(20);
      this.renderSectionTitle(doc, s.l, margin, currentY);
      currentY += 10;
      doc.setFontSize(9); doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(String(s.t), contentWidth);
      lines.forEach((line: string) => {
        checkPageBreak(6);
        safeText(line, margin, currentY);
        currentY += 6;
      });
      currentY += 5;
    }

    // 5. Diagnósticos
    if (h.diagnosticos && h.diagnosticos.length > 0) {
      checkPageBreak(25);
      this.renderSectionTitle(doc, 'VI. DIAGNÓSTICOS (CIE-10)', margin, currentY);
      currentY += 10;
      doc.setFontSize(9); doc.setTextColor(15, 23, 42);
      h.diagnosticos.forEach(d => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        safeText(d.codigoCIE10, margin, currentY);
        doc.setFont('helvetica', 'normal');
        safeText(` - ${d.descripcion}`, margin + 15, currentY);
        currentY += 7;
      });
      currentY += 5;
    }

    // 6. Formulario de Especialidad (Dynamic Form)
    if (h.respuestaFormulario) {
      checkPageBreak(20);
      this.renderSectionTitle(doc, `VII. ESPECIALIDAD: ${h.respuestaFormulario.plantilla.nombre.toUpperCase()}`, margin, currentY);
      currentY += 10;
      doc.setFontSize(8); doc.setTextColor(15, 23, 42);
      for (const sec of h.respuestaFormulario.plantilla.secciones) {
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
        safeText(sec.nombre.toUpperCase(), margin, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
        for (const campo of sec.campos) {
          const val = h.respuestaFormulario.respuestas[campo.clave];
          if (campo.tipo !== 'TITULO' && campo.tipo !== 'SEPARADOR') {
            // Mostrar siempre los booleanos (aunque sean false) para que salga el "NO"
            // Para otros tipos, solo mostrar si tienen valor
            if (campo.tipo === 'BOOLEANO' || (val !== undefined && val !== null && val !== '')) {
              checkPageBreak(8);
              doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
              safeText(campo.etiqueta.toUpperCase(), margin, currentY);
              doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
              
              let textoValor = String(val || '—');
              if (campo.tipo === 'BOOLEANO') {
                textoValor = val === true ? 'SÍ' : 'NO';
              }
              
              safeText(textoValor, margin + 55, currentY);
              currentY += 6;
            }
          }
        }
        currentY += 4;
      }
    }


    // 7. Recetas (Tratamiento)
    if (h.recetas && h.recetas.length > 0) {
      checkPageBreak(20);
      this.renderSectionTitle(doc, 'VIII. TRATAMIENTO Y RECETAS', margin, currentY);
      currentY += 10;
      h.recetas.forEach(r => {
        (r.detalles || []).forEach((det: any) => {
          checkPageBreak(12);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42);
          safeText(det.medicamento?.nombreGenerico?.toUpperCase() || 'MEDICAMENTO', margin, currentY);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
          safeText(`Cant: ${det.cantidad}  |  Dosis: ${det.dosis}  |  Frec: ${det.frecuencia}  |  Dura: ${det.duracion} días`, margin, currentY + 4);
          currentY += 10;
        });
      });
      currentY += 5;
    }

    // 8. Solicitudes (Lab/Rad)
    if ((h.solicitudesLab && h.solicitudesLab.length > 0) || (h.solicitudesRad && h.solicitudesRad.length > 0)) {
      checkPageBreak(20);
      this.renderSectionTitle(doc, 'IX. SOLICITUDES DE APOYO DIAGNÓSTICO', margin, currentY);
      currentY += 10;
      
      // Lab
      (h.solicitudesLab || []).forEach(s => {
        (s.detalles || []).forEach((det: any) => {
          checkPageBreak(10);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 41, 59);
          safeText(`[LAB] ${det.examen?.nombre}`, margin, currentY);
          if (det.indicaciones) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
            safeText(`Obs: ${det.indicaciones}`, margin + 5, currentY + 4);
            currentY += 8;
          } else { currentY += 6; }
        });
      });

      // Rad
      (h.solicitudesRad || []).forEach(s => {
        (s.detalles || []).forEach((det: any) => {
          checkPageBreak(10);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(30, 41, 59);
          safeText(`[RAD] ${det.estudio?.nombre}`, margin, currentY);
          if (det.indicaciones) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
            safeText(`Obs: ${det.indicaciones}`, margin + 5, currentY + 4);
            currentY += 8;
          } else { currentY += 6; }
        });
      });
      currentY += 5;
    }

    // 9. Incapacidades
    if (h.incapacidades && h.incapacidades.length > 0) {
      checkPageBreak(20);
      this.renderSectionTitle(doc, 'X. INCAPACIDADES MÉDICAS', margin, currentY);
      currentY += 10;
      h.incapacidades.forEach(inc => {
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(220, 38, 38);
        safeText(`${inc.tipo} - ${inc.dias} DÍAS`, margin, currentY);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(15, 23, 42);
        safeText(`Del ${this.formatDate(inc.fechaInicio)} al ${this.formatDate(inc.fechaFin)} - Motivo: ${inc.motivo}`, margin, currentY + 4);
        currentY += 10;
      });
      currentY += 5;
    }

    // 10. Referencia y Próxima Cita
    if ((h.referidos && h.referidos.length > 0) || h.proximaCita) {
      checkPageBreak(25);
      this.renderSectionTitle(doc, 'XI. SEGUIMIENTO Y REFERENCIA', margin, currentY);
      currentY += 10;
      
      if (h.referidos && h.referidos.length > 0) {
        h.referidos.forEach(ref => {
          checkPageBreak(12);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
          safeText('REFERENCIA:', margin, currentY);
          doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
          const dest = ref.destino?.nombre || ref.establecimientoDestino || '—';
          safeText(`A: ${dest.toUpperCase()}`, margin + 25, currentY);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(37, 99, 235);
          safeText(`ESP: ${ref.especialidadDestino || 'GENERAL'}`, margin + 25, currentY + 4);
          doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 116, 139);
          safeText(`Motivo: ${ref.motivo || '—'}`, margin + 25, currentY + 8);
          currentY += 12;
        });
      }
      
      if (h.proximaCita) {
        checkPageBreak(15);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
        safeText('PRÓXIMA CITA:', margin, currentY);
        doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold');
        
        const fecha = new Date(h.proximaCita.fechaHora);
        const fText = fecha.toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const hText = fecha.toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        safeText(`${fText.toUpperCase()} - ${hText}`, margin + 25, currentY);
        if (h.proximaCita.motivo) {
          doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
          safeText(`Motivo: ${h.proximaCita.motivo}`, margin + 25, currentY + 4);
          currentY += 8;
        } else { currentY += 6; }
      }
    }

    checkPageBreak(40);
    this.renderSignature(doc, h, margin, pageWidth, currentY + 20);

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarRecetaPdfUrl(h: HistoriaClinica, formato: 'NORMAL' | 'POS' = 'NORMAL'): Promise<string> {
    const isPos = formato === 'POS';
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: isPos ? [80, 150] : 'a4' });
    
    if (isPos) {
      this.renderPosHeader(doc, h, 'RECETA MÉDICA');
      let y = 35;
      (h.recetas || []).forEach(r => {
        const items = (r.detalles && Array.isArray(r.detalles)) ? r.detalles : [r];
        items.forEach((det: any) => {
          const medNombre = det.medicamento?.nombreGenerico || det.nombreMedicamento || 'MEDICAMENTO';
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
          doc.text(String(medNombre).toUpperCase(), 5, y);
          
          doc.setFontSize(7); doc.setFont('helvetica', 'normal');
          doc.text(`CANT: ${det.cantidad || '--'} | ${det.dosis || ''} - ${det.frecuencia || ''}`, 5, y + 4);
          
          if (det.indicaciones) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(7);
            const lines = doc.splitTextToSize(`Indicaciones: ${det.indicaciones}`, 70);
            doc.text(lines, 5, y + 8);
            y += (lines.length * 3.5) + 8;
          } else {
            y += 10;
          }
        });
      });
      this.renderPosFooter(doc, h, y + 5);
    } else {
      const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
      this.renderHeader(doc, h, margin, pageWidth);
      this.renderSectionTitle(doc, 'RECETA MÉDICA / TRATAMIENTO', margin, 45);
      let y = 55;
      (h.recetas || []).forEach(r => {
        (r.detalles || []).forEach((det: any) => {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
          doc.text(String(det.medicamento?.nombreGenerico || 'MEDICAMENTO').toUpperCase(), margin, y);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          doc.text(`CANTIDAD: ${det.cantidad || '--'}  |  DOSIS: ${det.dosis}  |  FRECUENCIA: ${det.frecuencia}`, margin, y + 5);
          if (det.indicaciones) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(71, 85, 105);
            const lines = doc.splitTextToSize(`INDICACIONES: ${det.indicaciones}`, 170);
            doc.text(lines, margin, y + 10);
            doc.setTextColor(0, 0, 0);
            y += (lines.length * 5) + 12;
          } else { y += 14; }
        });
      });
      this.renderSignature(doc, h, margin, pageWidth, 250);
    }
    return URL.createObjectURL(doc.output('blob'));
  }

  async generarLaboratorioPdfUrl(h: HistoriaClinica, formato: 'NORMAL' | 'POS' = 'NORMAL'): Promise<string> {
    const isPos = formato === 'POS';
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: isPos ? [80, 120] : 'a4' });
    if (isPos) {
      this.renderPosHeader(doc, h, 'ORDEN LABORATORIO');
      let y = 35;
      (h.solicitudesLab || []).forEach(s => {
        const items = (s.detalles && Array.isArray(s.detalles)) ? s.detalles : [s];
        items.forEach((det: any) => {
          doc.setFontSize(8); doc.text(`[ ] ${det.examen?.nombre || 'EXAMEN'}`, 5, y);
          y += 6;
        });
      });
      this.renderPosFooter(doc, h, y + 5);
    } else {
      const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
      this.renderHeader(doc, h, margin, pageWidth);
      this.renderSectionTitle(doc, 'SOLICITUD DE LABORATORIO CLÍNICO', margin, 45);
      let y = 55;
      (h.solicitudesLab || []).forEach(s => {
        (s.detalles || []).forEach((det: any) => {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
          doc.text(`[ ] ${det.examen?.nombre || 'EXAMEN'}`, margin, y);
          if (det.indicaciones) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
            doc.text(`Obs: ${det.indicaciones}`, margin + 5, y + 5);
            y += 12;
          } else { y += 8; }
        });
      });
      this.renderSignature(doc, h, margin, pageWidth, 250);
    }
    return URL.createObjectURL(doc.output('blob'));
  }

  async generarRadiologiaPdfUrl(h: HistoriaClinica, formato: 'NORMAL' | 'POS' = 'NORMAL'): Promise<string> {
    const isPos = formato === 'POS';
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: isPos ? [80, 120] : 'a4' });
    if (isPos) {
      this.renderPosHeader(doc, h, 'ORDEN RADIOLOGÍA');
      let y = 35;
      (h.solicitudesRad || []).forEach(s => {
        const items = (s.detalles && Array.isArray(s.detalles)) ? s.detalles : [s];
        items.forEach((det: any) => {
          doc.setFontSize(8); doc.text(`[ ] ${det.estudio?.nombre || 'ESTUDIO'}`, 5, y);
          y += 6;
        });
      });
      this.renderPosFooter(doc, h, y + 5);
    } else {
      const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
      this.renderHeader(doc, h, margin, pageWidth);
      this.renderSectionTitle(doc, 'SOLICITUD DE ESTUDIOS RADIOLÓGICOS', margin, 45);
      let y = 55;
      (h.solicitudesRad || []).forEach(s => {
        (s.detalles || []).forEach((det: any) => {
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
          doc.text(`[ ] ${det.estudio?.nombre || 'ESTUDIO'}`, margin, y);
          if (det.indicaciones) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8);
            doc.text(`Obs: ${det.indicaciones}`, margin + 5, y + 5);
            y += 12;
          } else { y += 8; }
        });
      });
      this.renderSignature(doc, h, margin, pageWidth, 250);
    }
    return URL.createObjectURL(doc.output('blob'));
  }

  async generarIncapacidadPdfUrl(h: HistoriaClinica, formato: 'NORMAL' | 'POS' = 'NORMAL'): Promise<string> {
    const isPos = formato === 'POS';
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: isPos ? [80, 120] : 'a4' });
    if (isPos) {
      this.renderPosHeader(doc, h, 'INCAPACIDAD MÉDICA');
      let y = 35;
      (h.incapacidades || []).forEach(inc => {
        doc.setFontSize(9); doc.text(`${inc.tipo} - ${inc.dias} DÍAS`, 5, y);
        y += 12;
      });
      this.renderPosFooter(doc, h, y + 5);
    } else {
      const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
      this.renderHeader(doc, h, margin, pageWidth);
      this.renderSectionTitle(doc, 'CONSTANCIA DE INCAPACIDAD MÉDICA', margin, 45);
      let y = 60;
      (h.incapacidades || []).forEach(inc => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        doc.text(`${inc.tipo.toUpperCase()}`, margin, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        doc.text(`TIEMPO: ${inc.dias} DÍAS (DEL ${this.formatDate(inc.fechaInicio)} AL ${this.formatDate(inc.fechaFin)})`, margin, y + 7);
        doc.text(`MOTIVO: ${inc.motivo}`, margin, y + 14);
        y += 30;
      });
      this.renderSignature(doc, h, margin, pageWidth, 250);
    }
    return URL.createObjectURL(doc.output('blob'));
  }

  async generarRemisionPdfUrl(h: HistoriaClinica, formato: 'NORMAL' | 'POS' = 'NORMAL'): Promise<string> {
    const isPos = formato === 'POS';
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: isPos ? [80, 120] : 'a4' });
    if (isPos) {
      this.renderPosHeader(doc, h, 'REMISION / REFERENCIA');
      let y = 35;
      (h.referidos || []).forEach(ref => {
        doc.setFontSize(8); doc.text(`A: ${ref.destino?.nombre || ref.establecimientoDestino}`, 5, y);
        doc.text(`Motivo: ${ref.motivo}`, 5, y + 6);
        y += 15;
      });
      this.renderPosFooter(doc, h, y + 5);
    } else {
      const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
      this.renderHeader(doc, h, margin, pageWidth);
      this.renderSectionTitle(doc, 'HOJA DE REFERENCIA / REMISIÓN', margin, 45);
      let y = 60;
      (h.referidos || []).forEach(ref => {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.text(`ESTABLECIMIENTO DESTINO: ${String(ref.destino?.nombre || ref.establecimientoDestino || 'GENERAL').toUpperCase()}`, margin, y);
        doc.setFontSize(10);
        doc.text(`ESPECIALIDAD: ${ref.especialidadDestino || 'MEDICINA GENERAL'}`, margin, y + 7);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(`MOTIVO DE REFERENCIA: ${ref.motivo}`, 170);
        doc.text(lines, margin, y + 14);
        y += (lines.length * 5) + 20;
      });
      this.renderSignature(doc, h, margin, pageWidth, 250);
    }
    return URL.createObjectURL(doc.output('blob'));
  }

  private renderPosHeader(doc: jsPDF, h: HistoriaClinica, titulo: string) {
    const med = (h.medico as any) || {};
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(String(med.establecimiento?.nombre || 'SISS SALUD').toUpperCase(), 40, 8, { align: 'center' });
    doc.setFontSize(8); doc.text(titulo, 40, 13, { align: 'center' });
    doc.setFontSize(6); doc.text(this.formatDate(h.fecha), 40, 17, { align: 'center' });
    doc.setDrawColor(0); doc.line(5, 20, 75, 20);
  }

  private renderPosFooter(doc: jsPDF, h: HistoriaClinica, y: number) {
    const med = (h.medico as any) || {};
    doc.setFontSize(6); doc.setFont('helvetica', 'bold');
    doc.text('------------------------------------------', 40, y, { align: 'center' });
    
    // Evitar duplicar "DR." si ya viene en el nombre
    let nombreMedico = `${med.nombres} ${med.apellidos}`.toUpperCase();
    if (!nombreMedico.startsWith('DR.') && !nombreMedico.startsWith('DRA.')) {
      nombreMedico = `DR(A). ${nombreMedico}`;
    }
    
    doc.text(nombreMedico, 40, y + 4, { align: 'center' });
    doc.text(`COL: ${med.numeroColegiado || '—'}`, 40, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'italic');
    doc.text('GENERADO POR SISS CLÍNICO', 40, y + 12, { align: 'center' });
  }

  private renderHeader(doc: jsPDF, h: HistoriaClinica, margin: number, pageWidth: number) {
    const med = (h.medico as any) || {};
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(30, 58, 138);
    doc.text('SISS CLÍNICO', margin, margin + 8);
    doc.setFontSize(10); doc.setTextColor(30, 41, 59);
    const est = String(med.establecimiento?.nombre || 'ESTABLECIMIENTO MÉDICO').toUpperCase();
    doc.text(est, pageWidth - margin, margin + 8, { align: 'right' });
    doc.setDrawColor(203, 213, 225); doc.line(margin, margin + 16, pageWidth - margin, margin + 16);
  }

  private renderSectionTitle(doc: jsPDF, title: string, x: number, y: number) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(37, 99, 235);
    doc.text(title, x, y);
    doc.line(x, y + 2, x + 170, y + 2);
  }

  private renderSignature(doc: jsPDF, h: HistoriaClinica, margin: number, pageWidth: number, y: number) {
    const med = (h.medico as any) || {};
    const sX = pageWidth / 2;
    doc.line(sX - 40, y, sX + 40, y);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    
    let nombreMedico = `${med.nombres || ''} ${med.apellidos || ''}`.trim().toUpperCase();
    if (!nombreMedico.startsWith('DR.') && !nombreMedico.startsWith('DRA.')) {
      nombreMedico = `DR(A). ${nombreMedico}`;
    }
    
    doc.text(nombreMedico, sX, y + 7, { align: 'center' });
  }

  async generarVacunacionPdfUrl(reg: any, pac: any): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    doc.setFillColor(248, 250, 252); doc.setDrawColor(37, 99, 235); doc.setLineWidth(0.5);
    doc.roundedRect(margin + 10, 20, contentWidth - 20, 45, 4, 4, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(30, 58, 138);
    doc.text('CERTIFICADO DE VACUNACIÓN', pageWidth / 2, 35, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(37, 99, 235);
    doc.text('PROGRAMA AMPLIADO DE INMUNIZACIONES (PAI)', pageWidth / 2, 42, { align: 'center' });

    let currentY = 75;
    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text(`${pac.nombres} ${pac.apellidos}`.toUpperCase(), margin, currentY);
    doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal');
    doc.text(`DNI: ${pac.dni || '—'}   |   EXPEDIENTE: ${pac.numeroExpediente || '—'}`, margin, currentY + 6);

    currentY += 20;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(37, 99, 235);
    doc.text('DETALLES DE LA APLICACIÓN', margin, currentY);
    doc.setDrawColor(219, 234, 254); doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);

    currentY += 12;
    const details = [
      { l: 'VACUNA APLICADA', v: reg.vacuna?.nombre },
      { l: 'CÓDIGO DE LOTE', v: reg.lote?.codigoLote },
      { l: 'FECHA DE APLICACIÓN', v: this.formatDate(reg.fechaAplicacion) },
      { l: 'DOSIS RECIBIDA', v: reg.esquema?.numeroDosis ? `DOSIS ${reg.esquema.numeroDosis}` : 'ÚNICA' },
      { l: 'CENTRO DE SALUD', v: reg.establecimiento?.nombre || 'SISS SALUD' }
    ];
    details.forEach(d => {
      doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text(d.l, margin, currentY);
      doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text(String(d.v || '—').toUpperCase(), margin + 50, currentY);
      currentY += 8;
    });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarVacunacionPosUrl(reg: any, pac: any): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [80, 100] });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('SISS SALUD HONDURAS', 40, 10, { align: 'center' });
    doc.setFontSize(8); doc.text('COMPROBANTE DE VACUNACIÓN', 40, 15, { align: 'center' });
    doc.text('------------------------------------------', 40, 19, { align: 'center' });

    doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    doc.text('PACIENTE:', 5, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pac.nombres} ${pac.apellidos}`.toUpperCase(), 5, 29);
    
    doc.setFont('helvetica', 'bold'); doc.text('VACUNA:', 5, 36);
    doc.setFont('helvetica', 'normal'); doc.text(reg.vacuna?.nombre || '—', 5, 40);
    
    doc.setFont('helvetica', 'bold'); doc.text('LOTE:', 5, 46);
    doc.setFont('helvetica', 'normal'); doc.text(reg.lote?.codigoLote || '—', 5, 50);

    doc.setFont('helvetica', 'bold'); doc.text('FECHA:', 5, 56);
    doc.setFont('helvetica', 'normal'); doc.text(this.formatDate(reg.fechaAplicacion), 5, 60);

    doc.text('------------------------------------------', 40, 70, { align: 'center' });
    doc.setFontSize(7); doc.text('CONSERVE ESTE COMPROBANTE', 40, 75, { align: 'center' });
    
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarCarnetPdfUrl(historial: any[], pac: any): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);

    // Encabezado PAI
    this.renderHeader(doc, { medico: { establecimiento: historial[0]?.establecimiento } } as any, margin, pageWidth);
    
    let currentY = margin + 28;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(30, 58, 138);
    doc.text('CARNET DE INMUNIZACIONES (PAI)', margin, currentY);
    
    doc.setFontSize(10); doc.setTextColor(15, 23, 42);
    doc.text(`${pac.nombres} ${pac.apellidos}`.toUpperCase(), margin, currentY + 7);
    doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal');
    doc.text(`NÚMERO DE EXPEDIENTE: ${pac.numeroExpediente || '—'}  |  DNI: ${pac.dni || '—'}`, margin, currentY + 12);
    
    currentY += 22;
    historial.forEach((h, i) => {
      if (currentY > 260) { doc.addPage(); currentY = 25; }
      
      // Tarjeta de aplicación
      doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(37, 99, 235);
      doc.text(`${h.vacuna?.nombre || 'Vacuna'}`, margin + 5, currentY + 8);
      
      doc.setFontSize(8); doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal');
      const f = this.formatDate(h.fechaAplicacion);
      const lote = h.lote?.codigoLote || '—';
      const dosis = h.esquema?.numeroDosis ? `DOSIS ${h.esquema.numeroDosis}` : 'ÚNICA';
      doc.text(`FECHA: ${f}  |  LOTE: ${lote}  |  ESQUEMA: ${dosis}`, margin + 5, currentY + 15);
      
      // Indicador de establecimiento
      doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text(String(h.establecimiento?.nombre || 'SISS SALUD').toUpperCase(), margin + contentWidth - 5, currentY + 15, { align: 'right' });
      
      currentY += 26;
    });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarCarnetPosUrl(historial: any[], pac: any): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [80, 200] });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('SISS SALUD HONDURAS', 40, 10, { align: 'center' });
    doc.setFontSize(8); doc.text('HISTORIAL PAI (RESUMEN)', 40, 15, { align: 'center' });
    doc.text('------------------------------------------', 40, 19, { align: 'center' });

    doc.setFontSize(8); doc.text('PACIENTE:', 5, 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pac.nombres} ${pac.apellidos}`.toUpperCase(), 5, 29);
    
    doc.setFont('helvetica', 'bold');
    doc.text('APLICACIONES REGISTRADAS:', 5, 38);
    doc.text('------------------------------------------', 40, 41, { align: 'center' });
    
    let y = 47;
    doc.setFont('helvetica', 'normal');
    historial.forEach((h, index) => {
      if (y > 180) { doc.addPage(); y = 20; }
      
      const fecha = this.formatDate(h.fechaAplicacion);
      const dosis = h.esquema?.numeroDosis ? ` (Dosis ${h.esquema.numeroDosis})` : '';
      
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(`${index + 1}. ${h.vacuna?.nombre || 'Vacuna'}${dosis}`, 5, y);
      
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
      doc.text(`Fecha: ${fecha}  |  Lote: ${h.lote?.codigoLote || '—'}`, 5, y + 4);
      
      doc.setDrawColor(220, 220, 220); doc.line(5, y + 6, 75, y + 6);
      y += 10;
    });

    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('------------------------------------------', 40, y + 5, { align: 'center' });
    doc.text('SISS - SISTEMA DE INFORMACIÓN SALUD', 40, y + 10, { align: 'center' });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarMovimientosLotePdfUrl(movimientos: any[], lote: any): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
    
    // Encabezado Principal
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(30, 58, 138);
    doc.text('SISS CLÍNICO', margin, 15);
    doc.setFontSize(8); doc.setTextColor(148, 163, 184);
    doc.text('CONTROL DE INVENTARIO Y SUMINISTROS', margin, 20);
    
    doc.setFontSize(12); doc.setTextColor(15, 23, 42);
    doc.text('KARDEX DE MOVIMIENTOS POR LOTE', margin, 32);
    
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(`PRODUCTO: ${lote?.vacuna?.nombre || 'Lote'}`, margin, 40);
    doc.text(`CÓDIGO LOTE: ${lote?.codigoLote || '—'}`, margin, 46);
    const fab = lote?.fabricante || '—';
    const ven = lote?.fechaVencimiento ? this.formatDate(lote.fechaVencimiento) : '—';
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`FABRICANTE: ${fab}    |    VENCIMIENTO: ${ven}`, margin, 52);
    
    // Encabezados de Tabla
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(100, 116, 139);
    doc.text('FECHA', margin, 62);
    doc.text('TIPO DE MOVIMIENTO', margin + 30, 62);
    doc.text('CANTIDAD', margin + 80, 62);
    doc.text('SALDO FINAL', margin + 110, 62);
    doc.line(margin, 64, margin + 135, 64);
    
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    let y = 70;
    movimientos.forEach(m => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${this.formatDate(m.fecha)}`, margin, y);
      doc.text(`${m.tipo}`, margin + 30, y);
      doc.text(`${m.cantidad > 0 ? '+' : ''}${m.cantidad}`, margin + 80, y);
      doc.text(`Saldo: ${m.saldoFinal}`, margin + 110, y);
      y += 7;
    });

    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarMorbilidadPdf(data: any[], inicio: string, fin: string): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('REPORTE DE MORBILIDAD', 20, 20);
    doc.setFontSize(10); doc.text(`Periodo: ${inicio} a ${fin}`, 20, 28);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  async generarCoberturaPdf(data: any[], inicio: string, fin: string, est: any = null): Promise<string> {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20; const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (margin * 2);
    this.renderHeader(doc, { medico: { establecimiento: est } } as any, margin, pageWidth);
    let currentY = 50;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(30, 58, 138);
    doc.text('ANÁLISIS DE COBERTURA PAI', margin, currentY);
    currentY += 15;
    data.forEach(item => {
      if (currentY > 270) { doc.addPage(); currentY = 25; }
      doc.setFontSize(10); doc.setTextColor(15, 23, 42); doc.text(item.vacuna, margin, currentY);
      const pct = item.porcentaje;
      doc.setFillColor(241, 245, 249); doc.roundedRect(margin, currentY + 2, contentWidth, 4, 1, 1, 'F');
      if (pct < 50) doc.setFillColor(239, 68, 68);
      else if (pct < 85) doc.setFillColor(245, 158, 11);
      else doc.setFillColor(34, 197, 94);
      doc.roundedRect(margin, currentY + 2, (pct / 100) * contentWidth, 4, 1, 1, 'F');
      doc.setFontSize(9); doc.text(`${pct.toFixed(1)}%`, margin + contentWidth - 10, currentY, { align: 'right' });
      currentY += 18;
    });
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  private formatDate(date: any): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('es-HN');
  }

  private calcularIMC(peso?: number, talla?: number): string {
    if (!peso || !talla) return '—';
    return (peso / Math.pow(talla / 100, 2)).toFixed(1);
  }
}
