import React, { useEffect, useState } from "react";
import "../css/termosPoliticas.css";
import logo from "../images/ArtBeat_Branco.png";

export default function PoliticasPrivacidade() {
  const [data, setData] = useState("");

  useEffect(() => {
    const currentDate = new Date();
    setData(currentDate.toLocaleDateString("pt-BR"));
  }, []);

  return (
   <div className="pagina-termos">
      <header className="topo">
        <img src={logo} alt="Logo ArtBeat" class = "logo" />
        <h1>Políticas de Privacidade</h1>
      </header>

      <main className="esp">
        <h6>Última atualização: <span>25/10/2025</span></h6>
        <p>Valorizamos a sua confiança e nos comprometemos a proteger a sua privacidade...</p>

        <section>
          <h2>Quais Dados Coletamos?</h2>
          <p>Coletamos informações que nos ajudam a fornecer e melhorar nossos serviços...</p>
        </section>

         <p>
                        Valorizamos a sua confiança e nos comprometemos a proteger a sua privacidade. Esta Política de Privacidade explica de forma transparente como coletamos, utilizamos, armazenamos e protegemos os seus dados pessoais quando você utiliza nossos serviços.
            
                        Ao acessar nosso site e utilizar nossos serviços, você concorda com os termos aqui descritos.
                    </p>
            
                    <h2>Quais Dados Coletamos?</h2>
                    <p>
                        Coletamos informações que nos ajudam a fornecer e melhorar nossos serviços para você. Os dados que podemos coletar se enquadram nas seguintes categorias:
                    </p>
                    <p>

                        <div class = "destaque">Dados Fornecidos por Você:</div> Informações que você nos fornece voluntariamente ao se cadastrar ou usar nossos serviços, como nome completo, endereço de e-mail, senha, foto de perfil e, quando aplicável, informações de pagamento para processamento de doações.
                        <div class = "destaque">Conteúdo Gerado pelo Usuário: </div>Todo o conteúdo que você cria e publica em nossa plataforma, incluindo obras de arte, textos, músicas, comentários e notas atribuídas a outros conteúdos.
                        <div class = "destaque">Dados de Navegação:</div> Informações coletadas automaticamente quando você visita nosso site, como endereço IP, tipo de dispositivo, navegador web, páginas acessadas, tempo de permanência e interações com os elementos do site. Isso é feito por meio de tecnologias como cookies.
                    </p>
            
                    <h2>Como Utilizamos as Suas Informações?</h2>
                    <p>Utilizamos os dados coletados para as seguintes finalidades:</p>
                    <li>Criar, gerenciar e proteger a sua conta de usuário.</li>
                    <li>Permitir que você publique conteúdo, comente, atribua notas e participe de desafios e demais funcionalidades da comunidade.</li>
                    <li>Processar de forma segura doações realizadas para os artistas da plataforma.</li>
                    <li>Personalizar e melhorar continuamente a sua experiência em nosso site.</li>
                    <li>Cumprir obrigações legais e regulatórias.</li>
            
                    <h2>Compartilhamento de Dados</h2>
                    <p>Compartilhamos suas informações apenas nas seguintes situações:
                    <div class = "destaque">Provedores de Serviços:</div>Parceiros confiáveis que nos auxiliam na operação do site, como processadores de pagamento para viabilizar as doações. Esses parceiros são obrigados por contrato a manter a confidencialidade e a segurança dos seus dados
                    <div class = "destaque">Requisito Legal:</div> Quando necessário para cumprir uma ordem judicial, mandado ou qualquer outra obrigação legal ou regulatória.
                    </p>
                    <h2>Armazenamento e Segurança dos Dados</h2>
                    <p>Seus dados são armazenados em servidores seguros, que utilizam medidas técnicas e administrativas avançadas para protegê-los contra acessos não autorizados, perda, alteração ou destruição.
            
                    Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as finalidades descritas nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.</p>
            
                    <h2>Seus Direitos (LGPD)</h2>
                    <p>De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/18), você tem os seguintes direitos sobre seus dados pessoais:</p>
                    <li>Acessar e solicitar uma cópia dos dados que mantemos sobre você.</li>
                    <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
                    <li>Solicitar a portabilidade dos seus dados para outro fornecedor de serviço.</li>
                    <li>Solicitar a exclusão dos seus dados pessoais, exceto nos casos em que a manutenção é obrigatória por lei.</li>
                    <li>Revogar o consentimento a qualquer momento, quando o tratamento for baseado nessa fundamentação.</li>
            
                    <h2>Alterações nesta Política</h2>
                    <p>Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por outros motivos operacionais, legais ou regulatórios. Todas as alterações entrarão em vigor assim que forem publicadas nesta página, com a data de "Última atualização" revisada. Recomendamos que você consulte esta política regularmente para estar ciente de como protegemos suas informações.</p>
            
                    <h2>Contato</h2>
                    <p>Se você tiver qualquer dúvida, preocupação ou solicitação relacionada a esta Política de Privacidade ou ao tratamento dos seus dados pessoais, entre em contato com nosso Encarregado de Proteção de Dados (DPO) ou nossa equipe de suporte pelo e-mail: <a href = "https://mail.google.com/mail/?view=cm&fs=1&to=suporteArtBeat@gmail.com" target="_blank">suporteArtBeat@gmail.com</a> .</p>
      </main>

     
    </div>
  );
}
