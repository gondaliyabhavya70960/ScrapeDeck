import { z } from 'zod';

/**
 * Scraper-side environment validation. Imported only by CLI entrypoints
 * (orchestrator + scripts), never by shared libraries, so it can fail fast
 * without poisoning the dashboard's import graph.
 *
 * Secrets are read from process.env only. The Google service-account key is
 * stored base64-encoded (GOOGLE_SERVICE_ACCOUNT_KEY_B64) to dodge the classic
 * `private_key` "\n" corruption that bites raw-JSON env vars.
 */
const EnvSchema = z
  .object({
    STORAGE_BACKEND: z
      .enum(['google-sheets', 'local-xlsx'])
      .default('google-sheets'),

    // Required only when STORAGE_BACKEND=google-sheets (checked below).
    GOOGLE_SERVICE_ACCOUNT_KEY_B64: z.string().min(1).optional(),
    // Optional override for the connected Sheet — a default is baked into
    // sheets.ts (DEFAULT_SHEET_ID), so this only needs setting to target a
    // different spreadsheet. Empty string is treated as "unset".
    SHEET_ID: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().min(1).optional(),
    ),

    // local-xlsx backend writes here (device copy); default ./data.
    DATA_DIR: z.string().min(1).default('data'),

    // Restrict a run to a single source key (fast smoke test): ONLY=rabh.
    ONLY: z.string().min(1).optional(),

    // Optional change/failure notifications. Workflow env passes unset
    // secrets/vars as empty strings, so coerce '' → undefined before validating.
    NOTIFY_WEBHOOK_URL: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().url().optional(),
    ),
    NOTIFY_WEBHOOK_KIND: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.enum(['discord', 'slack']).optional(),
    ),

    // GitHub Actions injects this; used for the run summary table.
    GITHUB_STEP_SUMMARY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_BACKEND === 'google-sheets') {
      if (!env.GOOGLE_SERVICE_ACCOUNT_KEY_B64) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['GOOGLE_SERVICE_ACCOUNT_KEY_B64'],
          message:
            'Required when STORAGE_BACKEND=google-sheets. Base64-encode your service-account JSON key and set it as a secret.',
        });
      }
      // SHEET_ID is optional: a default (DEFAULT_SHEET_ID) is baked into
      // sheets.ts, so only the service-account key is strictly required.
    }
    if (env.NOTIFY_WEBHOOK_URL && !env.NOTIFY_WEBHOOK_KIND) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NOTIFY_WEBHOOK_KIND'],
        message: 'Set NOTIFY_WEBHOOK_KIND=discord|slack when a webhook URL is provided.',
      });
    }
  });

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

/** Parse + validate process.env once. Throws a readable error and exits the
 * caller if validation fails (fail fast, before any network calls). */
export function loadEnv(): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    console.error('\n✗ Invalid environment configuration:\n' + issues + '\n');
    console.error('See .env.example for the full list of variables.\n');
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}
