export default function PrivacyPolicy() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-4xl mx-auto card p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Legal</p>
          <h1 className="headline-font text-3xl md:text-4xl">Politica de Privacidade</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Ultima atualizacao: 21/01/2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">1. Dados coletados</h2>
          <p>
            Coletamos dados fornecidos por voce ao criar conta, usar nossos servicos, enviar formularios e navegar no site.
            Isso inclui nome, email, informacoes de perfil e dados de uso.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">2. Como usamos os dados</h2>
          <p>
            Usamos os dados para fornecer a plataforma, melhorar a experiencia, enviar comunicacoes essenciais e manter a
            seguranca do sistema.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">3. Compartilhamento</h2>
          <p>
            Nao vendemos seus dados. Podemos compartilhar com provedores essenciais de infraestrutura e pagamento, sempre
            com protecao adequada.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">4. Seus direitos</h2>
          <p>
            Voce pode solicitar acesso, correcao ou exclusao de dados. Para isso, entre em contato pelo email de suporte.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">5. Seguranca</h2>
          <p>
            Adotamos medidas tecnicas e organizacionais para proteger suas informacoes contra acessos nao autorizados.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">6. Contato</h2>
          <p>
            Em caso de duvidas, fale com nossa equipe de suporte pelo email informado no site.
          </p>
        </section>
      </div>
    </div>
  );
}
