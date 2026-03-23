import { chromium } from 'playwright';

async function capture(url, name) {
  const browser = await chromium.launch({ headless: true }); 
  const context = await browser.newContext({ 
      viewport: { width: 1440, height: 900 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  // Evade proteções básicas
  await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    console.log(`[SKILL: CRO] URL acessada: ${url}`);
    
    const nukePopups = async () => {
        try {
            for (const frame of page.frames()) {
                const b = frame.locator('button:has-text("Aceitar"), button:has-text("Concordar"), a:has-text("Aceitar")').first();
                if (await b.count() > 0 && await b.isVisible()) await b.click({timeout: 500}).catch(()=>{});
            }
        } catch(e) {}
        
        await page.evaluate(() => {
            // Assassinato Serial Expandido para Assistentes Virtuais, Chatbots e Cookies
            const killTags = [
                '[id*="cookie"]', '[class*="cookie"]', '[id*="adopt"]', 
                'iframe[src*="chat"]', 'iframe[src*="whatsapp"]', 'iframe[src*="jivo"]', 'iframe[src*="tawk"]',
                '.whatsapp-button', '[class*="whatsapp"]', '[id*="whatsapp"]', 
                '#blip-chat-container', '#take-chat-window', '#rd-station-chatbot', '.intercom-lightweight-app', '#launcher'
            ];
            document.querySelectorAll(killTags.join(',')).forEach(e => e.style.setProperty('display', 'none', 'important'));
            
            // Derruba Iframes fixeds (são 99% das vezes chatbots ou popups de captacao persistentes)
            document.querySelectorAll('iframe').forEach(ifr => {
                if (window.getComputedStyle(ifr).position === 'fixed') ifr.style.setProperty('display', 'none', 'important');
            });
            
            // Oculta modais ou overlays visuais invasivos detectados pela palavra chave
            document.querySelectorAll('*').forEach(e => {
               const style = window.getComputedStyle(e);
               if (style.position === 'fixed' && style.zIndex > 50) {
                   const txt = e.innerText.toLowerCase();
                   if (txt.includes('lgpd') || txt.includes('cookie') || txt.includes('privacidade') || txt.includes('chat') || txt.includes('ajuda')) {
                       e.style.setProperty('display', 'none', 'important');
                   }
               }
            });
        });
    };

    await nukePopups();
    await page.waitForTimeout(500);

    // Foca na DOM central
    await page.mouse.click(720, 450);

    // 1. SCROLL ORGÂNICO ANTES DE QUEBRAR O LAYOUT! Força as imagens e conteudos Lazy da Rede Vistorias a baixar
    console.log(`[SKILL: CRO] Rolando a tela para despertar o conteúdo oculto...`);
    for (let i = 0; i < 20; i++) {
        await nukePopups();
        // PageDown avança exatamente uma janela
        await page.keyboard.press('PageDown');
        // Rola no mouse wheel nativo como garantia secundária de ativação
        await page.mouse.wheel(0, 800);
        await page.waitForTimeout(600);
    }
    
    // Volta pro topo
    await page.keyboard.press('Home');
    await page.waitForTimeout(1000);

    // 2. QUEBRA AS GAIOLAS E LIBERTA O SCROLL GLOBAL
    console.log(`[SKILL: CRO] Injetando a Vachina anti-Scroll Lock para esticar o Body...`);
    await page.evaluate(() => {
        let max = 0;
        let el = document.body;
        // Encontra a Tag exata que amarrou o site em 100vh
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
        
        // Remove Cadeados da gaiola interceptada
        if (el && el !== document.body && el !== document.documentElement) {
            el.setAttribute('data-liberado', 'true');
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('height', 'auto', 'important');
            el.style.setProperty('max-height', 'none', 'important');
            el.style.setProperty('position', 'static', 'important');
        }

        window.scrollTo(0, 0);
        // Derruba paineis fixos para eles nao serem clonados em 15 camadas pela câmera do Playwright
        const elements = document.querySelectorAll('*');
        elements.forEach(c => {
            const comp = window.getComputedStyle(c);
            if (comp.position === 'fixed' || comp.position === 'sticky') {
                c.style.setProperty('position', 'absolute', 'important');
            }
        });
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
