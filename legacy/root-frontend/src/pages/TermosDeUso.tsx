import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          Termos de Uso
        </h1>
        
        <Card>
          <CardContent className="p-8 md:p-12 space-y-6">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e usar a plataforma MAEXTRIA, você concorda com estes Termos de Uso. 
                Se não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground leading-relaxed">
                A MAEXTRIA é uma plataforma de educação online que oferece cursos gratuitos em diversas áreas. 
                Certificados de conclusão estão disponíveis mediante pagamento de taxa de emissão.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Cadastro e Conta</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Para acessar determinados recursos, você precisará criar uma conta. Você é responsável por:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Manter a confidencialidade de sua senha</li>
                <li>Todas as atividades realizadas em sua conta</li>
                <li>Fornecer informações verdadeiras e atualizadas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Uso dos Cursos</h2>
              <p className="text-muted-foreground leading-relaxed">
                O conteúdo dos cursos é destinado exclusivamente para uso pessoal e educacional. 
                É proibido reproduzir, distribuir ou comercializar o material sem autorização prévia.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Certificados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certificados são emitidos após conclusão do curso e aprovação na avaliação final. 
                A taxa de emissão é não reembolsável. Certificados são válidos conforme legislação vigente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo da plataforma, incluindo textos, gráficos, logos e software, 
                é propriedade da MAEXTRIA e protegido por leis de direitos autorais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                A MAEXTRIA não se responsabiliza por danos indiretos, incidentais ou consequentes 
                decorrentes do uso ou impossibilidade de uso da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Modificações</h2>
              <p className="text-muted-foreground leading-relaxed">
                Reservamos o direito de modificar estes termos a qualquer momento. 
                Alterações entrarão em vigor imediatamente após publicação na plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre estes termos, entre em contato através dos canais oficiais da MAEXTRIA.
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
