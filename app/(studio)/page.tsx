import { ProjectGrid } from '@/components/dashboard/ProjectGrid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold" style={{ color: 'var(--color-brand)' }}>⬡ StellarPulse</span>
        <div className="flex items-center gap-3">
          <Link href="/renders">
            <Button variant="ghost" size="sm">Renders</Button>
          </Link>
          <Link href="/editor/new">
            <Button size="sm">+ Nouvelle vidéo</Button>
          </Link>
        </div>
      </header>
      <main className="px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Mes vidéos</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez des vidéos professionnelles pour vos réseaux</p>
        </div>
        <ProjectGrid />
      </main>
    </div>
  );
}
