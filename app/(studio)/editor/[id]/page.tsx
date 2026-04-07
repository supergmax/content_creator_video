import { ControlPanel } from '@/components/studio/ControlPanel';
import { PreviewPanel } from '@/components/studio/PreviewPanel';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="border-b px-4 py-2 flex items-center gap-4 shrink-0">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs">← Dashboard</Button>
        </Link>
        <span className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>⬡ StellarPulse Studio</span>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 shrink-0 overflow-hidden">
          <ControlPanel />
        </div>
        <div className="flex-1 overflow-hidden">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
}
