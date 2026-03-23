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
            // Oculta modais ou overlays visuais invasivos no inicio
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
    await page.waitForTimeout(500);

    // Damos um clique no centro da página para focar a DIV principal com restrição de tela
    await page.mouse.click(720, 450);

    // 1. SCROLL ORGÂNICO! Deixa o layout intacto e rola pra baixo forçando as "iscas" de Lazy Load no sistema da Inspect
    console.log(`[SKILL: CRO] Rolando a tela para despertar o lazy load...`);
    for (let i = 0; i < 20; i++) {
        await nukePopups();
        // PageDown avança exatamente uma janela do contêiner mais proeminente focado
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(600);
    }
    
    // Volta rapidamente ao topo sem destrancar layout ainda, pra carregar coisas de hero perdidas
    await page.keyboard.press('Home');
    await page.waitForTimeout(1000);

    // 2. A MÁGICA: Agora que todas as imagens estão renderizadas na memória RAM da gaiola "card-termo-wrapper", nós explodimos a gaiola
    console.log(`[SKILL: CRO] Injetando a Vachina anti-Scroll Lock para esticar o Body...`);
    await page.evaluate(() => {
        let max = 0;
        let el = document.body;
        // Encontra o contêiner virtual mestre que manteve os itens escondidos
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
        
        // Destrava estourando a gaiola detectada para os lados/baixo via reflow
        if (el && el !== document.body && el !== document.documentElement) {
            el.setAttribute('data-liberado', 'true');
            el.style.setProperty('overflow', 'visible', 'important');
            el.style.setProperty('height', 'auto', 'important');
            el.style.setProperty('max-height', 'none', 'important');
            el.style.setProperty('position', 'static', 'important');
        }

        window.scrollTo(0, 0);
        // Desaba posições Fixas de rodapés e headers para não se duplicarem por baixo da imagem inteira
        const elements = document.querySelectorAll('*');
        elements.forEach(c => {
            const comp = window.getComputedStyle(c);
            if (comp.position === 'fixed' || comp.position === 'sticky') {
                c.style.setProperty('position', 'absolute', 'important');
            }
        });
    });

    await page.waitForTimeout(3000); // Aguarda tranquilamente o Chrome redesenhar o monstro inteiro

    // Tira print total oficial (Como destruímos a altura dos contêineres, o Body é do tamanho do Universo agora)
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
