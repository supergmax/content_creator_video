import { RenderList } from '@/components/renders/RenderList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function RendersPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold" style={{ color: 'var(--color-brand)' }}>⬡ StellarPulse</span>
        <Link href="/"><Button variant="ghost" size="sm">← Dashboard</Button></Link>
      </header>
      <main className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Historique des rendus</h1>
        <RenderList />
      </main>
    </div>
  );
}
