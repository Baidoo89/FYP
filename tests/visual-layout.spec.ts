import { expect, test, type BrowserContext, type Page, type TestInfo } from '@playwright/test';

type PortalAccount = {
  key: string;
  email: string;
  password: string;
  routes: Array<{ name: string; path: string }>;
};

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

const accounts: PortalAccount[] = [
  {
    key: 'applicant',
    email: '4231230141@live.gctu.edu.gh',
    password: 'Applicant123!',
    routes: [
      { name: 'dashboard', path: '/lecturer-portal' },
      { name: 'start-application', path: '/lecturer-portal/start-application' },
      { name: 'application', path: '/lecturer-portal/application' },
      { name: 'evidence', path: '/lecturer-portal/evidence' },
      { name: 'academic-dossier', path: '/lecturer-portal/academic-dossier' },
      { name: 'official-forms', path: '/lecturer-portal/official-forms' },
      { name: 'feedback', path: '/lecturer-portal/queries' },
      { name: 'eligibility', path: '/lecturer-portal/eligibility' },
      { name: 'notifications', path: '/lecturer-portal/notifications' },
      { name: 'profile', path: '/lecturer-portal/profile' },
      { name: 'help', path: '/lecturer-portal/help' },
      { name: 'settings', path: '/lecturer-portal/settings' },
    ],
  },
  {
    key: 'hr',
    email: 'hr.admin@live.gctu.edu.gh',
    password: 'Password123!',
    routes: [
      { name: 'dashboard', path: '/hr/dashboard' },
      { name: 'application-registry', path: '/hr/requests' },
      { name: 'verification-queue', path: '/hr/verify' },
      { name: 'staff-records', path: '/hr/staff-records' },
      { name: 'issue-staff-access', path: '/hr/staff-records/new' },
      { name: 'reports', path: '/analytics' },
      { name: 'audit-trail', path: '/hr/logs' },
      { name: 'notifications', path: '/notifications' },
      { name: 'profile', path: '/hr/profile' },
    ],
  },
  {
    key: 'hod-dean',
    email: 'hod.dean@live.gctu.edu.gh',
    password: 'Password123!',
    routes: [
      { name: 'dashboard', path: '/hod/dashboard' },
      { name: 'review-workspace', path: '/hod/review-queue' },
      { name: 'reports', path: '/analytics' },
      { name: 'notifications', path: '/notifications' },
      { name: 'profile', path: '/hod/profile' },
    ],
  },
  {
    key: 'committee',
    email: 'committee.reviewer@live.gctu.edu.gh',
    password: 'Password123!',
    routes: [
      { name: 'dashboard', path: '/committee/dashboard' },
      { name: 'pending-reviews', path: '/committee/review?segment=pending' },
      { name: 'all-applications', path: '/committee/review?segment=all' },
      { name: 'recommendations', path: '/committee/review?segment=decided' },
      { name: 'eligibility-reports', path: '/analytics' },
      { name: 'audit-trail', path: '/audit' },
      { name: 'notifications', path: '/notifications' },
      { name: 'profile', path: '/committee/profile' },
    ],
  },
  {
    key: 'system-admin',
    email: 'system.admin@live.gctu.edu.gh',
    password: 'Password123!',
    routes: [
      { name: 'dashboard', path: '/system-admin/dashboard' },
      { name: 'users', path: '/system-admin/users' },
      { name: 'structure', path: '/system-admin/structure' },
      { name: 'criteria', path: '/system-admin/criteria' },
      { name: 'settings', path: '/system-admin/settings' },
    ],
  },
];

async function signIn(context: BrowserContext, account: PortalAccount) {
  const response = await context.request.post('/api/auth/login', {
    data: { username: account.email, password: account.password },
  });
  expect(response.ok(), `Login failed for ${account.key}: ${response.status()}`).toBeTruthy();
  const payload = await response.json();
  expect(payload.success, `Login was rejected for ${account.key}`).toBeTruthy();
}

async function inspectLayout(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const overflowPixels = Math.max(root.scrollWidth, body.scrollWidth) - viewportWidth;
    const verticalText: string[] = [];
    const rightEdgeOffenders: string[] = [];

    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;

      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;

      if (style.writingMode !== 'horizontal-tb') {
        verticalText.push(`${element.tagName.toLowerCase()}.${element.className}`.slice(0, 180));
      }

      if (rect.right > viewportWidth + 2 && rect.left < viewportWidth && style.position !== 'fixed') {
        const label = (element.getAttribute('aria-label') || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70);
        rightEdgeOffenders.push(`${element.tagName.toLowerCase()} ${label} right=${Math.round(rect.right)}`);
      }
    }

    const pageText = body.innerText;
    const fatalText = ['Internal Server Error', 'Application error', 'This page could not be found']
      .filter((message) => pageText.includes(message));
    const unresolvedLoading = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .filter((element) => {
        const text = (element.textContent || '').trim().replace(/\s+/g, ' ');
        if (!/^Loading\b/i.test(text)) return false;
        if (Array.from(element.children).some((child) => /^Loading\b/i.test((child.textContent || '').trim()))) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
      })
      .map((element) => (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100));
    const unresolvedSkeletons = Array.from(document.querySelectorAll<HTMLElement>('.animate-pulse'))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
      })
      .length;

    return {
      overflowPixels,
      verticalText: verticalText.slice(0, 10),
      rightEdgeOffenders: rightEdgeOffenders.slice(0, 10),
      fatalText,
      unresolvedLoading: unresolvedLoading.slice(0, 10),
      unresolvedSkeletons,
    };
  });
}

async function waitForLoadingPanels(page: Page) {
  await page.waitForFunction(() => {
    const hasVisibleLoadingText = Array.from(document.querySelectorAll<HTMLElement>('body *')).some((element) => {
      const text = (element.textContent || '').trim().replace(/\s+/g, ' ');
      if (!/^Loading\b/i.test(text)) return false;
      if (Array.from(element.children).some((child) => /^Loading\b/i.test((child.textContent || '').trim()))) return false;
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
    });
    const hasVisibleSkeleton = Array.from(document.querySelectorAll<HTMLElement>('.animate-pulse')).some((element) => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
    });
    return !hasVisibleLoadingText && !hasVisibleSkeleton;
  }, undefined, { timeout: 45_000 }).catch(() => undefined);
}

async function auditPage(page: Page, route: { name: string; path: string }, account: PortalAccount, viewportName: string, testInfo: TestInfo) {
  const response = await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  expect(response, `${route.path} did not return a response`).not.toBeNull();
  expect(response!.status(), `${route.path} returned HTTP ${response!.status()}`).toBeLessThan(400);

  await page.locator('body').waitFor({ state: 'visible' });
  await waitForLoadingPanels(page);

  const metrics = await inspectLayout(page);
  await page.screenshot({
    path: testInfo.outputPath('screenshots', viewportName, account.key, `${route.name}.png`),
    fullPage: true,
    animations: 'disabled',
  });

  expect(metrics.fatalText, `${route.path} displayed a fatal error`).toEqual([]);
  expect(metrics.unresolvedLoading, `${route.path} did not finish loading`).toEqual([]);
  expect(metrics.unresolvedSkeletons, `${route.path} still displays loading skeletons`).toBe(0);
  expect(metrics.verticalText, `${route.path} contains vertical writing`).toEqual([]);
  expect(metrics.overflowPixels, `${route.path} overflows horizontally by ${metrics.overflowPixels}px; ${metrics.rightEdgeOffenders.join('; ')}`).toBeLessThanOrEqual(2);
}

for (const viewport of viewports) {
  for (const account of accounts) {
    test(`${viewport.name}: ${account.key} portal layout`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        screen: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      });
      await signIn(context, account);
      const page = await context.newPage();

      for (const route of account.routes) {
        await auditPage(page, route, account, viewport.name, testInfo);
      }

      if (viewport.name === 'mobile') {
        await page.goto(account.routes[0].path, { waitUntil: 'domcontentloaded' });
        await page.locator('body').waitFor({ state: 'visible' });
        await waitForLoadingPanels(page);
        const menuButton = page.getByRole('button', { name: 'Toggle navigation menu' });
        const sidebar = page.locator('nav').first();
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        await expect(sidebar).toHaveClass(/translate-x-0/);
        await page.screenshot({
          path: testInfo.outputPath('screenshots', viewport.name, account.key, 'navigation-open.png'),
          fullPage: false,
          animations: 'disabled',
        });
      }

      await context.close();
    });
  }
}

for (const viewport of viewports) {
  test(`${viewport.name}: public access layout`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    const publicRoutes = [
      { name: 'login', path: '/login' },
      { name: 'activate-account', path: '/activate-account' },
    ];

    for (const route of publicRoutes) {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
      const metrics = await inspectLayout(page);
      expect(metrics.fatalText).toEqual([]);
      expect(metrics.verticalText).toEqual([]);
      expect(metrics.overflowPixels, `${route.path} overflows horizontally by ${metrics.overflowPixels}px`).toBeLessThanOrEqual(2);
      await page.screenshot({
        path: testInfo.outputPath('screenshots', viewport.name, 'public', `${route.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    await context.close();
  });
}

const applicantAccount = accounts.find((account) => account.key === 'applicant')!;

for (const viewport of viewports) {
  test(`${viewport.name}: consolidated applicant workspace`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      screen: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    await signIn(context, applicantAccount);
    const page = await context.newPage();
    const response = await page.goto('/lecturer-portal/start-application', { waitUntil: 'domcontentloaded', timeout: 45_000 });
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(/\/lecturer-portal\/application$/);
    await page.locator('body').waitFor({ state: 'visible' });
    await waitForLoadingPanels(page);

    await expect(page.getByText('Application checklist')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Application workspace' })).toBeVisible();

    if (viewport.name === 'desktop') {
      await expect(page.getByRole('link', { name: 'My Applications' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Documents' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Feedback & Queries' })).toBeVisible();
    } else {
      const mobileNavigation = page.getByRole('navigation', { name: 'Primary mobile navigation' });
      await expect(mobileNavigation.getByRole('link', { name: 'Applications' })).toBeVisible();
      await expect(mobileNavigation.getByRole('link', { name: 'Documents' })).toBeVisible();
      await expect(mobileNavigation.getByRole('link', { name: 'Feedback' })).toBeVisible();
    }

    const metrics = await inspectLayout(page);
    expect(metrics.fatalText).toEqual([]);
    expect(metrics.unresolvedLoading).toEqual([]);
    expect(metrics.verticalText).toEqual([]);
    expect(metrics.overflowPixels, `Route page overflows by ${metrics.overflowPixels}px`).toBeLessThanOrEqual(2);
    await page.screenshot({
      path: testInfo.outputPath('screenshots', viewport.name, 'applicant', 'automatic-route-resolution.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await context.close();
  });
}
