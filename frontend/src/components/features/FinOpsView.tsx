"use client";

import React, { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { PieChart as PieIcon, BarChart2, Tag, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";

interface CostItem {
  service: string;
  monthly_cost_usd: number;
  notes: string;
}

interface FinOpsTip {
  tip: string;
  potential_saving: string;
  category: string;
}

interface FinOpsViewProps {
  costItems: CostItem[];
  totalCost: string;
  finopsTips?: FinOpsTip[];
}

const CHART_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#14B8A6", "#F97316", "#3B82F6",
  "#EC4899", "#22C55E", "#0EA5E9", "#A855F7",
];

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string; hex: string; border: string }> = {
  compute:    { label: "Computação",     bg: "bg-blue-50",   text: "text-blue-700",   hex: "#3B82F6", border: "border-blue-200"   },
  database:   { label: "Banco de Dados", bg: "bg-violet-50", text: "text-violet-700", hex: "#8B5CF6", border: "border-violet-200" },
  storage:    { label: "Armazenamento",  bg: "bg-amber-50",  text: "text-amber-700",  hex: "#F59E0B", border: "border-amber-200"  },
  network:    { label: "Rede e CDN",     bg: "bg-emerald-50",text: "text-emerald-700",hex: "#10B981", border: "border-emerald-200"},
  security:   { label: "Segurança",      bg: "bg-red-50",    text: "text-red-700",    hex: "#EF4444", border: "border-red-200"    },
  monitoring: { label: "Monitoramento",  bg: "bg-orange-50", text: "text-orange-700", hex: "#F97316", border: "border-orange-200" },
  messaging:  { label: "Mensageria",     bg: "bg-teal-50",   text: "text-teal-700",   hex: "#14B8A6", border: "border-teal-200"   },
  other:      { label: "Outros",         bg: "bg-slate-50",  text: "text-slate-600",  hex: "#94A3B8", border: "border-slate-200"  },
};

function classifyService(name: string): keyof typeof CATEGORY_CONFIG {
  const n = name.toLowerCase();
  if (/lambda|function|fargate|ecs|ec2|compute|cloud run|app engine|aks|gke|kubernetes|container|vm\b|instância|instance/i.test(n)) return "compute";
  if (/rds|aurora|postgres|mysql|dynamo|cosmos|firestore|bigtable|database|sql|redis|elasticache|cache for redis|mongo/i.test(n)) return "database";
  if (/s3|blob|storage|bucket|cloudfront|cdn|cloud storage|files|object/i.test(n)) return "storage";
  if (/load balancer|alb|elb|route 53|dns|traffic manager|gateway|api management|apim|nginx/i.test(n)) return "network";
  if (/shield|key vault|secret|kms|waf|security|sentinel|firewall|identity|cognito|iam/i.test(n)) return "security";
  if (/cloudwatch|monitor|stackdriver|logging|xray|x-ray|insights|grafana|prometheus|alert/i.test(n)) return "monitoring";
  if (/sqs|sns|service bus|pub.?sub|kafka|queue|event|message|notification/i.test(n)) return "messaging";
  return "other";
}

function DonutTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm max-w-[220px]">
      <p className="font-semibold text-slate-800 leading-snug mb-1">{name}</p>
      <p className="font-mono font-bold text-indigo-600">${Number(value).toFixed(2)}<span className="text-slate-400 font-normal">/mês</span></p>
      <p className="text-slate-400 text-xs">{pct}% do total</p>
    </div>
  );
}

function RankingTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-slate-600 text-xs mb-0.5">{label}</p>
      <p className="font-mono font-bold text-indigo-600">${Number(payload[0].value).toFixed(2)}/mês</p>
    </div>
  );
}

function ViewDistribuicao({ items }: { items: CostItem[] }) {
  const valid = items.filter((i) => i.monthly_cost_usd > 0);
  const total = valid.reduce((s, i) => s + i.monthly_cost_usd, 0);
  const data = valid.map((i) => ({ name: i.service, value: i.monthly_cost_usd }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 items-center">
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={68} outerRadius={108} paddingAngle={2} dataKey="value" stroke="none">
              {data.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-1">Passe o cursor sobre as fatias para ver detalhes</p>
      </div>

      <div className="max-h-[250px] overflow-y-auto space-y-1 pr-1">
        {data.map((entry, idx) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0";
          return (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
              <span className="text-sm text-slate-700 flex-1 leading-tight min-w-0">{entry.name}</span>
              <span className="text-xs text-slate-400 shrink-0 w-10 text-right">{pct}%</span>
              <span className="text-sm font-mono font-semibold text-indigo-600 shrink-0 w-20 text-right">${entry.value.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ViewRanking({ items }: { items: CostItem[] }) {
  const sorted = [...items].filter((i) => i.monthly_cost_usd > 0).sort((a, b) => b.monthly_cost_usd - a.monthly_cost_usd);
  const data = sorted.map((i, idx) => ({
    name: i.service.length > 30 ? i.service.slice(0, 28) + "…" : i.service,
    value: i.monthly_cost_usd,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));
  const chartHeight = Math.max(data.length * 46 + 24, 180);

  return (
    <div className="py-6">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} layout="vertical" barCategoryGap="28%" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} width={170} />
          <Tooltip content={<RankingTooltip />} cursor={{ fill: "#f8faff" }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]}>
            {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ViewCategorias({ items }: { items: CostItem[] }) {
  const total = items.reduce((s, i) => s + i.monthly_cost_usd, 0);
  const byCategory: Record<string, { total: number; services: CostItem[] }> = {};
  items.forEach((item) => {
    const cat = classifyService(item.service);
    if (!byCategory[cat]) byCategory[cat] = { total: 0, services: [] };
    byCategory[cat].total += item.monthly_cost_usd;
    byCategory[cat].services.push(item);
  });
  const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="py-6 space-y-3">
      {sorted.map(([cat, data]) => {
        const cfg = CATEGORY_CONFIG[cat];
        const pct = total > 0 ? ((data.total / total) * 100).toFixed(1) : "0";
        return (
          <div key={cat} className={`rounded-lg border ${cfg.border} bg-white p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.hex }} />
                <span className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</span>
                <span className="text-xs text-slate-400">{data.services.length} serviço{data.services.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{pct}%</span>
                <span className="font-mono font-bold text-sm text-slate-800">${data.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cfg.hex }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.services.map((svc, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-md ${cfg.bg} ${cfg.text} font-medium border ${cfg.border}`}>
                  {svc.service} <span className="opacity-60">· ${svc.monthly_cost_usd}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FinOpsView({ costItems, totalCost, finopsTips }: FinOpsViewProps) {
  const [activeView, setActiveView] = useState<"distribuicao" | "ranking" | "categorias">("distribuicao");

  const tabs = [
    { id: "distribuicao", label: "Distribuição", Icon: PieIcon   },
    { id: "ranking",      label: "Ranking",       Icon: BarChart2 },
    { id: "categorias",   label: "Categorias",    Icon: Tag       },
  ] as const;

  const topService = [...costItems].filter((i) => i.monthly_cost_usd > 0).sort((a, b) => b.monthly_cost_usd - a.monthly_cost_usd)[0];

  return (
    <section className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-md">
              <TrendingUp size={16} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Estimativa de Custo Mensal</h3>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {topService && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1">
                <TrendingUp size={11} className="text-rose-500" />
                <span>Maior custo:</span>
                <strong className="text-slate-700">{topService.service}</strong>
                <span className="font-mono text-indigo-600 font-semibold">${topService.monthly_cost_usd}/mês</span>
              </div>
            )}
            <span className="bg-white border border-slate-200 px-4 py-1.5 rounded-full text-sm font-mono font-bold text-indigo-600 shadow-sm">
              {totalCost}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-100 px-6 bg-white">
          <div className="flex gap-0">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={`flex items-center gap-1.5 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeView === id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* View content */}
        <div className="px-6">
          {activeView === "distribuicao" && <ViewDistribuicao items={costItems} />}
          {activeView === "ranking"      && <ViewRanking      items={costItems} />}
          {activeView === "categorias"   && <ViewCategorias   items={costItems} />}
        </div>

        {/* Detailed table */}
        <div className="border-t border-slate-100">
          <div className="px-6 py-2.5 bg-slate-50/60 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detalhamento Completo</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-50 text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3 font-semibold">Serviço</th>
                  <th className="px-6 py-3 font-semibold">Categoria</th>
                  <th className="px-6 py-3 font-semibold whitespace-nowrap">Custo/mês (USD)</th>
                  <th className="px-6 py-3 font-semibold">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {costItems.map((item, idx) => {
                  const cat = classifyService(item.service);
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-800">{item.service}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border} whitespace-nowrap`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono font-semibold text-indigo-600">${item.monthly_cost_usd}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-500">{item.notes}</td>
                    </tr>
                  );
                })}
                {costItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                      Nenhum dado de custo disponível.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FinOps Tips */}
      {finopsTips && finopsTips.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-md">
              <Lightbulb size={16} className="text-amber-600" />
            </div>
            <h4 className="text-base font-semibold text-slate-800">Recomendações de Otimização</h4>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {finopsTips.map((tipItem, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="mt-0.5 shrink-0">
                  <ArrowRight size={14} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {tipItem.category}
                    </span>
                    <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      {tipItem.potential_saving}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{tipItem.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
