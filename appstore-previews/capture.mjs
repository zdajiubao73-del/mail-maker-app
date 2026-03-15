/**
 * App Store プレビュー画像キャプチャスクリプト
 *
 * 使い方:
 *   npx puppeteer browsers install chrome
 *   node appstore-previews/capture.mjs          # iPhone + iPad 両方
 *   node appstore-previews/capture.mjs iphone   # iPhone のみ
 *   node appstore-previews/capture.mjs ipad     # iPad のみ
 *
 * 出力: appstore-previews/output/ に PNG を生成
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

const TARGETS = {
  iphone: {
    width: 1284,
    height: 2778,
    htmlFile: 'slides.html',
    prefix: '',
    slides: [
      { id: 'slide1', filename: '01_hero_keigo.png' },
      { id: 'slide2', filename: '02_kantan_create.png' },
      { id: 'slide3', filename: '03_templates_gmail.png' },
      { id: 'slide4', filename: '04_regenerate.png' },
      { id: 'slide5', filename: '05_learning_data.png' },
    ],
  },
  ipad: {
    width: 2048,
    height: 2732,
    htmlFile: 'slides-ipad.html',
    prefix: 'ipad_',
    slides: [
      { id: 'slide1', filename: 'ipad_01_hero_keigo.png' },
      { id: 'slide2', filename: 'ipad_02_kantan_create.png' },
      { id: 'slide3', filename: 'ipad_03_templates_gmail.png' },
      { id: 'slide4', filename: 'ipad_04_regenerate.png' },
      { id: 'slide5', filename: 'ipad_05_learning_data.png' },
    ],
  },
};

async function captureTarget(browser, targetKey) {
  const target = TARGETS[targetKey];
  console.log(`\n📱 Capturing ${targetKey} (${target.width}x${target.height})...`);

  const page = await browser.newPage();
  await page.setViewport({ width: target.width, height: target.height, deviceScaleFactor: 1 });

  const htmlPath = path.join(__dirname, target.htmlFile);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

  for (const slide of target.slides) {
    await page.evaluate((slideId) => {
      document.querySelectorAll('.slide').forEach(el => {
        el.style.display = 'none';
      });
      const el = document.getElementById(slideId);
      if (el) {
        el.style.display = 'block';
        el.style.transform = 'none';
      }
    }, slide.id);

    await page.waitForFunction(() => {
      const imgs = document.querySelectorAll('img');
      return Array.from(imgs).every(img => img.complete);
    }, { timeout: 10000 }).catch(() => {});

    await new Promise(r => setTimeout(r, 500));

    const outputPath = path.join(OUTPUT_DIR, slide.filename);
    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: target.width, height: target.height },
    });

    console.log(`  ✅ ${slide.filename}`);
  }

  await page.close();
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const arg = process.argv[2]?.toLowerCase();
  const targetKeys = arg && TARGETS[arg] ? [arg] : ['iphone', 'ipad'];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const key of targetKeys) {
    await captureTarget(browser, key);
  }

  await browser.close();
  console.log(`\n🎉 All slides saved to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
