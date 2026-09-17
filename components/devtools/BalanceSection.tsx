import { CvWallet } from '../CavosIcons';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <CvWallet size={20} />
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{title}</p>
      </div>
      {children}
    </div>
  );
}
