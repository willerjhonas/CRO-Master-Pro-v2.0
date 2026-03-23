import { chromium } from 'playwright';
(async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto('https://inspectvistorias.com.br/', { waitUntil: 'load' });
    await p.waitForTimeout(3000);
    
    // Antídoto supremo
    await p.evaluate(() => {
        let max = 0;
        let el = document.body;
        document.querySelectorAll('*').forEach(e => {
            if (e.scrollHeight > max && e.scrollHeight > e.clientHeight) {
                max = e.scrollHeight;
                el = e;
            }
        });
        
        // Destrava TUDO que estiver restringindo a altura
        const style = document.createElement('style');
        style.innerHTML = `
            html, body {
                height: auto !important;
                min-height: 100vh !important;
                overflow: visible !important;
                position: static !important;
            }
        `;
        document.head.appendChild(style);
        
        // Destrava o container exato
        el.style.setProperty('overflow', 'visible', 'important');
        el.style.setProperty('height', 'auto', 'important');
        el.style.setProperty('max-height', 'none', 'important');
        el.style.setProperty('position', 'static', 'important');
    });

    await p.waitForTimeout(2000);
    
    // Tira print FullPage de verdade
    await p.screenshot({ path: 'test_inspect_full.png', fullPage: true });
    console.log("Teste de expansao concluido. Verifique test_inspect_full.png");
    await b.close();
})();
