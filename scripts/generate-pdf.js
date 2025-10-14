const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const root = process.cwd();
    const htmlPath = path.join(root, 'manual.html');
    const outPath = path.join(root, 'Manual_Actualizacion_Fotos_Nelson.pdf');
    if (!fs.existsSync(htmlPath)) {
      console.error('No se encontró manual.html en el directorio del proyecto.');
      process.exit(1);
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '16mm', bottom: '20mm', left: '16mm' }
    });
    await browser.close();
    console.log('PDF generado en:', outPath);
  } catch (err) {
    console.error('Error generando PDF:', err);
    process.exit(2);
  }
})();