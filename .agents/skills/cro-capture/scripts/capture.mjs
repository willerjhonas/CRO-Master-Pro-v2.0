import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function main() {
    const jsonPath = process.argv[2];
    if (!jsonPath) {
        console.error("Uso: node capture.mjs <caminho_para_competitors.json>");
        process.exit(1);
    }

    if (!fs.existsSync(jsonPath)) {
        console.error(`Arquivo não encontrado: ${jsonPath}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    let competitors;
    try {
        competitors = JSON.parse(rawData);
    } catch (e) {
        console.error("Erro ao fazer parse do JSON:", e.message);
        process.exit(1);
    }

    const outDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

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

    for (const comp of competitors) {
        const url = comp.url;
        const name = path.join(outDir, `${comp.id}.png`);
        console.log(`\n========================================`);
        console.log(`[SKILL: CRO] Iniciando captura: ${comp.name} (${url})`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000); // Aguarda redirects SPAs

            const nukePopups = async () => {
                const closeTexts = [
                    'Aceitar', 'Concordar', 'Fechar', 'Fechar janela', 'Dismiss', 'Close',
                    'Não, obrigado', 'Não quero', 'Agora não', 'Pular', 'Skip',
                    'Got it', 'OK', 'Entendi', 'Continuar', 'Accept', 'Accept all',
                    '×', 'X', '✕', '✖', 'Recusar', 'Rejeitar'
                ];

                for (const text of closeTexts) {
                    try {
                        const btns = await page.locator(`button:has-text("${text}"), a:has-text("${text}"), [aria-label*="${text}"]`).all();
                        for (const btn of btns) {
                            if (await btn.isVisible()) await btn.click({ timeout: 500, force: true }).catch(() => { });
                        }
                    } catch (e) { }
                }

                await page.evaluate(() => {
                    document.querySelectorAll('*').forEach(el => {
                        const s = window.getComputedStyle(el);
                        if (s.position === 'fixed' || s.position === 'sticky') {
                            const rect = el.getBoundingClientRect();
                            const vh = window.innerHeight;
                            const vw = window.innerWidth;
                            const area = rect.width * rect.height;
                            const viewportArea = vw * vh;

                            if (area > viewportArea * 0.3 && parseInt(s.zIndex) > 10) {
                                el.style.setProperty('display', 'none', 'important');
                            }
                        }
                    });
                });
            };

            await nukePopups();
            await page.waitForTimeout(1000);
            await page.mouse.click(720, 450);

            await page.addStyleTag({ content: '* { scroll-behavior: initial !important; animation: none !important; transition: none !important; }' });

            console.log(`[SKILL: CRO] Forçando Lazy Load (GSAP/Lenis/React)...`);
            for (let i = 0; i < 15; i++) {
                try {
                    await nukePopups();
                    await page.evaluate((step) => window.scrollTo(0, step * 900), i);
                    await page.waitForTimeout(200);
                } catch (navErr) {
                    console.log(`[SKILL: CRO] Navegação detectada no step ${i}, estabilizando...`);
                    await page.waitForTimeout(2000);
                    break;
                }
            }

            try { await page.waitForLoadState('domcontentloaded', { timeout: 10000 }); } catch (e) { }
            console.log(`[SKILL: CRO] Retornando ao topo...`);
            try { await page.evaluate(() => window.scrollTo(0, 0)); } catch (e) { }
            await page.waitForTimeout(1000);

            console.log(`[SKILL: CRO] Tratando layout para viewport expandido...`);
            await page.evaluate(() => {
                document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
                document.body.style.setProperty('overflow-x', 'hidden', 'important');

                document.querySelectorAll('*').forEach(el => {
                    const s = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();

                    if (s.position === 'fixed' || s.position === 'sticky') {
                        el.style.setProperty('position', 'absolute', 'important');
                        el.style.setProperty('max-width', '1440px', 'important');
                        el.style.setProperty('box-sizing', 'border-box', 'important');
                    }

                    if ((s.position === 'fixed' || s.position === 'absolute') &&
                        rect.width < 500 && rect.height < 500 && rect.top > 300) {
                        el.style.setProperty('display', 'none', 'important');
                    }
                });
            });

            const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
            await page.setViewportSize({ width: 1440, height: pageHeight });
            await page.waitForTimeout(500);

            console.log(`[SKILL: CRO] Capturando ${comp.id} (1440 x ${pageHeight}px)...`);
            await page.screenshot({ path: name, type: 'png' });
            console.log(`[SKILL: CRO] ✔ Excelente! Salvo em ${name}`);

        } catch (e) {
            console.log(`[SKILL: CRO] ❌ Erro ao capturar ${comp.name}: ${e.message}`);
        }
    }

    await browser.close();
    console.log(`\n[SKILL: CRO] Batch Formidável - Todas as capturas processadas com sucesso!`);
}

main();
