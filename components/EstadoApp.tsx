'use client';
import { useEffect, useState } from 'react';
import { p } from './Cartao';

type Instalacao = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
/** Estado real do navegador; a interface só promete offline após o precache completo. */
export function EstadoApp() {
  const [online, setOnline] = useState(true), [pronto, setPronto] = useState(false), [instalar, setInstalar] = useState<Instalacao | null>(null);
  const [instalado, setInstalado] = useState(false), [atualizacao, setAtualizacao] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    let vivo = true;
    const rede = () => setOnline(navigator.onLine);
    const mudanca = (e: Event) => { const d = (e as CustomEvent).detail; if (d?.offline) setPronto(true); if (d?.worker) setAtualizacao(d.worker); };
    const convite = (e: Event) => { e.preventDefault(); setInstalar(e as Instalacao); };
    const instaladoAgora = () => { setInstalado(true); setInstalar(null); };
    rede(); setInstalado(matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches);
    window.addEventListener('online', rede); window.addEventListener('offline', rede); window.addEventListener('cinzas:app', mudanca);
    window.addEventListener('beforeinstallprompt', convite); window.addEventListener('appinstalled', instaladoAgora);
    if ('serviceWorker' in navigator) void navigator.serviceWorker.getRegistration().then(r => { if (!vivo || !r) return; if (r.waiting) setAtualizacao(r.waiting); r.active?.postMessage({ tipo: 'ESTADO_OFFLINE' }); });
    const mensagem = (e: MessageEvent) => { if (e.data?.tipo === 'OFFLINE_PRONTO') setPronto(true); };
    navigator.serviceWorker?.addEventListener('message', mensagem);
    return () => { vivo = false; window.removeEventListener('online', rede); window.removeEventListener('offline', rede); window.removeEventListener('cinzas:app', mudanca); window.removeEventListener('beforeinstallprompt', convite); window.removeEventListener('appinstalled', instaladoAgora); navigator.serviceWorker?.removeEventListener('message', mensagem); };
  }, []);
  return <div className="estado-app"><span role="status"><i className={online || pronto ? 'ok' : ''} />{!online ? pronto ? 'Sem conexão · pronto para jogar' : 'Sem conexão' : pronto ? 'Disponível offline neste aparelho' : 'Conectado · preparando modo offline'}</span>
    {instalar && !instalado && <button className="btn" {...p(() => { void instalar.prompt().then(() => instalar.userChoice).then(c => { if (c.outcome === 'accepted') setInstalar(null); }).catch(() => setInstalar(null)); })}>Instalar app ↗</button>}
    {!instalar && !instalado && <details><summary>Levar para a tela inicial</summary><p>No Chrome, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”. No iPhone, use Compartilhar → Adicionar à Tela de Início.</p></details>}
    {atualizacao && <button className="btn" {...p(() => { navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); atualizacao.postMessage({ tipo: 'ATUALIZAR' }); })}>Atualização pronta · reiniciar app</button>}
  </div>;
}
