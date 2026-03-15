/**
 * Expo Web版からアプリのスクリーンショットを自動撮影するスクリプト
 *
 * 前提: npx expo start --web --port 8081 が起動中
 * 使い方: node appstore-previews/screenshot-web.mjs
 */
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// iPhone 15 Pro Max viewport (logical pixels)
const IPHONE_VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 3 };
// iPad Pro 13" viewport (logical pixels)
const IPAD_VIEWPORT = { width: 1024, height: 1366, deviceScaleFactor: 2 };

const BASE_URL = 'http://localhost:8081';

// Dark mode media query
const DARK_MODE_EMULATION = { colorScheme: 'dark' };

const SCREENS = [
  { route: '/',                filename: '01_home',       label: 'ホーム画面' },
  { route: '/create/simple',   filename: '02_simple',     label: 'かんたん作成' },
  { route: '/preview',         filename: '03_preview',    label: 'メールプレビュー' },
  { route: '/templates',       filename: '04_templates',  label: 'テンプレート一覧' },
  { route: '/create/detailed', filename: '05_detailed',   label: 'こだわり作成' },
];

async function injectMockData(page) {
  // Inject mock history/mail data into Zustand stores via localStorage
  // This makes the home screen show recent mails and the preview screen show content
  await page.evaluate(() => {
    const now = new Date().toISOString();

    // Mock mail store with history items
    const mailStore = {
      state: {
        currentMail: {
          id: 'preview-1',
          subject: '研究室ご訪問のお願い',
          body: '佐藤教授\n\n突然のご連絡失礼いたします。○○大学文学部3年の山田太郎と申します。\n\n先生の「日本近代文学における自然主義の展開」に関するご研究に大変興味があり、ぜひ一度お話を伺えればと思いメールいたしました。\n\n現在、卒業論文のテーマとして「明治期の文学運動と社会変革」を検討しており、先生のご研究から多くの示唆をいただけるのではないかと考えております。\n\nご多忙のところ大変恐縮ではございますが、15分程度でもお時間をいただけますと幸いです。\n\n何卒よろしくお願いいたします。\n\n山田太郎\n○○大学文学部3年\nメール: yamada@example.com',
          recipientName: '佐藤教授',
          recipientEmail: 'sato@university.ac.jp',
          status: 'generated',
          createdAt: now,
          generationHistory: [
            {
              subject: '研究室ご訪問のお願い',
              body: '佐藤教授\n\n突然のご連絡失礼いたします。○○大学文学部3年の山田太郎と申します。\n\n先生の「日本近代文学における自然主義の展開」に関するご研究に大変興味があり、ぜひ一度お話を伺えればと思いメールいたしました。\n\n現在、卒業論文のテーマとして「明治期の文学運動と社会変革」を検討しており、先生のご研究から多くの示唆をいただけるのではないかと考えております。\n\nご多忙のところ大変恐縮ではございますが、15分程度でもお時間をいただけますと幸いです。\n\n何卒よろしくお願いいたします。\n\n山田太郎\n○○大学文学部3年\nメール: yamada@example.com',
              generatedAt: now,
            }
          ],
        },
        history: [
          {
            id: '1',
            subject: '研究室ご訪問のお願い',
            body: '佐藤教授　突然のご連絡失礼いたします。○○大学3年の山田太郎です...',
            recipientName: '佐藤教授',
            recipientEmail: 'sato@university.ac.jp',
            status: 'sent',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            subject: '打ち合わせ日程変更のお願い',
            body: '田中部長　お疲れ様です。マーケティング部の山田です...',
            recipientName: '田中部長',
            recipientEmail: 'tanaka@company.co.jp',
            status: 'generated',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
        request: {
          recipient: { relationship: 'professor', scope: 'external', positionLevel: 'other' },
          purpose: { category: 'academic', subcategory: 'research_inquiry', situation: '研究室訪問の依頼' },
          tone: { honorificsLevel: 'very_polite', mailLength: 'medium', atmosphere: 'formal', urgency: 'normal' },
          additionalInfo: { keyPoints: '卒業論文のテーマについて相談したい', dateTime: '', properNouns: '', notes: '' },
        },
        isGenerating: false,
      },
      version: 0,
    };
    localStorage.setItem('mail-storage', JSON.stringify(mailStore));

    // Mock contact store
    const contactStore = {
      state: {
        contacts: [
          { id: '1', name: '佐藤教授', email: 'sato@university.ac.jp', relationship: 'professor', scope: 'external' },
          { id: '2', name: '田中部長', email: 'tanaka@company.co.jp', relationship: 'boss', scope: 'internal' },
        ],
      },
      version: 0,
    };
    localStorage.setItem('contact-storage', JSON.stringify(contactStore));

    // Mock consent store (already agreed)
    const consentStore = {
      state: {
        hasAgreedToAIDataUsage: true,
        agreedAt: now,
      },
      version: 0,
    };
    localStorage.setItem('consent-storage', JSON.stringify(consentStore));
  });
}

async function captureScreen(page, screen, viewport, prefix = '') {
  const url = `${BASE_URL}${screen.route}`;
  console.log(`  📸 ${screen.label} (${url})...`);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for React to render
  await new Promise(r => setTimeout(r, 2000));

  // Hide any scrollbars for cleaner screenshot
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = `
      *::-webkit-scrollbar { display: none !important; }
      * { scrollbar-width: none !important; }
    `;
    document.head.appendChild(style);
  });

  await new Promise(r => setTimeout(r, 500));

  const filename = `${prefix}${screen.filename}.png`;
  const outputPath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log(`    ✅ ${filename} (${viewport.width * viewport.deviceScaleFactor}x${viewport.height * viewport.deviceScaleFactor})`);
}

async function main() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // ===== iPhone screenshots =====
  console.log('\n📱 iPhone screenshots...');
  const iphonePage = await browser.newPage();
  await iphonePage.setViewport(IPHONE_VIEWPORT);
  await iphonePage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

  // Inject mock data before first navigation
  await iphonePage.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await injectMockData(iphonePage);

  for (const screen of SCREENS) {
    await captureScreen(iphonePage, screen, IPHONE_VIEWPORT);
  }
  await iphonePage.close();

  // ===== iPad screenshots =====
  console.log('\n📱 iPad screenshots...');
  const ipadPage = await browser.newPage();
  await ipadPage.setViewport(IPAD_VIEWPORT);
  await ipadPage.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);

  await ipadPage.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await injectMockData(ipadPage);

  for (const screen of SCREENS) {
    await captureScreen(ipadPage, screen, IPAD_VIEWPORT, 'ipad_');
  }
  await ipadPage.close();

  await browser.close();
  console.log(`\n🎉 All screenshots saved to: ${SCREENSHOTS_DIR}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
