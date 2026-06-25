import { CloudOff } from 'lucide-react';

export function ErrorState({
  title = 'Couldn’t reach the Google Sheet',
  detail,
}: {
  title?: string;
  detail?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--up)]/10 text-up">
        <CloudOff size={22} />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-md text-xs text-muted">
        {detail ??
          'Check that GOOGLE_SERVICE_ACCOUNT_KEY_B64 and SHEET_ID are set, and that the service-account email has Editor access to the Sheet.'}
      </p>
    </div>
  );
}
