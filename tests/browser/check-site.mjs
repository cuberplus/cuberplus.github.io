import { chromium, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const APP_VERSION = readFileSync(new URL('../../shared/config/version.ts', import.meta.url), 'utf8').match(/APP_VERSION = '([^']+)'/)[1];
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined });
const base = process.env.SITE_URL ?? 'http://127.0.0.1:4173';
const routes = ['/', '/timer/', '/analyzer/', '/scrambler/', '/database/', '/trainer/', '/options/'];
const links = [['Home', '/'], ['Timer', '/timer/'], ['Smartcube Analyzer', '/analyzer/'], ['Trainer', '/trainer/'], ['Scrambler', '/scrambler/'], ['Database', '/database/'], ['Options', '/options/']];
const errors = [];
function contrast(first, second) {
  const luminance = color => {
    const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => value / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/options/`);
  await expect(page.getByRole('button', { name: 'Aurora theme', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#091e29');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  for (const width of [1440, 1024, 721, 720, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    let reference;
    let footerReference;
    for (const route of routes) {
      await page.goto(`${base}${route}`);
      const nav = page.getByRole('navigation', { name: 'CuberPlus', exact: true });
      if (width <= 1100) await page.getByRole('button', { name: /^Menu/ }).click();
      await expect(nav).toBeVisible();
      await expect(nav.getByRole('link')).toHaveCount(7);
      for (const [name, href] of links) {
        const link = nav.getByRole('link', { name, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', href);
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      await nav.evaluate(element => { element.scrollLeft = 0; });
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute('href', route);
      const geometry = await page.locator('.cuberplus-navigation:visible').evaluate(element => {
        const brand = element.querySelector('.cuberplus-brand');
        const style = getComputedStyle(brand);
        const rect = node => {
          const { x, y, width, height } = node.getBoundingClientRect();
          return [x, y, width, height].map(value => Math.round(value * 100) / 100);
        };
        return { brand: rect(brand), font: style.font, icons: [...element.querySelectorAll('nav a')].map(rect) };
      });
      reference ??= geometry;
      expect(geometry).toEqual(reference);
      expect(geometry.brand[0]).toBe(width <= 1100 ? 12 : 24);
      expect(geometry.brand[1]).toBe(width <= 1100 ? 8 : 22);
      await expect(page.locator('.cuberplus-brand:visible')).toHaveCSS('font-size', width <= 1100 ? '24px' : '28px');
      if (width <= 1100) await page.getByRole('button', { name: /^Menu/ }).click();
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(16, 20, 30)');
      await expect(page.locator('.cuberplus-header:visible')).toHaveCSS('background-color', 'rgb(16, 20, 30)');
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#10141e');
      const controls = page.locator('.cuberplus-header > .cuberplus-header-controls, .cuberplus-header > .local-badge');
      if (await controls.count()) {
        const rightInset = await controls.evaluate(element => document.documentElement.clientWidth - element.getBoundingClientRect().right);
        expect(rightInset).toBeCloseTo(width <= 720 ? 12 : 24, 0);
      }
      const panel = page.locator('.tool-card:visible, .worksheet-panel:visible, .card:visible, .timer-panel:visible').first();
      await expect(panel).toHaveCSS('background-color', 'rgb(24, 31, 45)');
      await expect(panel).toHaveCSS('border-radius', '16px');
      if (route === '/scrambler/') {
        const settings = page.getByRole('dialog', { name: 'Set your challenge', exact: true });
        await expect(settings).not.toBeVisible();
        await page.getByRole('button', { name: 'Options', exact: true }).click();
        await expect(page.getByRole('spinbutton', { name: 'Minimum turns' })).toHaveValue('4');
        await expect(page.getByRole('spinbutton', { name: 'Maximum turns' })).toHaveValue('8');
        await expect(page.getByLabel('Move metric')).toHaveValue('QTM');
        const fields = await page.locator('.range-inputs > div').evaluateAll(fields => fields.map(field => {
          const input = field.querySelector('input'), label = field.querySelector('span'), style = getComputedStyle(input);
          const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
          context.font = style.font;
          return {
            separated: label.getBoundingClientRect().bottom <= input.getBoundingClientRect().top,
            available: input.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
            required: context.measureText(input.value).width,
          };
        }));
        for (const field of fields) {
          expect(field.separated).toBe(true);
          expect(field.available).toBeGreaterThanOrEqual(field.required);
        }
        await settings.getByRole('button', { name: 'Close options', exact: true }).click();
      }
      const footer = page.getByRole('contentinfo');
      await expect(footer).toHaveCount(1);
      expect(await footer.textContent()).toBe(`CuberPlus ${APP_VERSION}`);
      await footer.scrollIntoViewIfNeeded();
      const footerGeometry = await footer.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const text = range.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          center: Math.round(text.x + text.width / 2 - document.documentElement.clientWidth / 2) || 0,
          bottom: Math.round(document.documentElement.scrollHeight - (element.getBoundingClientRect().bottom + scrollY)) || 0,
          font: style.font, color: style.color, padding: style.padding,
          afterContent: element.previousElementSibling.getBoundingClientRect().bottom <= element.getBoundingClientRect().top,
          fillsViewport: document.documentElement.scrollHeight >= innerHeight,
        };
      });
      footerReference ??= footerGeometry;
      expect(footerGeometry).toEqual(footerReference);
      expect(footerGeometry).toMatchObject({ center: 0, bottom: 0, padding: '24px', afterContent: true, fillsViewport: true });
      await page.evaluate(() => scrollTo(0, 0));
      console.log(`PASS matching header and Timer palette: ${route} at ${width}px`);
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base);
  const cards = page.locator('.tool-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.last()).toHaveAttribute('href', '/database/');
  await expect.poll(() => cards.last().getByRole('img').evaluate(image => image.complete && image.naturalWidth === 1440 && image.naturalHeight === 900)).toBe(true);
  await expect(cards.first()).toHaveAttribute('href', '/timer/');
  await expect(cards.first().getByRole('heading', { name: 'Timer', exact: true })).toBeVisible();
  expect(await cards.first().getByRole('img').evaluate(image => image.complete && image.naturalWidth === 1440 && image.naturalHeight === 900)).toBe(true);
  await cards.first().click();
  await expect(page).toHaveURL(`${base}/timer/`);
  await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name: 'Home', exact: true }).click();
  for (const [name, route] of [...links.slice(1), links[0]]) {
    await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(`${base}${route}`);
  }
  await page.goto(`${base}/database/`);
  const groups = page.locator('.database-group');
  await expect(groups).toHaveCount(4);
  for (const [i, count] of [41, 54, 57, 21].entries()) {
    const group = groups.nth(i);
    await expect(group).not.toHaveAttribute('open');
    await group.locator(':scope > summary').click();
    const properties = group.locator('.database-property > summary');
    await expect(properties.first()).toBeVisible();
    for (const summary of await properties.all()) await summary.click();
    await expect(group.getByRole('article')).toHaveCount(count);
    await expect(group.getByRole('img')).toHaveCount(count);
    await expect(group.getByRole('img').first()).toBeVisible();
    expect(await group.getByRole('article').evaluateAll(cases => cases.every(entry => entry.querySelectorAll('.database-algorithm').length <= 3))).toBe(true);
  }
  const firstCase = page.getByRole('article', { name: 'F2L 1', exact: true });
  await expect(firstCase.locator('.database-algorithm')).toHaveCount(3);
  await firstCase.getByRole('button', { name: 'Show all F2L 1 algorithms', exact: true }).click();
  expect(await firstCase.locator('.database-algorithm').count()).toBeGreaterThan(3);
  const fourth = firstCase.locator('.database-algorithm').nth(3), fourthAlgorithm = await fourth.locator('p').textContent();
  await fourth.getByRole('button', { name: /^Favorite / }).click();
  await expect(firstCase.locator('.database-algorithm p').first()).toHaveText(fourthAlgorithm);
  await expect(firstCase.getByRole('button', { name: 'Show fewer F2L 1 algorithms', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await firstCase.getByRole('button', { name: 'Show fewer F2L 1 algorithms', exact: true }).click();
  await expect(firstCase.locator('.database-algorithm')).toHaveCount(3);
  await expect(firstCase.locator('.database-algorithm p').first()).toHaveText(fourthAlgorithm);
  await page.reload();
  await groups.first().locator(':scope > summary').click();
  for (const summary of await groups.first().locator('.database-property > summary').all()) await summary.click();
  await expect(firstCase.locator('.database-algorithm p').first()).toHaveText(fourthAlgorithm);
  await firstCase.locator('.database-algorithm').first().getByRole('button', { name: /^Unfavorite / }).click();
  await page.getByText('Algorithm tools', { exact: true }).click();
  await page.getByRole('button', { name: 'Add your own algorithm', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Algorithm', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close add algorithm', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Algorithm', exact: true })).toHaveCount(0);
  await expect(firstCase.getByRole('button', { name: /^Delete / })).toHaveCount(0);
  const customAlgorithm = `U U' ${await firstCase.locator('.database-algorithm p').first().textContent()}`;
  await page.getByRole('button', { name: 'Add your own algorithm', exact: true }).click();
  await page.getByRole('textbox', { name: 'Algorithm', exact: true }).fill(customAlgorithm);
  await page.getByRole('button', { name: 'Add algorithm', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Algorithm added.', { timeout: 60000 });
  await page.getByRole('button', { name: 'Close add algorithm', exact: true }).click();
  const removeCustom = firstCase.getByRole('button', { name: /^Delete / });
  const customRow = removeCustom.locator('..');
  await customRow.getByRole('button', { name: /^Favorite / }).click();
  await page.reload();
  await groups.first().locator(':scope > summary').click();
  for (const summary of await groups.first().locator('.database-property > summary').all()) await summary.click();
  await expect(removeCustom).toBeVisible();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const removeBox = await removeCustom.boundingBox();
    const unlearnBox = await customRow.getByRole('button', { name: /^Unlearn / }).boundingBox();
    const textBox = await customRow.locator('p').boundingBox();
    expect(removeBox.x + removeBox.width).toBeLessThanOrEqual(unlearnBox.x);
    expect(removeBox.y).toBe(unlearnBox.y);
    if (width <= 540) expect(textBox.y).toBeGreaterThanOrEqual(removeBox.y + removeBox.height);
    else expect(textBox.x + textBox.width).toBeLessThan(removeBox.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await removeCustom.click();
  await expect(removeCustom).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cuberplus-custom-algorithms'))['F2L-1'])).toBeUndefined();
  await page.reload();
  await groups.first().locator('summary').click();
  await expect(removeCustom).toHaveCount(0);
  await expect(firstCase.locator('.database-algorithm')).toHaveCount(3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const toolbar = page.locator('.database-heading');
  const toolbarHeight = (await toolbar.boundingBox()).height;
  await page.getByText('Algorithm tools', { exact: true }).click();
  for (const [name, result] of [['Automatically find favorites', 'Added 0 favorites'], ['Learn algorithms from solves', 'Learned 0 algorithms']]) {
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name, exact: true }).click();
    const notice = page.getByRole('complementary', { name: 'Algorithm notification', exact: true });
    await expect(notice.getByRole('status')).toContainText(result, { timeout: 60000 });
    await expect(notice).toHaveCount(1);
    await expect(notice).toHaveCSS('position', 'fixed');
    const box = await notice.boundingBox();
    expect(box.y).toBe(16);
    expect(1440 - box.x - box.width).toBeCloseTo(16, 0);
    expect((await toolbar.boundingBox()).height).toBe(toolbarHeight);
  }
  await page.getByRole('button', { name: 'Dismiss algorithm notification', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Algorithm notification', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Favorite F2L 1 algorithm 1', exact: true }).click();
  await page.reload();
  await groups.first().locator('summary').click();
  await expect(page.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorite F2L 1 algorithm 1', exact: true })).toHaveAttribute('aria-pressed', 'false');
  const cold = await browser.newContext(), coldPage = await cold.newPage(), requests = [];
  coldPage.on('request', request => requests.push(request.url()));
  await coldPage.goto(`${base}/database/#OLL-27`);
  await expect(coldPage.locator('#OLL-27 img.database-case-image')).toBeVisible();
  expect(requests.some(url => /\/(?:puzzle-|cubing-core-|timer\/src\/puzzle|node_modules\/\.vite\/deps\/cubing)/.test(url))).toBe(false);
  await cold.close();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const image = await page.getByRole('img', { name: 'F2L 1 case', exact: true }).boundingBox();
    const algorithm = await page.getByRole('article', { name: 'F2L 1', exact: true }).locator('.database-algorithm').first().boundingBox();
    expect(image.x + image.width).toBeLessThan(algorithm.x);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  console.log('PASS algorithm database cases, images, responsive layout and persistent favorites');
  await page.goto(`${base}/timer/`);
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const discover = page.getByRole('button', { name: 'Automatically find favorites', exact: true });
  await expect(discover).toBeEnabled({ timeout: 60000 });
  page.once('dialog', dialog => dialog.accept());
  await discover.click();
  const timerNotice = page.getByRole('complementary', { name: 'Algorithm notification', exact: true });
  await expect(timerNotice.getByRole('status')).toContainText('Added 0 favorites', { timeout: 60000 });
  await expect(timerNotice).toHaveCSS('position', 'fixed');
  await timerNotice.getByRole('button', { name: 'Dismiss algorithm notification', exact: true }).click();
  await page.getByRole('button', { name: 'Close options', exact: true }).click();
  await page.goto(`${base}/options/`);
  await expect(page.getByRole('button', { name: 'Install app', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Light theme', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Smartcube Analyzer', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 246, 250)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f3f6fa');
  await expect(page.locator('.card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('contentinfo')).toHaveCSS('color', 'rgb(88, 103, 123)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light');
  for (const [theme, background] of [['aurora', 'rgb(9, 30, 41)'], ['disco', 'rgb(32, 16, 46)'], ['inferno', 'rgb(28, 12, 10)'], ['dark', 'rgb(16, 20, 30)']]) {
    await page.goto(`${base}/options/`);
    await page.getByRole('button', { name: `${theme[0].toUpperCase() + theme.slice(1)} theme`, exact: true }).click();
    for (const [name] of links) {
      await page.getByRole('navigation', { name: 'CuberPlus', exact: true }).getByRole('link', { name, exact: true }).click();
      await expect(page.locator('body')).toHaveCSS('background-color', background);
      await expect(page.locator('.cuberplus-header:visible')).toHaveCSS('background-color', background);
      const artwork = await page.locator('.cuberplus-page:visible').evaluate(element => getComputedStyle(element).backgroundImage);
      expect(artwork === 'none').toBe(theme === 'dark');
      if (theme === 'inferno') { expect(artwork).toMatch(/url\("[^"]*(?:\.svg|image\/svg\+xml)/); expect(artwork).not.toContain('conic-gradient'); }
      const footer = await page.getByRole('contentinfo').evaluate(element => {
        const style = getComputedStyle(element);
        const alpha = style.backgroundColor.match(/\/\s*([\d.]+)\s*\)$/)?.[1] ?? style.backgroundColor.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/)?.[1] ?? '1';
        return { alpha: Number(alpha), opacity: style.opacity };
      });
      expect(footer.alpha).toBeGreaterThan(0);
      expect(footer.alpha).toBeLessThan(1);
      expect(footer.opacity).toBe('1');
      const panel = page.locator('.tool-card:visible, .card:visible, .panel:visible, .settings-panel:visible').first();
      const colors = await panel.evaluate(element => {
        const style = getComputedStyle(element);
        return [style.color, style.getPropertyValue('--cp-muted'), style.getPropertyValue('--cp-accent'), style.backgroundColor];
      });
      for (const text of colors.slice(0, 3)) {
        const rgb = await page.evaluate(color => {
          const element = document.createElement('span');
          element.style.color = color;
          document.body.append(element);
          const result = getComputedStyle(element).color;
          element.remove();
          return result;
        }, text);
        expect(contrast(rgb, colors[3])).toBeGreaterThanOrEqual(4.5);
      }
    }
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.cuberplus-page:visible')).toHaveCSS('background-image', 'none');
    await page.emulateMedia({ media: 'screen' });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  }
  await page.goto(`${base}/analyzer/`);
  await page.getByRole('button', { name: 'Data', exact: true }).click();
  await page.getByRole('dialog', { name: 'Load analysis data' }).locator('summary').filter({ hasText: /^Demo data$/ }).click();
  await page.getByRole('button', { name: /^Dev Solves/ }).click();
  const filters = page.getByRole('button', { name: 'Open filters', exact: true });
  await expect(filters).toBeVisible({ timeout: 60000 });
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 60000 });
  await expect(page.locator('.cuberplus-brand:visible')).toHaveCSS('font-size', '28px');
  expect(await filters.evaluate(element => element.closest('main') !== null)).toBe(true);
  await filters.click();
  await expect(page.locator('.offcanvas.show')).toBeVisible();
  await expect(page.locator('.offcanvas.show')).toHaveCSS('background-color', 'rgb(24, 31, 45)');
  await page.goto(`${base}/scrambler/`);
  await expect(page.getByRole('button', { name: 'Print sheet' })).toBeEnabled({ timeout: 120000 });
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.cuberplus-header')).toBeHidden();
  await expect(page.locator('.cuberplus-footer')).toBeHidden();
  await expect(page.locator('.worksheet')).toBeVisible();
  await expect(page.locator('.worksheet-panel')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const phone = await mobile.newPage(), touch = await mobile.newCDPSession(phone);
  await phone.goto(base);
  async function swipe(left) {
    await phone.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    const header = phone.locator('.cuberplus-header:visible');
    await expect(header).toBeInViewport();
    const area = await header.boundingBox();
    const x = left ? 280 : 100, y = area.y + 3;
    expect(await phone.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, { x, y })).toBe('HEADER');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 3; step++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (left ? -1 : 1) * step * 60, y }] });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  for (const [name, path] of links.slice(1)) {
    await expect(phone.getByRole('button', { name: /^Menu/ })).toBeVisible();
    await swipe(true);
    await expect(phone).toHaveURL(`${base}${path}`);
    await expect(phone.locator(`nav a[aria-current="page"][href="${path}"]`)).toHaveCount(1);
  }
  for (const [name, path] of links.slice(0, -1).reverse()) {
    await swipe(false);
    await expect(phone).toHaveURL(`${base}${path}`);
    await expect(phone.locator(`nav a[aria-current="page"][href="${path}"]`)).toHaveCount(1);
  }
  const cardImage = phone.locator('.tool-card img').first(), cardBox = await cardImage.boundingBox();
  const y = Math.max(100, Math.min(700, cardBox.y + 60));
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 280, y }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 100, y }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(phone).toHaveURL(`${base}/timer/`);
  await mobile.close();
  expect(errors).toEqual([]);
  console.log('PASS global options/themes, mobile swipe navigation, Timer options, Analyzer charts/filters, and printable worksheets');
} finally {
  await browser.close();
}
