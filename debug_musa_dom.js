const { chromium } = require('playwright');

(async () => {
    console.log('[DEBUG] Extraindo DOM da Musa...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    await page.goto('https://musa.co/', { waitUntil: 'domcontentloaded' });
    
    // Obter todos os nós com altura suspeitosamente alta (> 1500px)
    const giantDivs = await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div, section'));
        return els
            .filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.height > 1500 && el.innerText.trim().length < 50; 
            })
            .map(el => ({
                tag: el.tagName,
                className: el.className,
                id: el.id,
                height: el.getBoundingClientRect().height,
                html: el.outerHTML.substring(0, 100)
            }));
    });

    console.log('Resultados Suspeitos:');
    console.log(JSON.stringify( giantDivs, null, 2));

    await browser.close();
})();
