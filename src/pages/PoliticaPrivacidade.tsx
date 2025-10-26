import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function PoliticaPrivacidade() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          Política de Privacidade
        </h1>
        
        <Card>
          <CardContent className="p-8 md:p-12 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Informações que Coletamos</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Coletamos as seguintes informações quando você usa a MAEXTRIA:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Dados de cadastro: nome, e-mail, CPF</li>
                <li>Dados de uso: progresso nos cursos, resultados de avaliações</li>
                <li>Dados de pagamento: informações processadas via gateway seguro</li>
                <li>Dados técnicos: endereço IP, tipo de navegador, sistema operacional</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Como Usamos suas Informações</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Utilizamos seus dados para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Fornecer e melhorar nossos serviços educacionais</li>
                <li>Processar pagamentos e emitir certificados</li>
                <li>Enviar comunicações sobre cursos e atualizações</li>
                <li>Analisar e aprimorar a experiência do usuário</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos seus dados pessoais. Compartilhamos informações apenas com:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Processadores de pagamento (para transações seguras)</li>
                <li>Provedores de serviços técnicos (hospedagem e infraestrutura)</li>
                <li>Autoridades legais (quando exigido por lei)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais para proteger suas informações, 
                incluindo criptografia, controles de acesso e monitoramento contínuo.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                De acordo com a Lei Geral de Proteção de Dados, você tem direito a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar a exclusão de dados (exceto quando houver obrigação legal)</li>
                <li>Revogar consentimento para tratamento de dados</li>
                <li>Portabilidade de dados para outro provedor</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies essenciais para funcionamento da plataforma e cookies analíticos 
                para melhorar sua experiência. Você pode gerenciar preferências de cookies nas 
                configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos seus dados pelo tempo necessário para fornecer nossos serviços e 
                cumprir obrigações legais. Certificados emitidos são mantidos por prazo legal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças 
                significativas através da plataforma ou por e-mail.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Contato do Encarregado de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, 
                entre em contato através dos canais oficiais da MAEXTRIA.
              </p>
            </section>

            <div className="pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
