'use client';
import dynamic from 'next/dynamic';

const Jogo = dynamic(() => import('../components/Jogo'), { ssr: false });
const Diag = dynamic(() => import('../components/Diag'), { ssr: false });

export default function Page() {
  return <><Jogo /><Diag /></>;
}
