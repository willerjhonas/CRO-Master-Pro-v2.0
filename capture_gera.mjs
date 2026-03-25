import { chromium } from 'playwright';
import path from 'path';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    console.log('Capturando Gera (https://geraapp.com/)...');
    await page.goto('https://geraapp.com/', { waitUntil: 'networkidle' });
    
    // Pequeno delay para animações
    await page.waitForTimeout(2000);
    
    const outPath = path.join(process.cwd(), 'screenshots', 'gera.png');
    await page.screenshot({ path: outPath, fullPage: true });
    
    console.log('✔ Sucesso: gera.png');
    await browser.close();
}

main();
