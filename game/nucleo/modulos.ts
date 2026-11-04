// Registro dos módulos das libs de área (só a coordenação edita: cada lib pede a linha na sua INTEGRACAO.md).
import type { ModuloJogo } from './contratos';
import { moduloRadiacao } from '../lib/radiacao';

export const MODULOS: ModuloJogo[] = [moduloRadiacao];
