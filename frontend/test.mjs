import { chromium } from 'playwright';

(async () => {
    console.log("Launching browser...");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_ERROR:', err));

    console.log("Navigating to http://127.0.0.1:5173 ...");
    await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });

    const content = await page.content();
    console.log("Root content:", await page.evaluate(() => document.getElementById('root')?.innerHTML));

    await browser.close();
})();
