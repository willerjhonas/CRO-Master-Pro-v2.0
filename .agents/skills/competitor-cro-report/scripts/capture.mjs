import { chromium } from 'playwright';
import fs from 'fs';

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
    console.log(`[SKILL: CRO] URL acessada (Canvas Automato): ${url}`);
    
    const nukePopups = async () => {
        try {
            for (const frame of page.frames()) {
                const b = frame.locator('button:has-text("Aceitar"), button:has-text("Concordar"), a:has-text("Aceitar")').first();
                if (await b.count() > 0 && await b.isVisible()) await b.click({timeout: 500}).catch(()=>{});
            }
        } catch(e) {}
        
        await page.evaluate(() => {
            // Eliminação Espacial: Assassina qualquer elemento fixo pequeno no canto da tela (A cova de todos os Chatbots teimosos)
            document.querySelectorAll('*').forEach(e => {
                const c = window.getComputedStyle(e);
                if (c.position === 'fixed' || c.position === 'absolute') {
                    const rect = e.getBoundingClientRect();
                    // Se estiver abaixo do cabecalho (y > 300) e pequeno (< 500px), é certeza absoluta que é um widget de IA/Chat/Captacao
                    // Matamos sem depender de classes ou IDs. Tiro no peito.
                    if (rect.top > 300 && rect.width < 500 && rect.height < 500) {
                        e.style.setProperty('display', 'none', 'important');
                    }
                }
            });
            // Oculta modais overlay
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

    // 1. Desce até o final real simulando a rodinha do mouse até esgotar a página
    console.log(`[SKILL: CRO] Disparando engrenagem virtual para forçar Lazy Load no GSAP/Lenis...`);
    for (let i = 0; i < 15; i++) {
        await nukePopups();
        // Emulador exato da roda do mouse -> Engana perfeitamente o Virtual Scroll da Rede Vistorias
        await page.mouse.wheel(0, 900);
        await page.waitForTimeout(300);
    }
    
    // Volta pro topo usando a tecla HOME
    console.log(`[SKILL: CRO] Retornando ao topo... Aguardando a animação de inércia do site apaziguar...`);
    await page.keyboard.press('Home');
    await page.waitForTimeout(3500); // 3.5 segundos cruciais para a animação do smooth scroll voltar fisicamente ao Y=0 !

    // Congele os cabecalhos!
    console.log(`[SKILL: CRO] Soldando as barras de Header no teto...`);
    await page.evaluate(() => {
        document.querySelectorAll('header, .elementor-location-header, [data-elementor-type="header"], .fixed-header, nav').forEach(h => {
             const comp = window.getComputedStyle(h);
             if (comp.position === 'fixed' || comp.position === 'sticky') {
                 h.style.setProperty('position', 'absolute', 'important');
                 h.style.setProperty('top', '0px', 'important');
             }
        });
    });

    // 3. Batida de Fotos e Avanço da Roda do Mouse
    console.log(`[SKILL: CRO] Iniciando Motor Fotográfico Físico (Mouse Wheel)...`);
    const chunks = [];
    const scrollAmount = 900;
    
    for (let i = 0; i < 11; i++) {
        await nukePopups(); // Assassino de iframes ativo em tempo real
        
        const buf = await page.screenshot({ type: 'png' });
        chunks.push(buf.toString('base64'));
        
        // Literalmente gira a rodinha do mouse fisicamente em 900 unidades
        await page.mouse.wheel(0, scrollAmount);
        
        // Espera a inércia suave do Virtual Scroll assentar o chassis da pagina
        await page.waitForTimeout(1200);
    }
    
    // 4. Costura
    console.log(`[SKILL: CRO] Revelando matriz de fotos...`);
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
    
    const base64Data = finalDataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(name, Buffer.from(base64Data, 'base64'));

    console.log(`[SKILL: CRO] Panorama perfeito exportado: ${name}`);

  } catch(e) {
    console.log(`[SKILL: CRO] Erro ao capturar ${name}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
if (args.length >= 2) capture(args[0], args[1]);
else console.log("Uso: node capture.mjs <URL> <NOME.png>");
