/**
 * Landing Page
 *
 * Minimal entry page linking to demos.
 */

import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="LandingPage min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-700">
      <div className="text-center text-white p-8">
        <h1 className="text-5xl font-bold mb-4">Portfolio</h1>
        <p className="text-base opacity-80 mb-8">Welcome. Explore the demos below.</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/en/animated-demo" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">
            Animated demo
          </Link>
          <Link href="/en/svg-test" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded">
            SVG test
          </Link>
        </div>
      </div>
    </main>
  );
}