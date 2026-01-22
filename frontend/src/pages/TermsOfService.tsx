export default function TermsOfService() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[hsl(var(--background))] py-12 px-[clamp(24px,5vw,80px)]">
      <div className="max-w-4xl mx-auto card p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[hsl(var(--primary))]">Legal</p>
          <h1 className="headline-font text-3xl md:text-4xl">Termos de Servico</h1>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            Ultima atualizacao: 21/01/2026
          </p>
        </div>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">1. Aceitacao</h2>
          <p>
            Ao acessar a plataforma MAEXTRIA, voce concorda com estes termos. Se nao concordar, nao utilize o servico.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">2. Conta e acesso</h2>
          <p>
            Voce e responsavel por manter a confidencialidade da sua conta e por todas as atividades realizadas nela.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">3. Conteudo</h2>
          <p>
            Professores devem publicar conteudo legitimo, sem violar direitos de terceiros ou politicas da plataforma.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">4. Pagamentos</h2>
          <p>
            Pagamentos e repasses seguem as regras definidas pela plataforma e provedores de pagamento integrados.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">5. Suspensao</h2>
          <p>
            Podemos suspender contas que violem estes termos ou usem a plataforma de forma indevida.
          </p>
        </section>

        <section className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">6. Alteracoes</h2>
          <p>
            Podemos atualizar estes termos a qualquer momento. A continuidade do uso indica aceitacao.
          </p>
        </section>
      </div>
    </div>
  );
}
