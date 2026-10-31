import type { Resumo } from '../game/store';

/** Card vertical (formato Stories) com o resumo da run, para navigator.share. */
export async function gerarCartao(r: Resumo, seed: string): Promise<Blob> {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, '#3a1f4d'); bg.addColorStop(0.5, '#150f24'); bg.addColorStop(1, '#0c0914'); g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
  const sol = g.createRadialGradient(540, 520, 20, 540, 520, 520); sol.addColorStop(0, 'rgba(166,255,59,.55)'); sol.addColorStop(1, 'rgba(166,255,59,0)'); g.fillStyle = sol; g.fillRect(0, 0, 1080, 1100);
  g.fillStyle = '#05030a'; for (let i = 0; i < 11; i++) { const w = 70 + (i * 37) % 70, h = 140 + (i * 83) % 330, x = i * 100 - 20; g.fillRect(x, 1130 - h, w, h + 800); }
  g.textAlign = 'center'; g.fillStyle = '#ffd700'; g.font = '900 150px Cinzel, serif'; g.shadowColor = 'rgba(255,87,51,.6)'; g.shadowBlur = 40; g.fillText('CINZAS', 540, 300); g.shadowBlur = 0;
  g.fillStyle = r.vitoria ? '#00ffcc' : '#ff5733'; g.font = '900 64px Nunito, sans-serif'; g.fillText(r.vitoria ? 'CHEGUEI AO ABRIGO' : 'SOBREVIVI', 540, 1260);
  g.fillStyle = '#efe6d2'; g.font = '900 220px Nunito, sans-serif'; g.fillText(`${r.dias} ${r.dias === 1 ? 'dia' : 'dias'}`, 540, 1480);
  g.fillStyle = '#b9ae96'; g.font = '800 46px Nunito, sans-serif'; g.fillText(`${r.abates} abates · ${r.vasculhados} saques · rad máx ${r.radMax}%`, 540, 1580);
  g.fillText(`Causa: ${r.causa}`, 540, 1650);
  g.fillStyle = '#ffd700'; g.font = '800 40px Nunito, sans-serif'; g.fillText(`Mundo do dia ${seed} · o mesmo para todo mundo`, 540, 1790);
  g.fillStyle = '#6a5f85'; g.font = '700 34px Nunito, sans-serif'; g.fillText('Consegue chegar mais longe?', 540, 1850);
  return await new Promise<Blob>(res => c.toBlob(b => res(b!), 'image/png'));
}
/** Compartilha pelo sistema; se não der, devolve a URL da imagem para a tela mostrar (segurar para salvar). */
export async function compartilhar(r: Resumo, seed: string): Promise<string | null> {
  const blob = await gerarCartao(r, seed); const f = new File([blob], 'cinzas.png', { type: 'image/png' });
  const texto = `Sobrevivi ${r.dias} dia(s) em CINZAS. Mesmo mundo de hoje para todo mundo. Chega mais longe?`;
  try { if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], text: texto, title: 'CINZAS' }); return null; } } catch (e) { if ((e as Error)?.name === 'AbortError') return null; }
  return await new Promise<string>(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(blob); });
}
