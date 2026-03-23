import { chromium } from 'playwright';

async function capture(url, name) {
  const browser = await chromium.launch({ headless: true }); 
  const context = await browser.newContext({ 
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    console.log(`[SKILL: CRO] URL acessada: ${url}`);
    
    // Aniquila os modais de cookies no arranque
    const nukePopups = async () => {
        try {
            for (const frame of page.frames()) {
                const acceptBtn = frame.locator('button:has-text("Aceitar"), button:has-text("Concordar"), button:has-text("Entendi"), a:has-text("Aceitar")').first();
                if (await acceptBtn.count() > 0 && await acceptBtn.isVisible()) {
                    await acceptBtn.click({ force: true, timeout: 500 }).catch(()=>{});
                }
            }
        } catch(e) {}
        
        await page.evaluate(() => {
            const killTags = ['[id*="cookie"]', '[class*="cookie"]', '[id*="adopt"]', '[id*="consent"]', 'iframe[src*="chat"]', 'iframe[src*="whatsapp"]', '.whatsapp-button'];
            document.querySelectorAll(killTags.join(',')).forEach(e => {
                e.style.setProperty('display', 'none', 'important');
            });
            document.querySelectorAll('iframe').forEach(ifr => {
                const style = window.getComputedStyle(ifr);
                if ((style.position === 'fixed' || style.position === 'absolute') && parseInt(style.zIndex||0) > 50) {
                    ifr.style.setProperty('display', 'none', 'important');
                }
            });
        });
    };

    await nukePopups();
    await page.waitForTimeout(1000);
    
    // Garante que o body possa focar para receber as teclas
    await page.mouse.click(720, 450);
    
    // Simula rolagens humanas (PageDown) para engatilhar as "dores" dos Lazy Loads onde quer que o scroll container esteja
    for (let i = 0; i < 20; i++) {
        await nukePopups();
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(400); 
    }
    
    // Volta rapidamente pro inicio para garantir layout correto
    await page.keyboard.press('Home');
    await page.waitForTimeout(2000);

    // CSS Supremo à Prova de Colapsos (React)
    // Força tudo a mostrar seu overflow de forma segura (height auto + min-height 100% impede colapso de divisões virtuais)
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
            html, body, #root, #__next, .wrapper, .elementor {
                height: auto !important;
                min-height: 100vh !important;
                max-height: none !important;
                overflow: visible !important;
            }
            /* Conserta sobreposições de menu fixed no meio da página */
            * {
               position: static !important;
            }
            [data-aos], .elementor-invisible, .fade-in, .lazy {
                opacity: 1 !important;
                transform: none !important;
                visibility: visible !important;
            }
        `;
        document.head.appendChild(style);
        
        // Remove 'position: fixed' de TUDO no layout para não repetir blocos fantasma na costura
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.position === 'fixed' || computedStyle.position === 'sticky') {
                el.style.setProperty('position', 'absolute', 'important');
            }
            if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
                el.style.setProperty('overflow', 'visible', 'important');
            }
        });
        window.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(2000);

    // Identifica o contêiner raiz real e tira o print dele (salvaguarda caso o CSS acima falhe em transbordar pro BODY)
    const targetSelector = await page.evaluate(() => {
        let maxScroll = 0;
        let mainContainer = document.body;
        document.querySelectorAll('body, html, div, main, section').forEach(el => {
            if (el.scrollHeight > maxScroll) {
                maxScroll = el.scrollHeight;
                mainContainer = el;
            }
        });
        mainContainer.setAttribute('data-cro-target', 'true');
        return '[data-cro-target="true"]';
    });

    try {
        await page.locator(targetSelector).screenshot({ path: name });
        console.log(`[SKILL: CRO] Artefato salvo via Locator: ${name}`);
    } catch(e) {
        // Fallback pro fullPage classico
        await page.screenshot({ path: name, fullPage: true });
        console.log(`[SKILL: CRO] Artefato salvo via FullPage: ${name}`);
    }
  } catch(e) {
    console.log(`[SKILL: CRO] Erro ao capturar ${name}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) {
    capture(args[0], args[1]);
} else {
    console.log("Uso: node capture.mjs <URL> <NOME_DO_ARQUIVO.png>");
}
