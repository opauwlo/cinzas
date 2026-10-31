// Entrada do empacotamento em arquivo único (artifact): monta o jogo sem Next.
import { createRoot } from 'react-dom/client';
import Jogo from '../components/Jogo';

createRoot(document.getElementById('root')!).render(<Jogo />);
