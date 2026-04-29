import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/15" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl dark:bg-purple-500/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.12),transparent_60%)]" />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2"
          aria-label="NexCart home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <ShoppingCart className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Nex<span className="text-indigo-600 dark:text-indigo-400">Cart</span>
          </span>
        </Link>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-8 shadow-xl shadow-gray-900/5 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-900/80 dark:shadow-black/30 sm:p-10">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
