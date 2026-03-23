import { chromium } from 'playwright';

async function capture(url, name) {
  const browser = await chromium.launch({ headless: true }); 
  const context = await browser.newContext({ 
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  // Injeta Stealth scripts para burlar WAF e Bloqueadores de Bot Headless do Elementor/Astra
  await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      window.navigator.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
  });

  const page = await context.newPage();
  
  try {
    // networkidle força o navegador a aguardar a rede parar, vital para sites dinâmicos do WP que bloqueavam a leitura
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    console.log(`[SKILL: CRO] URL acessada (Stealth): ${url}`);
    
    const nukePopups = async () => {
        try {
            for (const frame of page.frames()) {
                const b = frame.locator('button:has-text("Aceitar"), button:has-text("Concordar"), a:has-text("Aceitar")').first();
                if (await b.count() > 0 && await b.isVisible()) await b.click({timeout: 500}).catch(()=>{});
            }
        } catch(e) {}
        
        await page.evaluate(() => {
            const killTags = ['[id*="cookie"]', '[class*="cookie"]', '[id*="adopt"]', 'iframe[src*="chat"]', 'iframe[src*="whatsapp"]', '.whatsapp-button'];
            document.querySelectorAll(killTags.join(',')).forEach(e => e.style.setProperty('display', 'none', 'important'));
            document.querySelectorAll('iframe').forEach(ifr => {
                if (window.getComputedStyle(ifr).position === 'fixed') ifr.style.setProperty('display', 'none', 'important');
            });
            document.querySelectorAll('*').forEach(e => {
               const style = window.getComputedStyle(e);
               if (style.position === 'fixed' && style.zIndex > 50) {
                   const txt = e.innerText.toLowerCase();
                   if (txt.includes('lgpd') || txt.includes('cookie') || txt.includes('privacidade')) {
                       e.style.setProperty('display', 'none', 'important');
                   }
               }
            });
        });
    };

    await nukePopups();
    await page.waitForTimeout(1000);

    await page.mouse.click(720, 450);

    console.log(`[SKILL: CRO] Simulando scroll fisico para ativar lazy loaders...`);
    for (let i = 0; i < 20; i++) {
        await nukePopups();
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(600);
    }
    
    await page.keyboard.press('Home');
    await page.waitForTimeout(1500);

    console.log(`[SKILL: CRO] Injetando a vacina de transbordamento (Overflow Break)...`);
    await page.evaluate(() => {
        let max = 0;
        let el = document.body;
        // Identifica e desativa a gaiola do Astra/Elementor (`card-termo-wrapper`, `site-content`, etc)
        document.querySelectorAll('*').forEach(e => {
            if (e.scrollHeight > max && e.scrollHeight > e.clientHeight) {
                max = e.scrollHeight;
                el = e;
            }
        });
        
        const style = document.createElement('style');
        style.innerHTML = `
            html, body {
                height: auto !important;
                min-height: 100vh !important;
                overflow: visible !important;
                position: static !important;
                scroll-behavior: auto !important;
                animation: none !important;
                transition: none !important;
            }
            [data-aos], .lazy, .elementor-invisible {
                opacity: 1 !important;
                transform: none !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(style);
        
        if (el && el !== document.body && el !== document.documentElement) {
            el.setAttribute('data-liberado', 'true');
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('height', 'auto', 'important');
            el.style.setProperty('max-height', 'none', 'important');
            el.style.setProperty('position', 'static', 'important');
        }

        window.scrollTo(0, 0);
        const elements = document.querySelectorAll('*');
        elements.forEach(c => {
            const comp = window.getComputedStyle(c);
            if (comp.position === 'fixed' || comp.position === 'sticky') {
                c.style.setProperty('position', 'absolute', 'important');
            }
            // Uma barreira a mais para temas WordPress modernos que travam o wrapper #page
            if (c.id === 'page' || c.className.includes('ast-container')) {
                c.style.setProperty('overflow', 'visible', 'important');
                c.style.setProperty('height', 'auto', 'important');
            }
        });
    });

    await page.waitForTimeout(3000); 

    await page.screenshot({ path: name, fullPage: true });
    console.log(`[SKILL: CRO] Artefato salvaguardado: ${name}`);

  } catch(e) {
    console.log(`[SKILL: CRO] Erro ao capturar ${name}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) capture(args[0], args[1]);
else console.log("Uso: node capture.mjs <URL> <NOME.png>");
