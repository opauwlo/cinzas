'use client';
import dynamic from 'next/dynamic';

const Jogo = dynamic(() => import('../components/Jogo'), { ssr: false });

export default function Page() {
  return <Jogo />;
}
