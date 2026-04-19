import { GenerateForm } from "@/components/features/GenerateForm";

export default function Home() {
  return (
    <div className="flex flex-col h-full py-12 max-w-5xl 2xl:max-w-7xl w-full mx-auto px-4 sm:px-8">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Gerador de Arquitetura Multi-Cloud</h1>
        <p className="text-secondary-foreground text-lg max-w-2xl mx-auto">
          Descreva seu sistema detalhadamente e deixe a IA cuidar da engenharia.
        </p>
      </div>
      <GenerateForm />
    </div>
  );
} 
