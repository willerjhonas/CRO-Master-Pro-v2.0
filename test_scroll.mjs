import { chromium } from 'playwright';
(async () => {
    const b = await chromium.launch();
    const p = await b.newPage();
    await p.goto('https://redevistorias.com.br/', { waitUntil: 'load' });
    await p.waitForTimeout(3000);
    const data = await p.evaluate(() => {
        let max = 0;
        let el = document.body;
        document.querySelectorAll('*').forEach(e => {
            if (e.scrollHeight > max && e.scrollHeight > e.clientHeight) {
                max = e.scrollHeight;
                el = e;
            }
        });
        return {
            tag: el.tagName,
            id: el.id,
            className: el.className,
            scrollHeight: max,
            bodyScroll: document.body.scrollHeight,
            htmlScroll: document.documentElement.scrollHeight
        };
    });
    console.log(JSON.stringify(data, null, 2));
    await b.close();
})();
