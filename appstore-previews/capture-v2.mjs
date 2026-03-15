/**
 * App Store プレビュー画像キャプチャスクリプト v2
 * (デバイスフレーム付き — 実際のアプリスクリーンショットを埋め込む)
 *
 * 前提:
 *   appstore-previews/screenshots/ に以下の画像を配置:
 *     iPhone用: 01_home.png, 02_simple.png, 03_preview.png, 04_templates.png, 05_detailed.png
 *     iPad用:   ipad_01_home.png, ipad_02_simple.png, ipad_03_preview.png, ipad_04_templates.png, ipad_05_detailed.png
 *
 * 使い方:
 *   npx puppeteer browsers install chrome
 *   node appstore-previews/capture-v2.mjs          # iPhone + iPad 両方
 *   node appstore-previews/capture-v2.mjs iphone   # iPhone のみ
 *   node appstore-previews/capture-v2.mjs ipad     # iPad のみ
 *
 * 出力: appstore-previews/output-v2/ に PNG を生成
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output-v2');

const TARGETS = {
  iphone: {
    width: 1284,
    height: 2778,
    htmlFile: 'slides-v2.html',
    slides: [
      { id: 'slide1', filename: '01_home.png' },
      { id: 'slide2', filename: '02_simple.png' },
      { id: 'slide3', filename: '03_preview.png' },
      { id: 'slide4', filename: '04_templates.png' },
      { id: 'slide5', filename: '05_detailed.png' },
    ],
  },
  ipad: {
    width: 2048,
    height: 2732,
    htmlFile: 'slides-v2-ipad.html',
    slides: [
      { id: 'slide1', filename: 'ipad_01_home.png' },
      { id: 'slide2', filename: 'ipad_02_simple.png' },
      { id: 'slide3', filename: 'ipad_03_preview.png' },
      { id: 'slide4', filename: 'ipad_04_templates.png' },
      { id: 'slide5', filename: 'ipad_05_detailed.png' },
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
        el.style.display = 'flex';
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
  // Check screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    console.log('⚠️  screenshots/ ディレクトリが見つかりません。');
    console.log('   以下のファイルを appstore-previews/screenshots/ に配置してください:');
    console.log('');
    console.log('   iPhone用:');
    console.log('     01_home.png       — ホーム画面');
    console.log('     02_simple.png     — かんたん作成画面');
    console.log('     03_preview.png    — メールプレビュー画面');
    console.log('     04_templates.png  — テンプレート一覧画面');
    console.log('     05_detailed.png   — こだわり作成画面');
    console.log('');
    console.log('   iPad用:');
    console.log('     ipad_01_home.png       — ホーム画面');
    console.log('     ipad_02_simple.png     — かんたん作成画面');
    console.log('     ipad_03_preview.png    — メールプレビュー画面');
    console.log('     ipad_04_templates.png  — テンプレート一覧画面');
    console.log('     ipad_05_detailed.png   — こだわり作成画面');
    console.log('');
    console.log('   iOSシミュレーターでスクリーンショット: Cmd+S');
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('\n📁 screenshots/ ディレクトリを作成しました。');
    return;
  }

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
