import { GenerateForm } from "@/components/features/GenerateForm";

export default function Home() {
  return (
    <div className="flex flex-col h-full pt-8 pb-16 max-w-2xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Gerador de Arquitetura</h1>
        <p className="text-secondary-foreground text-lg">
          Descreva seu sistema detalhadamente e deixe a IA cuidar da engenharia.
        </p>
      </div>
      <GenerateForm />
    </div>
  );
}
