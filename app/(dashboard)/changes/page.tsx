import { getDashboardData, filterByVertical } from '@/lib/sheet-data';
import { PageHeader } from '@/app/components/PageHeader';
import { DownloadButton } from '@/app/components/DownloadButton';
import { ErrorState } from '@/app/components/ui/ErrorState';
import { ChangesFeed } from '@/app/components/ChangesFeed';

export const revalidate = 600;

export default async function ChangesPage({
  searchParams,
}: {
  searchParams: { v?: string };
}) {
  const data = await getDashboardData();
  const vertical = searchParams.v ?? 'all';

  if (!data.ok) {
    return (
      <>
        <PageHeader title="Changes" subtitle="Detected price & stock changes" />
        <ErrorState detail={data.error} />
      </>
    );
  }

  const changes = filterByVertical(data.changes, vertical);
  const sources = [...new Set(changes.map((c) => c.source))].sort();

  return (
    <>
      <PageHeader
        title="Changes"
        subtitle="Price drops, rises and stock transitions, grouped by day"
        actions={
          <DownloadButton
            query={`tab=changes${vertical !== 'all' ? `&v=${vertical}` : ''}`}
          />
        }
      />
      <ChangesFeed changes={changes} sources={sources} />
    </>
  );
}
