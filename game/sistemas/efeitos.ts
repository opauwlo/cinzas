// Acessibilidade: todo tremor de câmera e clarão de tela inteira passa por aqui.
// Com cfg.menosEfeitos ligado (fotossensibilidade, enjoo de movimento) nada disso acontece — o jogo segue com som, háptico e partículas locais.
import { useJogo } from '../store';

type Cam = Phaser.Cameras.Scene2D.Camera;
export const menosFx = () => useJogo.getState().cfg.menosEfeitos;
/** tremor de câmera (duração ms, intensidade) — some com "menos efeitos" */
export const tremer = (cam: Cam, dur: number, int: number) => { if (!menosFx()) cam.shake(dur, int); };
/** clarão de tela inteira (duração ms, r, g, b) — some com "menos efeitos" */
export const clarear = (cam: Cam, dur: number, r: number, g: number, b: number) => { if (!menosFx()) cam.flash(dur, r, g, b); };
