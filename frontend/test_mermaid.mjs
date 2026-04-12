import mermaid from 'mermaid';

const code = `graph TD
user[Usuário] -->|Acessa Domínio| R53[Route 53 (DNS)]
R53 -->|Direciona Tráfego| CF[CloudFront (CDN)]
CF -->|Cache e HTTPS| S3_Static[S3 (Arquivos Estáticos)]
GitRepo[Repositório Git] -->|Push de Código| Amplify[AWS Amplify Console]
Amplify -->|Build & Deploy| S3_Static
Amplify -->|Configura CDN| CF
Amplify -->|Integra DNS| R53
ACM[AWS Certificate Manager] -->|Emite Certificado SSL/TLS| CF
style user fill:#e0f7fa,stroke:#00796b,stroke-width:2px`;

async function test() {
  try {
    await mermaid.parse(code);
    console.log("Parse succeeded");
  } catch (err) {
    console.error("Parse failed", err);
  }
}
test();
