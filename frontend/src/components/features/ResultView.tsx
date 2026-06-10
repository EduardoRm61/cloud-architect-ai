import React from 'react';
import { Cloud, Layers, Share2, GitCompare } from 'lucide-react';
import { MermaidRenderer } from './MermaidRenderer';
import { FinOpsView } from './FinOpsView';

interface ResultViewProps {
  result: any;
}

export function ResultView({ result }: ResultViewProps) {
  if (!result) return null;

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

  return (
    <div className="w-full mt-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* 1. Visão Geral */}
      <section className="bg-card rounded-xl shadow-sm border p-6 md:p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Cloud size={16} className="text-primary" />
          </div>
          Visão Geral da Arquitetura
        </h2>
        <p className="text-secondary-foreground text-base leading-relaxed">
          {architecture.description || 'Descrição não providenciada pela IA.'}
        </p>
      </section>

      {/* 2. Serviços Recomendados */}
      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Layers size={16} className="text-primary" />
          </div>
          Serviços Recomendados
        </h3>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((svc: any, idx: number) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border p-5 hover:border-primary/40 hover:shadow-md transition-all">
                <h4 className="font-semibold text-base text-primary mb-3 pb-2 border-b">{svc.name}</h4>
                <p className="text-sm font-medium mb-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Propósito</span>
                  {svc.purpose}
                </p>
                <p className="text-sm text-secondary-foreground">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider block mb-1">Justificativa</span>
                  {svc.justification}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground italic text-sm py-4">Nenhum serviço listado para este cenário.</p>
        )}
      </section>

      {/* 3. Diagrama */}
      {result.mermaid_code && (
        <section>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Share2 size={16} className="text-primary" />
            </div>
            Diagrama da Arquitetura
          </h3>
          <MermaidRenderer code={result.mermaid_code} />
        </section>
      )}

      {/* 4. FinOps */}
      <FinOpsView
        costItems={costItems}
        totalCost={totalCost}
        finopsTips={finopsTips}
      />

      {/* 5. Alternativas */}
      <section>
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <GitCompare size={16} className="text-primary" />
          </div>
          Alternativas Consideradas
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {alternativesItems.map((alt: any, idx: number) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-primary/50 p-5 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-foreground mb-1">{alt.name}</h4>
              <p className="text-sm text-secondary-foreground">{alt.trade_off}</p>
            </div>
          ))}
          {alternativesItems.length === 0 && (
            <p className="text-muted-foreground italic text-sm py-4">Nenhuma alternativa levantada para este cenário.</p>
          )}
        </div>
      </section>

    </div>
  );
}
