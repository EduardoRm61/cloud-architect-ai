export default function Home() {
  return (
    <div className="flex justify-center items-center h-full pt-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Bem vindo ao Cloud Architect AI</h1>
        <p className="text-muted-foreground text-lg">
          Descreva seu caso de uso para gerar uma arquitetura de nuvem completa.
        </p>
        <div className="p-8 mt-8 bg-card rounded-xl border shadow-sm">
          <p className="text-sm text-secondary-foreground">O formulário de geração será implementado na Parte 6.</p>
        </div>
      </div>
    </div>
  );
}
