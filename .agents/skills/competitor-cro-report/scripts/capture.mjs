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
    console.log(`[SKILL: CRO] URL acessada (Canvas Stitcher): ${url}`);
    
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

    // 1. Primeiramente forçamos o Lazy Load para carregar tudo (O site VAI descer pro fundo)
    console.log(`[SKILL: CRO] Rolando a tela até o submundo para despertar imagens...`);
    for (let i = 0; i < 15; i++) {
        await nukePopups();
        // Emulador nativo de rolagem física que a rede vistorias reconhece
        await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'instant' }));
        // E injeta o pagedown pra frameworks que ignoram window
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(300);
    }
    
    // Volta pro topo brutalmente
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press('Home');
    await page.waitForTimeout(1000);

    // 2. Prepara a página para as fotos estáticas sequenciais (Congela headers)
    console.log(`[SKILL: CRO] Congelando Headers Flutuantes no topo da página...`);
    await page.evaluate(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            html, body { scroll-behavior: auto !important; }
            ::-webkit-scrollbar { display: none; }
        `;
        document.head.appendChild(style);
        
        // Solda qualquer header teimoso no topo para que ele não se clone nas 10 fotos
        document.querySelectorAll('header, .elementor-location-header, [data-elementor-type="header"], .fixed-header, nav').forEach(h => {
             const comp = window.getComputedStyle(h);
             if (comp.position === 'fixed' || comp.position === 'sticky') {
                 h.style.setProperty('position', 'absolute', 'important');
                 h.style.setProperty('top', '0px', 'important');
             }
        });
        document.querySelectorAll('*').forEach(e => {
            if (window.getComputedStyle(e).position === 'fixed') {
                e.style.setProperty('position', 'absolute', 'important');
            }
        });
    });

    // 3. Batida de Fotos e Avanço Geométrico
    console.log(`[SKILL: CRO] Iniciando Motor Canvas Stitcher (Tirando multiplas fotos sequenciais)...`);
    const chunks = [];
    const scrollAmount = 900;
    
    for (let i = 0; i < 9; i++) {
        // Tira uma chapa rápida apenas do viewport visível (headless mode base)
        const buf = await page.screenshot({ type: 'png' });
        chunks.push(buf.toString('base64'));
        
        // Desce exatamente a altura da nossa câmera na janela e nos scrolls internos
        await page.evaluate((y) => {
            window.scrollBy(0, y);
            // Empurra a scrollbar do Elementor se houver
            let max = 0; let scroller = document.body;
            document.querySelectorAll('*').forEach(e => {
                if (e.scrollHeight > max && e.scrollHeight > e.clientHeight) {
                    max = e.scrollHeight; scroller = e;
                }
            });
            if(scroller !== document.body) scroller.scrollBy(0, y);
        }, scrollAmount);
        
        await page.waitForTimeout(400);
    }
    
    // 4. Cola tudo perfeitamente via Canvas e exporta o Gigapixel final
    console.log(`[SKILL: CRO] Costurando fragmentos em Mega-Canvas...`);
    const finalDataUrl = await page.evaluate(async (b64Array) => {
        return new Promise((resolve) => {
            const H = 900;
            const canvas = document.createElement('canvas');
            canvas.width = 1440;
            canvas.height = H * b64Array.length;
            const ctx = canvas.getContext('2d');
            
            let loaded = 0;
            for (let i = 0; i < b64Array.length; i++) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, i * H);
                    loaded++;
                    if (loaded === b64Array.length) {
                        resolve(canvas.toDataURL('image/png'));
                    }
                };
                img.src = 'data:image/png;base64,' + b64Array[i];
            }
        });
    }, chunks);
    
    // Salva o base64 brutal no arquivo de destino
    const fs = require('fs');
    const base64Data = finalDataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(name, Buffer.from(base64Data, 'base64'));

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
