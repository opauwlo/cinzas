// Registro dos módulos das libs de área (só a coordenação edita: cada lib pede a linha na sua INTEGRACAO.md).
import type { ModuloJogo } from './contratos';
import { moduloRadiacao } from '../lib/radiacao';
import { moduloEscuta } from '../lib/escuta';
import { moduloProducao } from '../lib/producao';
import { narrativa, TRANSMISSOES } from '../lib/narrativa';
import { catalogo } from '../lib/escuta';
import { moduloMusica } from '../lib/musica';
import { barramento } from './barramento';
import { vinhetaRadio } from '../audio';

// o conteúdo do rádio vem da Narrativa (a Escuta só toca e verifica)
catalogo(TRANSMISSOES);
// a vinheta da Farol 107,7 (a segunda nota falha: é o loop) abre cada programa
barramento.on('transmissao', e => { if (e.fase === 'inicio' && e.id.startsWith('farol')) vinhetaRadio('loop'); });

/** ordem importa: a radiação emite `geiger` antes de a Escuta ler; a produção mede por último */
export const MODULOS: ModuloJogo[] = [moduloRadiacao, moduloEscuta as ModuloJogo, narrativa as ModuloJogo, moduloMusica as ModuloJogo, moduloProducao as ModuloJogo];
