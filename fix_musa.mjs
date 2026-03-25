import { chromium } from 'playwright';

const url = 'https://musa.co/';
const outPath = '/home/thiago/Finzar/will_agent/An-lise-competitiva/screenshots/musa.png';

async function main() {
    console.log(`[FIX MUSA V3] Iniciando navegador com scroll hibrid-orgânico...`);
    const browser = await chromium.launch({ headless: true });
    
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();
    
    // NENHUMA INJEÇÃO CSS DESTRUTIVA que altere Transform ou Animation inicial!
    // Queremos a página original operando seu código nativamente

    console.log(`[FIX MUSA V3] Navegando...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Deixar o site carregar recursos hero (Canvas, Video, Lottie) antes do scroll inicial
    console.log(`[FIX MUSA V3] Aguardando 5s para o Hero carregar...`);
    await page.waitForTimeout(5000);

    // Scroll progressivo contínuo simulador de mouse humano e trigger orgânico do GSAP    
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const scrollStep = 100; // Micro-scroll de 100px garante hit no IntersectionObserver / ScrollMagic
    
    console.log(`[FIX MUSA V3] Iniciando scroll down milimétrico (altura total: ~${scrollHeight}px)...`);
    
    for (let currentY = 0; currentY < scrollHeight; currentY += scrollStep) {
        await page.mouse.wheel(0, scrollStep); // Enviar o evento wheel nativo do Chromium (engaja Lenis perfeito)
        await page.waitForTimeout(100);        // Tempo ultra-suficiente para as engines de física
    }
    
    console.log(`[FIX MUSA V3] Scroll finalizado. Aguardando 2s extras...`);
    await page.waitForTimeout(2000);

    // Algumas proteções finais brandas: apenas remover `overflow` preso e position fixed de overlay cookies.
    await page.evaluate(() => {
        document.documentElement.style.setProperty('overflow', 'visible', 'important');
        document.body.style.setProperty('overflow', 'visible', 'important');
    });

    // Subir a página toda de uma vez para tirar o snap.
    console.log(`[FIX MUSA V3] Voltando pro topo e dimensionando viewport...`);
    
    // Ao voltar para o topo rápido, se o site usa scroll bidirecional, pode esconder coisas.
    // Vamos setar a altura da viewport imediatamente.
    const finalHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    
    await page.setViewportSize({ width: 1440, height: finalHeight });
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Refined DOM cleanup for Musa's Webflow/GSAP layout
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            /* Hide the large fillers created by ScrollTrigger */
            .pin-spacer { 
                height: 0 !important; 
                padding: 0 !important; 
                margin: 0 !important; 
                display: none !important; 
            }
            
            /* Ensure all sections are visible and not transformed/opacity:0 */
            section, div, img, p, h1, h2, h3, h4, span, a {
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
                transition: none !important;
            }

            /* Fix sticky header so it doesn't repeat or block content */
            .w-nav, [style*="position: fixed"], [style*="position: sticky"] {
                position: relative !important;
                top: auto !important;
            }

            /* Unblock overflow */
            html, body {
                overflow: visible !important;
                height: auto !important;
            }

            /* Ensure swiper slides are all shown (not just the active one) */
            .swiper-slide {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
            }
        `;
        document.head.appendChild(style);
    });

    console.log(`[FIX MUSA V4] Capturing Imagem Final!`);
    await page.screenshot({ path: outPath, type: 'png', fullPage: true });
    
    console.log(`[FIX MUSA V4] ✔ Sucesso!`);
    await browser.close();
}

main();
