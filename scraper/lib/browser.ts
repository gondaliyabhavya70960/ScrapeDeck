import type { Browser, Page } from 'playwright-core';
import { USER_AGENT } from './fetch';

/**
 * Lazy Playwright Chromium (Phase 7, opt-in). Only loaded when a source's
 * adapter calls ctx.getPage(); the default HTTP run never touches Playwright.
 *
 * Enabling browser sources:
 *   1. set the repo variable USE_BROWSER=true (the workflow then installs Chromium)
 *   2. optionally point PLAYWRIGHT_CHROMIUM_PATH at the browser binary
 *      (e.g. /opt/pw-browsers/chromium in some managed environments)
 */
let browserPromise: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
  const { chromium } = await import('playwright-core');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
  return chromium.launch({ headless: true, executablePath });
}

export async function getBrowserPage(): Promise<Page> {
  if (!browserPromise) browserPromise = launch();
  const browser = await browserPromise;
  const context = await browser.newContext({ userAgent: USER_AGENT });
  return context.newPage();
}

/** Close the shared browser at the end of a run (called by the orchestrator). */
export async function closeBrowser(): Promise<void> {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    /* ignore */
  } finally {
    browserPromise = null;
  }
}
