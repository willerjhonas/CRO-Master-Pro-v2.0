import { chromium } from 'playwright';

async function capture(url, name) {
  const browser = await chromium.launch({ headless: true }); 
  const context = await browser.newContext({ 
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    console.log(`[SKILL: CRO] URL acessada (Microcirurgia): ${url}`);
    
    const nukePopups = async () => {
        try {
            for (const frame of page.frames()) {
                const b = frame.locator('button:has-text("Aceitar"), button:has-text("Concordar"), a:has-text("Aceitar")').first();
                if (await b.count() > 0 && await b.isVisible()) await b.click({timeout: 500}).catch(()=>{});
            }
        } catch(e) {}
        
        await page.evaluate(() => {
            const killTags = [
                '[id*="cookie"]', '[class*="cookie"]', '[id*="adopt"]', 
                'iframe[src*="chat"]', 'iframe[src*="whatsapp"]', 'iframe[src*="jivo"]', 'iframe[src*="tawk"]', '.whatsapp-button', '[class*="whatsapp"]', '[id*="whatsapp"]', 
                '#blip-chat-container', '#take-chat-window', '#rd-station-chatbot', '.intercom-lightweight-app', '#launcher'
            ];
            document.querySelectorAll(killTags.join(',')).forEach(e => e.style.setProperty('display', 'none', 'important'));
        });
    };

    await nukePopups();
    await page.waitForTimeout(1000);
    await page.mouse.click(720, 450);

    console.log(`[SKILL: CRO] Pressionando scroll mecânico para ativação real...`);
    for (let i = 0; i < 20; i++) {
        await nukePopups();
        // Emulador nativo de rolagem física que a rede vistorias reconhece
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(500);
    }
    
    await page.keyboard.press('Home');
    await page.mouse.wheel(0, -9000); 
    await page.waitForTimeout(1000);

    console.log(`[SKILL: CRO] Destrancando as correntes do Astra e do Body...`);
    await page.evaluate(() => {
        // Extermínio micro-direcionado de Máscaras (Overflow Masks) nas div mestre
        const style = document.createElement('style');
        style.innerHTML = `
            html, body, .site-content, .ast-container, #page {
                height: auto !important;
                min-height: 100vh !important;
                overflow: visible !important;
                position: static !important;
                max-height: none !important;
            }
            .lazy, .elementor-invisible, [data-aos] {
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
            }
            header, footer, .elementor-location-header {
                position: absolute !important;
            }
        `;
        document.head.appendChild(style);
        window.scrollTo(0, 0);
    });

    await page.waitForTimeout(3000); 

    await page.screenshot({ path: name, fullPage: true });
    console.log(`[SKILL: CRO] Artefato finalizado do header ao footer com sucesso: ${name}`);

  } catch(e) {
    console.log(`[SKILL: CRO] Erro ao capturar ${name}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) capture(args[0], args[1]);
else console.log("Uso: node capture.mjs <URL> <NOME.png>");
