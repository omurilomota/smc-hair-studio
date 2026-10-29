import { useEffect, useState } from 'react';

const CONTACT_SELECTOR = [
  'a[href^="tel:"]',
  'a[href^="mailto:"]',
  'a[href*="wa.me"]',
  'a[href*="api.whatsapp.com"]',
  'a[href*="instagram.com"]',
].join(',');

/**
 * Aviso de demonstração.
 *
 * Além de sinalizar que o site é uma peça de portfólio, intercepta links de
 * contato para que nenhum telefone, WhatsApp, e-mail ou rede social fictício
 * abra um canal externo. A navegação normal, o agendamento local e o painel do
 * barbeiro continuam funcionando.
 */
export function DemoNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a');
      if (link && link.matches(CONTACT_SELECTOR)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const handleDemoContact = () => setOpen(true);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('demo:contact', handleDemoContact);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('demo:contact', handleDemoContact);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <>
      {open && (
        <div className="demo-overlay" onClick={() => setOpen(false)}>
          <div
            className="demo-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="demo-dialog-kicker">Demonstração</p>
            <h2 id="demo-dialog-title">Este site é uma peça de portfólio</h2>
            <p>
              Telefone, WhatsApp, redes sociais e endereço são fictícios para
              preservar os dados de clientes. Preços e horários também são
              exemplos.
            </p>
            <p>
              Nenhuma mensagem será enviada e nenhum agendamento sairá do seu
              navegador. Para falar sobre o projeto, use o contato do portfólio.
            </p>
            <button type="button" className="demo-dialog-close" onClick={() => setOpen(false)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
