import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const url = 'https://meuresiduo.com/';
const outPath = '/home/thiago/Finzar/will_agent/An-lise-competitiva/screenshots/meuresiduo.png';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    const page = await context.newPage();
    console.log(`[FIX] Navegando para ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Nuke popups/overlays
    const closeTexts = ['Aceitar', 'Concordar', 'Fechar', 'Close', 'Accept', 'Accept all', 'OK', 'Entendi', '×'];
    for (const text of closeTexts) {
        try {
            const btns = await page.locator(`button:has-text("${text}"), a:has-text("${text}")`).all();
            for (const btn of btns) {
                if (await btn.isVisible()) await btn.click({ timeout: 500, force: true }).catch(() => {});
            }
        } catch (e) {}
    }

    // Remover overlays grandes
    await page.evaluate(() => {
        document.querySelectorAll('*').forEach(el => {
            const s = window.getComputedStyle(el);
            if (s.position === 'fixed' || s.position === 'sticky') {
                const rect = el.getBoundingClientRect();
                const area = rect.width * rect.height;
                const viewportArea = window.innerWidth * window.innerHeight;
                if (area > viewportArea * 0.3 && parseInt(s.zIndex) > 10) {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });
    });

    // Forçar lazy load via scroll
    console.log('[FIX] Forçando Lazy Load...');
    await page.addStyleTag({ content: '* { scroll-behavior: initial !important; animation: none !important; transition: none !important; }' });
    for (let i = 0; i < 15; i++) {
        try {
            await page.evaluate((step) => window.scrollTo(0, step * 900), i);
            await page.waitForTimeout(200);
        } catch (e) { break; }
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // Encontrar a altura REAL do conteúdo (último elemento com conteúdo visível)
    const realHeight = await page.evaluate(() => {
        // Pegar o bottom do último elemento visível com conteúdo real
        const allEls = Array.from(document.querySelectorAll('footer, [class*="footer"], [id*="footer"], body > *:last-child'));
        let maxBottom = 0;

        // Percorrer todos os elementos e pegar o mais baixo com conteúdo
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
        let node;
        while ((node = walker.nextNode())) {
            const rect = node.getBoundingClientRect();
            const style = window.getComputedStyle(node);
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const absoluteBottom = rect.bottom + scrollTop;

            // Ignorar elementos invisíveis, posicionados fixed, ou muito pequenos
            if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.opacity === '0' ||
                style.position === 'fixed' ||
                rect.width < 10 ||
                rect.height < 10
            ) continue;

            if (absoluteBottom > maxBottom) maxBottom = absoluteBottom;
        }

        return Math.ceil(maxBottom) + 20; // 20px de padding
    });

    console.log(`[FIX] Altura real do conteúdo detectada: ${realHeight}px`);

    // Aplicar conversão de fixed → absolute para não cortar navbar
    await page.evaluate(() => {
        document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
        document.body.style.setProperty('overflow-x', 'hidden', 'important');
        document.querySelectorAll('*').forEach(el => {
            const s = window.getComputedStyle(el);
            if (s.position === 'fixed' || s.position === 'sticky') {
                el.style.setProperty('position', 'absolute', 'important');
                el.style.setProperty('max-width', '1440px', 'important');
            }
        });
    });

    await page.setViewportSize({ width: 1440, height: realHeight });
    await page.waitForTimeout(500);

    console.log(`[FIX] Capturando screenshot 1440 x ${realHeight}px...`);
    await page.screenshot({ path: outPath, type: 'png' });
    console.log(`[FIX] ✔ Screenshot salva em ${outPath}`);

    await browser.close();
}

main();
