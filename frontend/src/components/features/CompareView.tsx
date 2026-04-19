import { CompareArchitectureResult } from "@/lib/api";
import { useState } from "react";
import { ResultView } from "./ResultView";

export function CompareView({ results }: { results: CompareArchitectureResult[] }) {
  // Encontrar o menor custo
  let minCost = Infinity;
  let cheapestProvider = "";

  results.forEach((res) => {
    if (!res.error && res.total_monthly_cost) {
      const cost = Number(res.total_monthly_cost);
      if (!isNaN(cost) && cost < minCost) {
        minCost = cost;
        cheapestProvider = res.provider;
      }
    }
  });

  // Fallback to first provider if results is empty or just in case
  const defaultTab = results.length > 0 ? results[0].provider : "AWS";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const activeResult = results.find(r => r.provider === activeTab);

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Comparação Multi-cloud</h2>
      </div>

      <div className="w-full">
        <div className="flex w-full border-b border-gray-200">
          {results.map((res) => (
            <button
              type="button"
              key={res.provider}
              onClick={() => setActiveTab(res.provider)}
              className={`relative flex-1 pb-3 pt-2 text-center text-sm font-medium transition-all ${
                activeTab === res.provider
                  ? "border-b-2 border-[#7C8CFF] text-[#7C8CFF]"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="font-medium text-base">{res.provider}</span>
              {res.provider === cheapestProvider && (
                <span className="absolute -top-3 -right-2 bg-[#6DD4B0] text-[#1E1E2E] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                  Mais Econômico
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-6">
          {activeResult && activeResult.error ? (
              <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
                <h3 className="font-bold text-lg mb-2">Erro ao gerar {activeResult.provider}</h3>
                <p className="text-sm">{activeResult.error}</p>
              </div>
          ) : (
            activeResult && <ResultView result={activeResult} />
          )}
        </div>
      </div>
    </div>
  );
}
