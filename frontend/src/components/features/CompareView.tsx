import { CompareArchitectureResult } from "@/lib/api";
import { useState, useEffect } from "react";
import { ResultView } from "./ResultView";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function extractCostValue(costString: string | number | undefined): number {
  if (costString === undefined || costString === null) return Infinity;
  if (typeof costString === "number") return costString;
  
  const cleanStr = String(costString).replace(/,/g, '');
  const match = cleanStr.match(/[0-9]+(\.[0-9]+)?/);
  if (match) {
    return parseFloat(match[0]);
  }
  
  return Infinity;
}

const PROVIDER_COLORS: Record<string, string> = {
  AWS:   "#FF9900",
  GCP:   "#4285F4",
  Azure: "#00A4EF",
};

function CostBarChart({ results, cheapestProvider }: { results: CompareArchitectureResult[], cheapestProvider: string }) {
  const data = results
    .filter((r) => !r.error)
    .map((r) => ({
      provider: r.provider,
      custo: extractCostValue(r.total_monthly_cost_usd || r.total_monthly_cost),
    }))
    .filter((d) => d.custo !== Infinity);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Comparação de Custo Mensal (USD)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="provider" tick={{ fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}/mês`, "Custo estimado"]}
            cursor={{ fill: "#f8f8ff" }}
          />
          <Bar dataKey="custo" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={PROVIDER_COLORS[entry.provider] ?? "#7C8CFF"}
                opacity={entry.provider === cheapestProvider ? 1 : 0.65}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-center text-muted-foreground mt-2">
        ✅ Barra mais opaca = provedor mais econômico
      </p>
    </div>
  );
}

function ComparisonSummary({ results, cheapestProvider }: { results: CompareArchitectureResult[], cheapestProvider: string }) {
  const providerLabels: Record<string, string> = { AWS: 'AWS', GCP: 'Google Cloud (GCP)', Azure: 'Microsoft Azure', Recomendado: 'Recomendado' };

  if (!results || !Array.isArray(results)) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {results.map((result, idx) => {
        if (!result) return null;
        return (
          <div
            key={result.provider || idx}
            className={`rounded-xl border p-5 transition-shadow hover:shadow-sm ${
              result.provider === cheapestProvider && !result.error
                ? 'border-[#6DD4B0] bg-[#f0fcf9]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg text-gray-900 truncate">
                {result.provider ? (providerLabels[result.provider] || result.provider) : 'Desconhecido'}
              </h3>
              {result.provider === cheapestProvider && !result.error && (
                <span className="text-[11px] bg-[#6DD4B0] text-[#1E1E2E] px-2 py-1 font-bold rounded-full shadow-sm whitespace-nowrap">
                  🏷️ Mais Econômico
                </span>
              )}
            </div>

            {result.error ? (
               <div className="text-red-500 font-medium text-sm mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                  Erro ao calcular estimativa.
               </div>
            ) : (
              <>
                <p className="text-2xl xl:text-3xl font-bold text-gray-800 mb-6 break-words">
                  ${extractCostValue(result.total_monthly_cost_usd || result.total_monthly_cost).toLocaleString('en-US', {minimumFractionDigits: 2})}
                  <span className="text-sm font-normal text-gray-500 whitespace-nowrap"> /mês</span>
                </p>

                {result.architecture?.services && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Principais Serviços</p>
                    <ul className="space-y-2">
                      {result.architecture.services.slice(0, 4).map((service) => (
                        <li key={service.name} className="text-sm text-gray-700 flex items-start leading-tight">
                          <span className="text-[#7C8CFF] mr-2 text-lg leading-4 shrink-0">•</span>
                          <span className="line-clamp-2" title={service.name}>{service.name}</span>
                        </li>
                      ))}
                    </ul>
                    {result.architecture.services.length > 4 && (
                      <p className="text-xs text-gray-400 italic pt-1">
                         + {result.architecture.services.length - 4} outros componentes
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CompareView({ results }: { results: CompareArchitectureResult[] }) {
  const validResults = (results && Array.isArray(results) ? results : []).filter(r => r && r.provider);
  const defaultTab = validResults.length > 0 ? validResults[0].provider : "AWS";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (validResults.length > 0 && !validResults.find(r => r.provider === activeTab)) {
      setActiveTab(validResults[0].provider);
    }
  }, [results, activeTab, validResults]);

  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="font-bold text-lg mb-2">Erro na Comparação</h3>
        <p className="text-sm">Não foi possível carregar os resultados da comparação. Tente novamente mais tarde.</p>
      </div>
    );
  }

  let minCost = Infinity;
  let cheapestProvider = "";

  results.forEach((res) => {
    if (!res) return;
    const rawCost = res.total_monthly_cost_usd || res.total_monthly_cost;
    if (!res.error && rawCost) {
      const cost = extractCostValue(rawCost);
      if (cost < minCost) {
        minCost = cost;
        cheapestProvider = res.provider;
      }
    }
  });

  const activeResult = validResults.find(r => r.provider === activeTab);

  return (
    <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Resumo da Comparação Multi-Cloud</h2>
      </div>

      <CostBarChart results={validResults} cheapestProvider={cheapestProvider} />
      <ComparisonSummary results={validResults} cheapestProvider={cheapestProvider} />

      {validResults.length > 0 && (
        <div className="w-full mt-12 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 text-gray-700 font-semibold text-sm uppercase tracking-wide">
            Visão Detalhada
          </div>
          <div className="px-6 pt-2">
            <div className="flex w-full border-b border-gray-200">
              {validResults.map((res) => (
                <button
                  type="button"
                  key={res.provider}
                  onClick={() => setActiveTab(res.provider)}
                  className={`relative flex-1 pb-4 pt-4 text-center text-sm font-medium transition-all ${
                    activeTab === res.provider
                      ? "border-b-2 border-[#7C8CFF] text-[#7C8CFF]"
                      : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="font-bold text-base">{res.provider}</span>
                  {res.provider === cheapestProvider && !res.error && activeTab !== res.provider && (
                    <span className="ml-2 inline-flex items-center justify-center bg-[#6DD4B0] text-[#1E1E2E] w-2 h-2 rounded-full absolute top-[1.1rem]"></span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-8 pb-8">
              {activeResult && activeResult.error ? (
                  <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    <h3 className="font-bold text-lg mb-2">Erro ao detalhar {activeResult.provider}</h3>
                    <p className="text-sm">{activeResult.error}</p>
                  </div>
              ) : (
                activeResult && <ResultView result={activeResult} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
