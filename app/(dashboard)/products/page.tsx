import { getDashboardData, filterByVertical } from '@/lib/sheet-data';
import { PageHeader } from '@/app/components/PageHeader';
import { ErrorState } from '@/app/components/ui/ErrorState';
import { ProductsTable } from '@/app/components/ProductsTable';
import type { PricePoint } from '@/app/components/PriceHistoryChart';
import { verticalLabel } from '@/lib/format';

export const revalidate = 600;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { v?: string };
}) {
  const data = await getDashboardData();
  const vertical = searchParams.v ?? 'all';

  if (!data.ok) {
    return (
      <>
        <PageHeader title="Products" subtitle="Catalogue across all sources" />
        <ErrorState detail={data.error} />
      </>
    );
  }

  const products = filterByVertical(data.products, vertical);
  const keys = new Set(products.map((p) => p.key));

  // Per-product price history (ascending), capped, only for visible products.
  const historyByKey: Record<string, PricePoint[]> = {};
  for (const h of data.history) {
    const key = `${h.source}|${h.externalId}`;
    if (!keys.has(key)) continue;
    (historyByKey[key] ??= []).push({
      t: h.timestamp,
      price: h.price,
      availability: h.availability,
    });
  }
  for (const k of Object.keys(historyByKey)) {
    const arr = historyByKey[k]!;
    if (arr.length > 60) historyByKey[k] = arr.slice(-60);
  }

  const sources = [...new Set(products.map((p) => p.source))].sort();
  const categories = [
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ].sort();

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={
          vertical === 'all'
            ? `${products.length.toLocaleString('en-IN')} products across all sources`
            : `${products.length.toLocaleString('en-IN')} ${verticalLabel(vertical)} products`
        }
      />
      <ProductsTable
        products={products}
        historyByKey={historyByKey}
        sources={sources}
        categories={categories}
        vertical={vertical}
      />
    </>
  );
}
