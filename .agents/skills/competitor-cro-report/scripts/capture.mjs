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

// Retirado bloco solto anterior...

    // 3. Batida de Fotos e Avanço da Roda do Mouse
    console.log(`[SKILL: CRO] Iniciando Motor Fotográfico Físico (Mouse Wheel)...`);
    const chunks = [];
    const scrollAmount = 900;
    
    for (let i = 0; i < 11; i++) {
        // Scanner Geométrico: Identifica clones de Header JS e Chatbots vivos a cada frame
        await page.evaluate((isFrameZero) => {
            document.querySelectorAll('*').forEach(e => {
                const comp = window.getComputedStyle(e);
                
                if (comp.position === 'fixed' || comp.position === 'sticky') {
                    const rect = e.getBoundingClientRect();
                    
                    // 1. Assinatura de Headers Dinâmicos (Muito largos, topo da tela, finos)
                    // Se passar do frame zero, destruímos o clone para ele não engarrafar a leitura
                    if (rect.width > 600 && rect.height < 350) {
                        if (!isFrameZero) {
                            e.style.setProperty('display', 'none', 'important');
                            e.style.setProperty('opacity', '0', 'important');
                        }
                    }
                    
                    // 2. Assinatura de Chatbots, Agentes de Vendas e WhatsApp (Pequenos cantos)
                    // Destruídos em 100% dos frames impiedosamente se estiverem em fixed
                    if (rect.width < 500 && rect.height < 500) {
                        e.style.setProperty('display', 'none', 'important');
                        e.style.setProperty('opacity', '0', 'important');
                    }
                }
                
                // Extra: Algumas ferramentas como o blip injetam div master absolute
                if (comp.position === 'absolute') {
                    const rect = e.getBoundingClientRect();
                    if (rect.top > 300 && rect.width < 450 && rect.height < 450 && parseInt(comp.zIndex) > 50) {
                        e.style.setProperty('display', 'none', 'important');
                    }
                }
            });
        }, i === 0);

        // Retira tempo para dar chance da tag desaparecer visualmente
        await page.waitForTimeout(300);
        
        const buf = await page.screenshot({ type: 'png' });
        chunks.push(buf.toString('base64'));
        
        // Gira roda do mouse brutalmente
        await page.mouse.wheel(0, scrollAmount);
        
        // Espera a inércia do Virtual Scroll descer a página fisicamente
        await page.waitForTimeout(1000);
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
