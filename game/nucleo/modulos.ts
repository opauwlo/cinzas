// Registro dos módulos das libs de área (só a coordenação edita: cada lib pede a linha na sua INTEGRACAO.md).
import type { ModuloJogo } from './contratos';
import { moduloRadiacao } from '../lib/radiacao';
import { moduloEscuta } from '../lib/escuta';
import { moduloProducao } from '../lib/producao';
import { narrativa, TRANSMISSOES } from '../lib/narrativa';
import { catalogo } from '../lib/escuta';

// o conteúdo do rádio vem da Narrativa (a Escuta só toca e verifica)
catalogo(TRANSMISSOES);

/** ordem importa: a radiação emite `geiger` antes de a Escuta ler; a produção mede por último */
export const MODULOS: ModuloJogo[] = [moduloRadiacao, moduloEscuta as ModuloJogo, narrativa as ModuloJogo, moduloProducao as ModuloJogo];
