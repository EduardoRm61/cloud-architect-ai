"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { FileText, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonsProps {
  result: any;
}

// ── Classificador de categoria (espelho do FinOpsView.tsx) ──────────────────
function classifyService(name: string): string {
  const n = name.toLowerCase();
  if (/lambda|function|fargate|ecs|ec2|compute|cloud run|app engine|aks|gke|kubernetes|container|vm\b|instance/i.test(n)) return 'compute';
  if (/rds|aurora|postgres|mysql|dynamo|cosmos|firestore|bigtable|database|sql|redis|elasticache|cache for redis|mongo/i.test(n)) return 'database';
  if (/s3|blob|storage|bucket|cloudfront|cdn|cloud storage|files|object/i.test(n)) return 'storage';
  if (/load balancer|alb|elb|route 53|dns|traffic manager|gateway|api management|apim|nginx/i.test(n)) return 'network';
  if (/shield|key vault|secret|kms|waf|security|sentinel|firewall|identity|cognito|iam/i.test(n)) return 'security';
  if (/cloudwatch|monitor|stackdriver|logging|xray|x-ray|insights|grafana|prometheus|alert/i.test(n)) return 'monitoring';
  if (/sqs|sns|service bus|pub.?sub|kafka|queue|event|message|notification/i.test(n)) return 'messaging';
  return 'other';
}

const CATEGORY_LABELS: Record<string, string> = {
  compute:    'Computacao',
  database:   'Banco de Dados',
  storage:    'Armazenamento',
  network:    'Rede e CDN',
  security:   'Seguranca',
  monitoring: 'Monitoramento',
  messaging:  'Mensageria',
  other:      'Outros',
};

const CATEGORY_RGB: Record<string, [number, number, number]> = {
  compute:    [59,  130, 246],
  database:   [139, 92,  246],
  storage:    [245, 158, 11 ],
  network:    [16,  185, 129],
  security:   [239, 68,  68 ],
  monitoring: [249, 115, 22 ],
  messaging:  [20,  184, 166],
  other:      [148, 163, 184],
};

// ── Markdown ────────────────────────────────────────────────────────────────
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
  const finopsTips = Array.isArray(result.finops_tips) ? result.finops_tips : [];
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
    md += `| Servico | Categoria | Custo/mes (USD) | Observacoes |\n`;
    md += `|---|---|---|---|\n`;
    costItems.forEach((item: any) => {
      const cat = CATEGORY_LABELS[classifyService(item.service)] || 'Outros';
      md += `| ${item.service} | ${cat} | $${item.monthly_cost_usd} | ${item.notes || ''} |\n`;
    });
    md += '\n';

    const byCategory: Record<string, number> = {};
    costItems.forEach((item: any) => {
      const cat = classifyService(item.service);
      byCategory[cat] = (byCategory[cat] || 0) + item.monthly_cost_usd;
    });
    const totalNum = costItems.reduce((s: number, i: any) => s + i.monthly_cost_usd, 0);

    md += `### Distribuicao por Categoria\n\n`;
    Object.entries(byCategory)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([cat, val]) => {
        const pct = totalNum > 0 ? (((val as number) / totalNum) * 100).toFixed(1) : '0';
        md += `- **${CATEGORY_LABELS[cat] || cat}**: $${(val as number).toFixed(2)} (${pct}%)\n`;
      });
    md += '\n';
  }

  if (finopsTips.length > 0) {
    md += `## Recomendacoes de Otimizacao (FinOps)\n\n`;
    finopsTips.forEach((tip: any) => {
      md += `### ${tip.category} — economia ${tip.potential_saving}\n\n${tip.tip}\n\n`;
    });
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

// ── Donut Chart → PNG (Canvas 2D puro, sem risco de SecurityError) ───────────
function renderDonutToPng(
  costItems: any[],
  totalCost: string
): { data: string; w: number; h: number } | null {
  try {
    const byCategory: Record<string, number> = {};
    costItems.forEach((item: any) => {
      const cat = classifyService(item.service);
      byCategory[cat] = (byCategory[cat] || 0) + item.monthly_cost_usd;
    });
    const totalNum = Object.values(byCategory).reduce((s, v) => s + v, 0);
    if (totalNum === 0) return null;

    const sorted = Object.entries(byCategory).sort(
      ([, a], [, b]) => (b as number) - (a as number)
    );

    // Canvas dimensions (logical px, doubled for retina)
    const PIE = 300, LEG_W = 240, H = PIE, W = PIE + LEG_W;
    const SCALE = 2;
    const canvas = document.createElement('canvas');
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const cx = PIE / 2, cy = PIE / 2;
    const outerR = PIE * 0.43, innerR = PIE * 0.27;

    // Segmentos do donut
    let startAngle = -Math.PI / 2;
    sorted.forEach(([cat, val]) => {
      const sweep = ((val as number) / totalNum) * 2 * Math.PI;
      const endAngle = startAngle + sweep;
      const [r, g, b] = CATEGORY_RGB[cat] ?? [148, 163, 184];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
      // gap branco entre segmentos
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      startAngle = endAngle;
    });

    // Buraco central (donut)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Texto central
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1e293b';
    ctx.font = `bold ${Math.round(PIE * 0.075)}px Arial`;
    ctx.fillText(totalCost, cx, cy - 10);
    ctx.font = `${Math.round(PIE * 0.044)}px Arial`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('por mes', cx, cy + 14);

    // Legenda à direita
    let ly = 24;
    const lx = PIE + 14;
    sorted.forEach(([cat, val]) => {
      if (ly > H - 16) return;
      const pct = (((val as number) / totalNum) * 100).toFixed(1);
      const [r, g, b] = CATEGORY_RGB[cat] ?? [148, 163, 184];

      // quadrado colorido
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(lx, ly - 9, 11, 11);

      // nome
      ctx.fillStyle = '#334155';
      ctx.font = `bold 11px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(CATEGORY_LABELS[cat] ?? cat, lx + 15, ly);

      // valor e %
      ctx.fillStyle = '#64748b';
      ctx.font = `10px Arial`;
      ctx.fillText(`$${(val as number).toFixed(2)}  ·  ${pct}%`, lx + 15, ly + 14);

      ly += 38;
    });

    return { data: canvas.toDataURL('image/png'), w: W, h: H };
  } catch {
    return null;
  }
}

// ── Mermaid → PNG ────────────────────────────────────────────────────────────
async function renderMermaidToPng(
  code: string
): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const mermaid = (await import('mermaid')).default;
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
        } catch { resolve(null); }
      };
      img.onerror = () => { clearTimeout(imgTimeout); resolve(null); };
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

// ── PDF ──────────────────────────────────────────────────────────────────────
async function generatePDF(result: any) {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PAGE_W = 210, PAGE_H = 297, M = 15, FOOTER_H = 12;
  const CW = PAGE_W - M * 2;
  let y = 0, pageNum = 1;

  const color  = (r: number, g: number, b: number) => doc.setTextColor(r, g, b);
  const fill   = (r: number, g: number, b: number) => doc.setFillColor(r, g, b);
  const stroke = (r: number, g: number, b: number) => doc.setDrawColor(r, g, b);

  const addFooter = () => {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); color(160, 160, 180);
    doc.text('Cloud Architect AI', M, PAGE_H - 6);
    const lbl = `Pagina ${pageNum}`;
    doc.text(lbl, PAGE_W - M - doc.getTextWidth(lbl), PAGE_H - 6);
    stroke(210, 210, 230); doc.setLineWidth(0.3);
    doc.line(M, PAGE_H - 9, PAGE_W - M, PAGE_H - 9);
  };

  const newPage = () => { addFooter(); doc.addPage(); pageNum++; y = 18; };
  const guard   = (n: number) => { if (y + n > PAGE_H - FOOTER_H) newPage(); };
  const spacer  = (h = 4) => { y += h; };

  const h2 = (text: string) => {
    guard(14); y += 2;
    fill(240, 241, 255); doc.rect(M, y - 5, CW, 9, 'F');
    stroke(99, 102, 241); doc.setLineWidth(0.8);
    doc.line(M, y - 5, M, y + 4);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); color(50, 60, 140);
    doc.text(text, M + 4, y); y += 8;
  };

  const body = (text: string, indent = 0, size = 9.5) => {
    if (!text) return;
    doc.setFontSize(size); doc.setFont('helvetica', 'normal'); color(55, 55, 65);
    const lines = doc.splitTextToSize(text, CW - indent);
    guard(lines.length * 4.8);
    doc.text(lines, M + indent, y);
    y += lines.length * 4.8 + 1;
  };

  const lbl = (text: string, indent = 0) => {
    guard(6); doc.setFontSize(8); doc.setFont('helvetica', 'bold'); color(100, 110, 170);
    doc.text(text.toUpperCase(), M + indent, y); y += 4.5;
  };

  const divider = () => {
    guard(5); stroke(220, 222, 240); doc.setLineWidth(0.25);
    doc.line(M, y, PAGE_W - M, y); y += 4;
  };

  // === Dados ===
  const provider   = result.provider || 'Cloud';
  const description = result.description || '';
  const arch       = result.architecture || {};
  const services   = arch.services || [];
  const costItems  = Array.isArray(result.cost_estimate)
    ? result.cost_estimate : (result.cost_estimate?.items || []);
  const totalCost  = result.total_monthly_cost_usd || result.total_monthly_cost || 'N/D';
  const alts       = Array.isArray(result.alternatives)
    ? result.alternatives : (result.alternatives?.items || []);
  const finopsTips = Array.isArray(result.finops_tips) ? result.finops_tips : [];

  // === HEADER ===
  fill(79, 70, 229); doc.rect(0, 0, PAGE_W, 18, 'F');
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); color(255, 255, 255);
  doc.text(`Arquitetura Cloud  |  ${provider}`, M, 11.5);
  y = 26;

  if (description) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); color(90, 90, 110);
    const dl = doc.splitTextToSize(`Caso de uso: ${description}`, CW);
    doc.text(dl, M, y); y += dl.length * 4.5 + 2;
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
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); color(50, 60, 140);
      doc.text(`${i + 1}.  ${svc.name}`, M + 2, y); y += 5.5;
      if (svc.purpose)       { lbl('Proposito', 4);     body(svc.purpose, 4);       }
      if (svc.justification) { lbl('Justificativa', 4); body(svc.justification, 4); }
      spacer(3);
    });
  }

  // === 3. DIAGRAMA ===
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
      doc.setFontSize(7.5); doc.setFont('courier', 'normal'); color(30, 30, 60);
      const codeLines = doc.splitTextToSize(result.mermaid_code, CW - 6);
      const blockH = codeLines.length * 3.8 + 6;
      guard(blockH + 4);
      fill(245, 246, 252); stroke(200, 204, 240); doc.setLineWidth(0.3);
      doc.roundedRect(M, y - 3, CW, blockH, 2, 2, 'FD');
      doc.text(codeLines, M + 3, y + 1); y += blockH + 3;
    }
    spacer(2);
  }

  // === 4. ESTIMATIVA DE CUSTO ===
  h2('Estimativa de Custo Mensal');

  // Total
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); color(30, 30, 30);
  doc.text('Total estimado:', M, y);
  const totalLblW = doc.getTextWidth('Total estimado:');
  color(79, 70, 229);
  doc.text(` ${totalCost}`, M + totalLblW, y);
  y += 8;

  // 4a. Gráfico de rosca (donut)
  if (costItems.length > 0) {
    const donut = renderDonutToPng(costItems, totalCost);
    if (donut) {
      const imgW = CW;
      const imgH = (donut.h / donut.w) * imgW;
      guard(imgH + 4);
      doc.addImage(donut.data, 'PNG', M, y, imgW, imgH);
      y += imgH + 6;
    }
  }

  // 4b. Tabela detalhada
  if (costItems.length > 0) {
    const C1 = M,      W1 = 55;
    const C2 = C1 + W1 + 2, W2 = 28;
    const C3 = C2 + W2 + 2, W3 = 28;
    const C4 = C3 + W3 + 2;
    const ROW_H = 6.5;

    guard(ROW_H + 4);
    fill(79, 70, 229); doc.rect(M, y - 4, CW, ROW_H, 'F');
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); color(255, 255, 255);
    doc.text('Servico',     C1 + 2, y);
    doc.text('Categoria',   C2,     y);
    doc.text('Custo/mes',   C3,     y);
    doc.text('Observacoes', C4,     y);
    y += ROW_H;

    costItems.forEach((item: any, idx: number) => {
      const catKey = classifyService(item.service);
      const catLbl = CATEGORY_LABELS[catKey] || 'Outros';
      const [cr, cg, cb] = CATEGORY_RGB[catKey] ?? [148, 163, 184];
      const noteLines = doc.splitTextToSize(item.notes || '', CW - W1 - W2 - W3 - 8);
      const svcLines  = doc.splitTextToSize(item.service || '', W1 - 2);
      const rowH = Math.max(svcLines.length, noteLines.length) * 4 + 3.5;

      guard(rowH + 2);
      if (idx % 2 === 0) { fill(246, 247, 254); doc.rect(M, y - 3.5, CW, rowH, 'F'); }

      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); color(40, 40, 55);
      doc.text(svcLines, C1 + 2, y);

      fill(cr, cg, cb); doc.circle(C2 + 1.5, y - 1, 1.2, 'F');
      color(60, 65, 80); doc.text(catLbl, C2 + 4, y);

      doc.setFont('helvetica', 'bold'); color(cr, cg, cb);
      doc.text(`$${item.monthly_cost_usd}`, C3, y);

      doc.setFont('helvetica', 'normal'); color(80, 80, 90);
      doc.text(noteLines, C4, y);
      y += rowH;
    });
    spacer(4);
  }

  // === 5. RECOMENDACOES FINOPS ===
  if (finopsTips.length > 0) {
    h2('Recomendacoes de Otimizacao (FinOps)');

    finopsTips.forEach((tip: any) => {
      const tipLines = doc.splitTextToSize(tip.tip || '', CW - 6);
      const cardH = tipLines.length * 4.5 + 16;
      guard(cardH + 3);

      fill(248, 249, 255); stroke(210, 214, 240); doc.setLineWidth(0.3);
      doc.roundedRect(M, y - 2, CW, cardH, 2, 2, 'FD');

      fill(79, 70, 229);
      doc.rect(M, y - 2, 2.5, cardH, 'F');

      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); color(79, 70, 229);
      doc.text(tip.category || '', M + 5, y + 3);
      const catW = doc.getTextWidth(tip.category || '') + 2;
      color(4, 120, 87);
      doc.text(tip.potential_saving || '', M + 5 + catW + 4, y + 3);

      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); color(50, 55, 70);
      doc.text(tipLines, M + 5, y + 10);

      y += cardH + 3;
    });
    spacer(2);
  }

  // === 6. ALTERNATIVAS ===
  if (alts.length > 0) {
    h2('Alternativas Consideradas');
    alts.forEach((alt: any, i: number) => {
      guard(16);
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); color(50, 60, 140);
      doc.text(`${i + 1}.  ${alt.name}`, M + 2, y); y += 5.5;
      body(alt.trade_off || '', 4);
      spacer(2);
    });
  }

  addFooter();
  return doc;
}

// ── Componente ────────────────────────────────────────────────────────────────
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
      <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="flex items-center gap-2 text-sm">
        <FileText size={15} />
        Exportar Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF} className="flex items-center gap-2 text-sm">
        {isExportingPDF ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {isExportingPDF ? 'Gerando PDF...' : 'Exportar PDF'}
      </Button>
    </div>
  );
}
