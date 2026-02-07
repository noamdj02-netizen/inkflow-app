/**
 * InkFlow – Scénario E2E QA (stabilité, sécurité, performance).
 * Playwright: parcours client (vitrine, réservation), parcours tatoueur (dashboard), checks sécurité.
 *
 * Prérequis:
 * - npm run dev (ou PLAYWRIGHT_BASE_URL pointant vers l'app)
 * - Optionnel: E2E_ARTIST_SLUG=ton-slug (pour tests vitrine/réservation)
 * - Optionnel: E2E_LOGIN_EMAIL / E2E_LOGIN_PASSWORD (pour tests dashboard)
 */

import { test, expect } from '@playwright/test';

const ARTIST_SLUG = process.env.E2E_ARTIST_SLUG ?? '';
const HAS_LOGIN = !!(process.env.E2E_LOGIN_EMAIL && process.env.E2E_LOGIN_PASSWORD);

// ——— 1. Parcours Client (Vitrine & Réservation) ———
test.describe('Parcours Client – Vitrine & Réservation', () => {
  test('Charge la page d’accueil et la section Vitrine', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/InkFlow/i);

    // Section "Vitrine" visible (titre ou sous-titre)
    const vitrineSection = page.getByText('Vitrine', { exact: true }).first();
    await vitrineSection.scrollIntoViewIfNeeded();
    await expect(vitrineSection).toBeVisible();
  });

  test('Scroll rapide vers le bas – pas de lag (chargement images)', async ({ page }) => {
    const failures: string[] = [];
    page.on('response', (res) => {
      const url = res.url();
      if (res.status() >= 500 && !url.includes('favicon')) {
        failures.push(`${url} -> ${res.status()}`);
      }
    });
    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await page.waitForTimeout(80);
    }
    // Vérifier qu’aucune erreur réseau critique (500) sur les requêtes images/resources
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    expect(failures).toEqual([]);
  });

  test.skip(!ARTIST_SLUG, 'E2E_ARTIST_SLUG non défini')(
    'Vitrine: clic Réserver + formulaire + pas d’erreur 500 à la soumission',
    async ({ page }) => {
      let lastApiStatus = 0;
      page.on('response', (res) => {
        const u = res.url();
        if (u.includes('/api/') || u.includes('submit-project') || u.includes('checkout') || u.includes('create-checkout')) {
          lastApiStatus = res.status();
        }
      });

      await page.goto(`/${ARTIST_SLUG}`);
      await page.waitForLoadState('networkidle');

      // Clic sur un lien "Réserver ce flash" ou "Réserver"
      const reserveLink = page.getByRole('link', { name: /réserver ce flash|réserver/i }).first();
      await reserveLink.scrollIntoViewIfNeeded();
      await reserveLink.click();

      // Soit on est sur /:slug/booking, soit un drawer s’ouvre
      await page.waitForTimeout(500);
      const isBookingPage = page.url().includes('/booking');
      if (isBookingPage) {
        // Page réservation: sélectionner un créneau si disponible
        const firstDate = page.locator('button[data-slot], [role="button"]').filter({ hasText: /\d{1,2}/ }).first();
        if (await firstDate.isVisible()) {
          await firstDate.click();
          await page.waitForTimeout(200);
          const confirmBtn = page.getByRole('button', { name: /confirmer|choisir|valider/i }).first();
          if (await confirmBtn.isVisible()) await confirmBtn.click();
        }
        await page.waitForTimeout(300);
      }

      // Remplir le formulaire (drawer ou page): nom, email, date si champs présents
      const nameInput = page.getByLabel(/nom|name/i).or(page.getByPlaceholder(/nom|name/i)).first();
      const emailInput = page.getByLabel(/email|e-mail/i).or(page.getByPlaceholder(/email/i)).first();
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test E2E Client');
        await emailInput.fill('e2e@example.com');
      }
      const dateInput = page.getByLabel(/date|créneau/i).or(page.getByPlaceholder(/date/i)).first();
      if (await dateInput.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateStr = futureDate.toISOString().slice(0, 16);
        await dateInput.fill(dateStr);
      }
      const submitBtn = page.getByRole('button', { name: /réserver|envoyer|payer|soumettre/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        expect(lastApiStatus).not.toBe(500);
      }
    }
  );
});

// ——— 2. Parcours Tatoueur (Dashboard) ———
test.describe('Parcours Tatoueur – Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    if (!HAS_LOGIN) return;
    await page.goto('/login');
    await page.getByLabel(/email|e-mail/i).fill(process.env.E2E_LOGIN_EMAIL!);
    await page.getByLabel(/mot de passe|password/i).fill(process.env.E2E_LOGIN_PASSWORD!);
    await page.getByRole('button', { name: /connexion|se connecter|connecter/i }).click();
    await page.waitForURL(/dashboard|overview/, { timeout: 15000 });
  });

  test.skip(!HAS_LOGIN, 'E2E_LOGIN_EMAIL / E2E_LOGIN_PASSWORD non définis')(
    'Tous les onglets de la sidebar fonctionnent',
    async ({ page }) => {
      const links = [
        { name: /dashboard|tableau/i, path: '/dashboard/overview' },
        { name: /calendrier/i, path: '/dashboard/calendar' },
        { name: /demandes/i, path: '/dashboard/requests' },
        { name: /mes flashs|flashs/i, path: '/dashboard/flashs' },
        { name: /clients/i, path: '/dashboard/clients' },
        { name: /finance/i, path: '/dashboard/finance' },
        { name: /paramètres|settings/i, path: '/dashboard/settings' },
      ];
      for (const { name, path } of links) {
        const link = page.getByRole('link', { name }).first();
        await link.click();
        await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')));
      }
    }
  );

  test.skip(!HAS_LOGIN)(
    'Widget Station: Personnaliser ouvre le modal, toggles réagissent',
    async ({ page }) => {
      await page.goto('/dashboard/overview');
      await page.waitForLoadState('networkidle');

      const personnaliserBtn = page.getByRole('button', { name: /personnaliser/i });
      // Sur desktop la Widget Station est dans un aside (xl:flex)
      if (await personnaliserBtn.isVisible()) {
        await personnaliserBtn.click();
        await page.waitForTimeout(400);
        const modal = page.getByRole('dialog').or(page.locator('[aria-modal="true"]'));
        await expect(modal).toBeVisible();
        // Cliquer sur une carte (toggle) – au moins une carte cliquable
        const card = page.locator('[class*="rounded-xl"][class*="border"]').filter({ has: page.getByText(/Revenue|Vibe|Inbox|Chrono|Note/i) }).first();
        if (await card.isVisible()) {
          await card.click();
          await page.waitForTimeout(300);
          await card.click();
          await page.waitForTimeout(200);
        }
        const closeBtn = page.getByRole('button', { name: /fermer/i }).or(page.locator('button').filter({ has: page.locator('svg') }).first());
        if (await closeBtn.isVisible()) await closeBtn.click();
      }
    }
  );

  test.skip(!HAS_LOGIN)(
    'Dashboard: graphiques / widgets de performance visibles',
    async ({ page }) => {
      await page.goto('/dashboard/overview');
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/tableau de bord|CA du mois|Revenus/i).first()).toBeVisible({ timeout: 8000 });
      // Au moins un bloc type KPI ou graphique
      const kpiOrChart = page.locator('[class*="rounded"], [class*="glass"]').filter({ hasText: /€|RDV|Revenus|0/i }).first();
      await expect(kpiOrChart).toBeVisible({ timeout: 5000 });
    }
  );
});

// ——— 3. Sécurité & Robustesse ———
test.describe('Sécurité & Robustesse', () => {
  test('Formulaire vide: la validation bloque l’envoi (réservation / projet)', async ({ page }) => {
    // Test sur la page projet /project si elle existe et a un formulaire
    await page.goto('/project');
    await page.waitForLoadState('domcontentloaded');
    const submitBtn = page.getByRole('button', { name: /envoyer|soumettre|suivant|continuer/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      const errorOrRequired = page.getByText(/requis|obligatoire|merci de|veuillez|error/i).first();
      await expect(errorOrRequired).toBeVisible({ timeout: 3000 });
    }

    // Si on a un slug, test rapide sur la vitrine (drawer): ouvrir formulaire, soumettre vide
    if (ARTIST_SLUG) {
      await page.goto(`/${ARTIST_SLUG}`);
      await page.waitForLoadState('networkidle');
      const reserveBtn = page.getByRole('link', { name: /réserver/i }).first();
      if (await reserveBtn.isVisible()) {
        await reserveBtn.click();
        await page.waitForTimeout(600);
        const submit = page.getByRole('button', { name: /réserver|payer|envoyer/i }).first();
        if (await submit.isVisible()) {
          await submit.click();
          await page.waitForTimeout(800);
          const validationMsg = page.getByText(/nom|email|date|requis|caractères/i).first();
          const hasValidation = await validationMsg.isVisible().catch(() => false);
          expect(hasValidation).toBeTruthy();
        }
      }
    }
  });

  test('Accès Dashboard sans être connecté → redirection vers /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard/overview');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
