import { Suspense } from 'react';
import { Sidebar, SidebarFallback } from '@/app/components/Sidebar';
import { getDashboardData } from '@/lib/sheet-data';

export const revalidate = 600; // read the Sheet at most every 10 minutes

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await getDashboardData();
  const lastSync = data.ok ? data.lastSync : null;
  const sheetUrl = data.ok ? data.sheetUrl : null;

  return (
    <div className="min-h-screen">
      <Suspense fallback={<SidebarFallback />}>
        <Sidebar lastSync={lastSync} sheetUrl={sheetUrl} />
      </Suspense>
      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
