import { Layers, ScanSearch } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui';

export default function NotFound() {
  return (
    <Panel className="mx-auto mt-10 max-w-xl p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-brand-500/10 text-brand-300">
        <ScanSearch className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-xl font-semibold text-white">Page not found</h1>
      <p className="mt-2 text-sm text-slate-400">
        This route does not exist in the inspection console.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-aqua-500 px-4 py-2.5 text-sm font-semibold text-[#04121f]"
      >
        <Layers className="h-4 w-4" />
        Back to dashboard
      </Link>
    </Panel>
  );
}
