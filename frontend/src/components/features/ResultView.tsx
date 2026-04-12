import React from 'react';
import { ArchitectureResult, ServiceRecommendation, CostItem, AlternativeItem } from '@/lib/api';

interface ResultViewProps {
  result: ArchitectureResult;
}

export function ResultView({ result }: ResultViewProps) {
  if (!result) return null;

  // Extração segura porque o pipeline assíncrono envelopa
  // cost_estimate e alternatives dentro de `{ items: [...] }` no BD.
  const architecture = result.architecture || {};
  const services = architecture.services || [];
  
  const costItems = result.cost_estimate?.items || [];
  const totalCost = result.total_monthly_cost || "N/D";
  
  const alternativesItems = result.alternatives?.items || [];

  return (
    <div className="w-full mt-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. Arquitetura */}
      <section className="bg-card rounded-xl shadow-sm border p-6 md:p-8">
        <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
          <span className="bg-primary/10 p-2 rounded-lg">☁️</span> Visão Geral da Arquitetura
        </h2>
        <p className="text-secondary-foreground text-lg leading-relaxed">
          {architecture.description || "Descrição não providenciada pela IA."}
        </p>
      </section>

      {/* 2. Serviços Recomendados */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          🚀 Serviços Recomendados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc: ServiceRecommendation, idx: number) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border p-5 hover:border-primary/50 transition-colors">
              <h4 className="font-semibold text-lg text-primary mb-3 pb-2 border-b">{svc.name}</h4>
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
      </section>

      {/* 3. Estimativa de Custo */}
      <section className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-primary/5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            💰 Estimativa de Custo Mensal
          </h3>
          <span className="bg-white px-4 py-1.5 rounded-full text-sm font-mono font-bold text-primary border shadow-sm">
            {totalCost}
          </span>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/80 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4">Serviço</th>
                <th className="px-6 py-4">Custo Estimado (USD)</th>
                <th className="px-6 py-4">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y text-secondary-foreground">
              {costItems.map((item: CostItem, idx: number) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{item.service}</td>
                  <td className="px-6 py-4 font-mono font-medium">${item.monthly_cost_usd}</td>
                  <td className="px-6 py-4">{item.notes}</td>
                </tr>
              ))}
              {costItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum serviço mapeado com custos pela IA.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Alternativas */}
      <section>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          ⚖️ Alternativas Consideradas
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {alternativesItems.map((alt: AlternativeItem, idx: number) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-l-4 border-l-primary/60 p-5">
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
