"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonsProps {
  result: any;
}

function buildMarkdown(result: any): string {
  const architecture = result.architecture || {};
  const services = architecture.services || [];
  const costItems = Array.isArray(result.cost_estimate)
    ? result.cost_estimate
    : (result.cost_estimate?.items || []);
  const totalCost = result.total_monthly_cost_usd || result.total_monthly_cost || 'N/D';
  const alternativesItems = Array.isArray(result.alternatives)
    ? result.alternatives
    : (result.alternatives?.items || []);

  const provider = result.provider || 'Multi-Cloud';
  const description = result.description || '';

  let md = `# Arquitetura Cloud — ${provider}\n\n`;
  if (description) md += `**Caso de uso:** ${description}\n\n`;
  md += `---\n\n`;
  md += `## Visao Geral da Arquitetura\n\n${architecture.description || ''}\n\n`;

  if (services.length > 0) {
    md += `## Servicos Recomendados\n\n`;
    services.forEach((svc: any) => {
      md += `### ${svc.name}\n\n`;
      if (svc.purpose) md += `**Proposito:** ${svc.purpose}\n\n`;
      if (svc.justification) md += `**Justificativa:** ${svc.justification}\n\n`;
    });
  }

  if (result.mermaid_code) {
    md += `## Diagrama da Arquitetura\n\n\`\`\`mermaid\n${result.mermaid_code}\n\`\`\`\n\n`;
  }

  md += `## Estimativa de Custo Mensal\n\n`;
  md += `**Total estimado:** ${totalCost}\n\n`;
  if (costItems.length > 0) {
    md += `| Servico | Custo/mes (USD) | Observacoes |\n`;
    md += `|---|---|---|\n`;
    costItems.forEach((item: any) => {
      md += `| ${item.service} | $${item.monthly_cost_usd} | ${item.notes || ''} |\n`;
    });
    md += '\n';
  }

  if (alternativesItems.length > 0) {
    md += `## Alternativas Consideradas\n\n`;
    alternativesItems.forEach((alt: any) => {
      md += `### ${alt.name}\n\n${alt.trade_off}\n\n`;
    });
  }

  md += `---\n*Gerado por Cloud Architect AI*\n`;
  return md;
}

async function renderMermaidToPng(
  code: string
): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const mermaid = (await import('mermaid')).default;
    // htmlLabels: false evita <foreignObject> no SVG.
    // Com foreignObject, o canvas fica "tainted" e canvas.toDataURL() lança SecurityError.
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'strict',
      fontFamily: 'Arial, Helvetica, sans-serif',
      flowchart: { htmlLabels: false },
    });

    const id = `pdf-mermaid-${Date.now()}`;
    const { svg } = await Promise.race([
      mermaid.render(id, code),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('mermaid timeout')), 8000)
      ),
    ]);

    if (svg.includes('Syntax error in text') || svg.includes('Parse error')) return null;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = svgDoc.querySelector('svg');
    if (!svgEl) return null;

    let w = 900, h = 500;
    const vb = svgEl.getAttribute('viewBox');
    if (vb) {
      const parts = vb.split(/[\s,]+/);
      if (parts.length === 4) {
        w = Math.max(parseFloat(parts[2]) || 900, 100);
        h = Math.max(parseFloat(parts[3]) || 500, 50);
      }
    }
    const wAttr = svgEl.getAttribute('width');
    const hAttr = svgEl.getAttribute('height');
    if (wAttr && !wAttr.includes('%')) w = Math.max(parseFloat(wAttr) || w, 100);
    if (hAttr && !hAttr.includes('%')) h = Math.max(parseFloat(hAttr) || h, 50);

    svgEl.setAttribute('width', String(w));
    svgEl.setAttribute('height', String(h));
    const svgStr = new XMLSerializer().serializeToString(svgEl);

    // base64 data URL — mais compatível com canvas do que blob URL
    const svgBase64 = btoa(unescape(encodeURIComponent(svgStr)));
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const SCALE = 2;
      canvas.width = w * SCALE;
      canvas.height = h * SCALE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(SCALE, SCALE);

      const img = new Image();

      const imgTimeout = setTimeout(() => resolve(null), 5000);

      img.onload = () => {
        clearTimeout(imgTimeout);
        try {
          ctx.drawImage(img, 0, 0, w, h);
          resolve({ data: canvas.toDataURL('image/png'), w, h });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => { clearTimeout(imgTimeout); resolve(null); };
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

async function generatePDF(result: any) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const PAGE_H = 297;
  const M = 15;          // margin
  const CW = PAGE_W - M * 2; // content width
  const FOOTER_H = 12;
  let y = 0;
  let pageNum = 1;

  // --- helpers ---

  const newPage = () => {
    addFooter();
    doc.addPage();
    pageNum++;
    y = 18;
  };

  const guard = (needed: number) => {
    if (y + needed > PAGE_H - FOOTER_H) newPage();
  };

  const color = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);

  const addFooter = () => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    color(160, 160, 180);
    doc.text('Cloud Architect AI', M, PAGE_H - 6);
    const pageLabel = `Pagina ${pageNum}`;
    doc.text(pageLabel, PAGE_W - M - doc.getTextWidth(pageLabel), PAGE_H - 6);
    doc.setDrawColor(210, 210, 230);
    doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 9, PAGE_W - M, PAGE_H - 9);
  };

  const h2 = (text: string) => {
    guard(14);
    y += 2;
    doc.setFillColor(240, 241, 255);
    doc.rect(M, y - 5, CW, 9, 'F');
    doc.setDrawColor(124, 140, 255);
    doc.setLineWidth(0.8);
    doc.line(M, y - 5, M, y + 4);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    color(50, 60, 140);
    doc.text(text, M + 4, y);
    y += 8;
  };

  const body = (text: string, indent = 0, size = 9.5) => {
    if (!text) return;
    doc.setFontSize(size);
    doc.setFont('helvetica', 'normal');
    color(55, 55, 65);
    const lines = doc.splitTextToSize(text, CW - indent);
    guard(lines.length * 4.8);
    doc.text(lines, M + indent, y);
    y += lines.length * 4.8 + 1;
  };

  const label = (text: string, indent = 0) => {
    guard(6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    color(100, 110, 170);
    doc.text(text.toUpperCase(), M + indent, y);
    y += 4.5;
  };

  const spacer = (h = 4) => { y += h; };
  const divider = () => {
    guard(5);
    doc.setDrawColor(220, 222, 240);
    doc.setLineWidth(0.25);
    doc.line(M, y, PAGE_W - M, y);
    y += 4;
  };

  // === Extract data ===
  const provider    = result.provider || 'Cloud';
  const description = result.description || '';
  const arch        = result.architecture || {};
  const services    = arch.services || [];
  const costItems   = Array.isArray(result.cost_estimate)
    ? result.cost_estimate : (result.cost_estimate?.items || []);
  const totalCost   = result.total_monthly_cost_usd || result.total_monthly_cost || 'N/D';
  const alts        = Array.isArray(result.alternatives)
    ? result.alternatives : (result.alternatives?.items || []);

  // === HEADER BANNER ===
  doc.setFillColor(90, 103, 216);
  doc.rect(0, 0, PAGE_W, 18, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  color(255, 255, 255);
  doc.text(`Arquitetura Cloud  |  ${provider}`, M, 11.5);
  y = 26;

  if (description) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    color(90, 90, 110);
    const dl = doc.splitTextToSize(`Caso de uso: ${description}`, CW);
    doc.text(dl, M, y);
    y += dl.length * 4.5 + 2;
  }

  divider();

  // === 1. VISAO GERAL ===
  h2('Visao Geral da Arquitetura');
  body(arch.description || 'Sem descricao.');
  spacer(4);

  // === 2. SERVICOS ===
  if (services.length > 0) {
    h2('Servicos Recomendados');
    services.forEach((svc: any, i: number) => {
      guard(22);
      // service name pill
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      color(50, 60, 140);
      doc.text(`${i + 1}.  ${svc.name}`, M + 2, y);
      y += 5.5;

      if (svc.purpose) {
        label('Proposito', 4);
        body(svc.purpose, 4);
      }
      if (svc.justification) {
        label('Justificativa', 4);
        body(svc.justification, 4);
      }
      spacer(3);
    });
  }

  // === 3. DIAGRAMA MERMAID (imagem renderizada) ===
  if (result.mermaid_code) {
    h2('Diagrama da Arquitetura');
    const diagram = await renderMermaidToPng(result.mermaid_code);
    if (diagram) {
      const imgW = CW;
      const imgH = (diagram.h / diagram.w) * imgW;
      const safeH = Math.min(imgH, PAGE_H - FOOTER_H - 25);
      guard(safeH + 5);
      doc.addImage(diagram.data, 'PNG', M, y, imgW, safeH);
      y += safeH + 5;
    } else {
      // Fallback: show the code when rendering fails
      doc.setFontSize(7.5);
      doc.setFont('courier', 'normal');
      color(30, 30, 60);
      const codeLines = doc.splitTextToSize(result.mermaid_code, CW - 6);
      const blockH = codeLines.length * 3.8 + 6;
      guard(blockH + 4);
      doc.setFillColor(245, 246, 252);
      doc.setDrawColor(200, 204, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y - 3, CW, blockH, 2, 2, 'FD');
      doc.text(codeLines, M + 3, y + 1);
      y += blockH + 3;
    }
    spacer(2);
  }

  // === 4. CUSTOS ===
  h2('Estimativa de Custo Mensal');

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  color(30, 30, 30);
  doc.text(`Total estimado: ${totalCost}`, M, y);
  y += 7;

  if (costItems.length > 0) {
    const C1 = M,  W1 = 62;
    const C2 = C1 + W1 + 2, W2 = 35;
    const C3 = C2 + W2 + 2;
    const ROW_H = 6.5;

    guard(ROW_H + 4);
    // header row
    doc.setFillColor(90, 103, 216);
    doc.rect(M, y - 4, CW, ROW_H, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    color(255, 255, 255);
    doc.text('Servico', C1 + 2, y);
    doc.text('Custo/mes (USD)', C2, y);
    doc.text('Observacoes', C3, y);
    y += ROW_H;

    costItems.forEach((item: any, idx: number) => {
      const noteLines = doc.splitTextToSize(item.notes || '', CW - W1 - W2 - 6);
      const svcLines  = doc.splitTextToSize(item.service || '', W1 - 2);
      const rowH = Math.max(svcLines.length, noteLines.length) * 4.2 + 3;

      guard(rowH + 2);
      if (idx % 2 === 0) {
        doc.setFillColor(246, 247, 254);
        doc.rect(M, y - 3.5, CW, rowH, 'F');
      }
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      color(40, 40, 55);
      doc.text(svcLines, C1 + 2, y);
      doc.setFont('helvetica', 'bold');
      color(70, 85, 200);
      doc.text(`$${item.monthly_cost_usd}`, C2, y);
      doc.setFont('helvetica', 'normal');
      color(60, 60, 70);
      doc.text(noteLines, C3, y);
      y += rowH;
    });
    spacer(4);
  }

  // === 5. ALTERNATIVAS ===
  if (alts.length > 0) {
    h2('Alternativas Consideradas');
    alts.forEach((alt: any, i: number) => {
      guard(16);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      color(50, 60, 140);
      doc.text(`${i + 1}.  ${alt.name}`, M + 2, y);
      y += 5.5;
      body(alt.trade_off || '', 4);
      spacer(2);
    });
  }

  // footer on last page
  addFooter();

  return doc;
}

export function ExportButtons({ result }: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const doc = await generatePDF(result);
      const provider = (result.provider || 'cloud').toLowerCase();
      doc.save(`arquitetura-${provider}-${Date.now()}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportMarkdown = () => {
    try {
      const md = buildMarkdown(result);
      const blob = new Blob([md], { type: 'text/markdown; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const provider = (result.provider || 'cloud').toLowerCase();
      a.download = `arquitetura-${provider}-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Markdown exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar Markdown.');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportMarkdown}
        className="flex items-center gap-2 text-sm"
      >
        <FileText size={15} />
        Exportar Markdown
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        className="flex items-center gap-2 text-sm"
      >
        {isExportingPDF ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
        {isExportingPDF ? 'Gerando PDF...' : 'Exportar PDF'}
      </Button>
    </div>
  );
}
