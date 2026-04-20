// iPad screenshot configs
const screens = [
  {
    file: 'ipad-1.html',
    gradient: 'linear-gradient(168deg, #0f2d70 0%, #1a4fca 50%, #4285f4 100%)',
    phoneColor: '0 0 40px rgba(59,130,246,0.15)',
    badge: '✨ 新社会人・学生に大人気！',
    badgeColor: '#1a4fca',
    smallLabel: 'AIが瞬時に作成',
    hl1: '最短',
    accent: '３０秒',
    hl2: 'でメール生成',
    desc: 'タップ数回で、敬語・ビジネスマナー完璧な<br>日本語メールを自動作成。',
    img: 'screen.PNG',
    transform: 'perspective(1200px) rotateY(-4deg) rotateX(1deg)',
  },
  {
    file: 'ipad-2.html',
    gradient: 'linear-gradient(168deg, #1e1b6e 0%, #3730a3 50%, #6366f1 100%)',
    phoneColor: '0 0 40px rgba(99,102,241,0.15)',
    badge: '📁 何度でも使い回せる！',
    badgeColor: '#3730a3',
    smallLabel: '定型文を一括管理',
    hl1: 'よく使うメール',
    accent: '保存・管理',
    hl2: null,
    desc: '会議の依頼、お礼、報告書など定型文を<br>ワンタップで呼び出せる。',
    img: 'screen-2.PNG',
    transform: 'none',
  },
  {
    file: 'ipad-3.html',
    gradient: 'linear-gradient(168deg, #2e1065 0%, #5b21b6 50%, #8b5cf6 100%)',
    phoneColor: '0 0 40px rgba(139,92,246,0.18)',
    badge: '🔄 こだわり派も安心！',
    badgeColor: '#5b21b6',
    smallLabel: '気に入るまで無制限',
    hl1: '納得いくまで',
    accent: '何度も',
    hl2: '再生成できる',
    desc: '気に入らなければワンタップで再生成。<br>自分の言葉で修正も自由自在。',
    img: 'screen-3.PNG',
    transform: 'perspective(1200px) rotateY(-3deg)',
  },
  {
    file: 'ipad-4.html',
    gradient: 'linear-gradient(168deg, #0c3448 0%, #0369a1 50%, #0ea5e9 100%)',
    phoneColor: '0 0 40px rgba(14,165,233,0.15)',
    badge: '📧 シームレスな送信体験！',
    badgeColor: '#0369a1',
    smallLabel: 'メール連携対応',
    hl1: 'GmailもOutlookも',
    accent: 'そのまま送信',
    hl2: null,
    desc: '生成したメールをアプリから直接送信。<br>メールアプリへのコピーペースト不要。',
    img: 'screen-4.PNG',
    transform: 'none',
  },
  {
    file: 'ipad-5.html',
    gradient: 'linear-gradient(168deg, #0f2d70 0%, #1e40af 50%, #3b82f6 100%)',
    phoneColor: '0 0 40px rgba(59,130,246,0.15)',
    badge: '👤 相手に合わせた敬語で！',
    badgeColor: '#1e40af',
    smallLabel: 'Gmail・Outlook連携',
    hl1: '連絡先を',
    accent: 'スマートに<br>管理',
    hl2: null,
    desc: 'Gmail・Outlookの連絡先を取り込み、<br>相手の関係性に合わせた敬語を自動選択。',
    img: 'screen-5.PNG',
    transform: 'perspective(1200px) rotateY(-4deg) rotateX(1deg)',
  },
  {
    file: 'ipad-6.html',
    gradient: 'linear-gradient(168deg, #1e0a3c 0%, #4c1d95 50%, #7c3aed 100%)',
    phoneColor: '0 0 40px rgba(124,58,237,0.2)',
    badge: '🤖 あなただけのAIに！',
    badgeColor: '#4c1d95',
    smallLabel: '細かく指示できる',
    hl1: 'AIを自分好みに',
    accent: 'カスタマイズ',
    hl2: null,
    desc: '敬語レベル・文体・長さを細かく設定。<br>使えば使うほど自分らしい文章に。',
    img: 'screen-6.PNG',
    transform: 'none',
  },
];

const fs = require('fs');

for (const s of screens) {
  const hl2Line = s.hl2 ? `  <div class="hl">${s.hl2}</div>` : '';
  const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>iPad ${s.file}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 1024px; height: 1366px; overflow: hidden; }
body {
  font-family: -apple-system, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
  background: ${s.gradient};
  display: flex; flex-direction: column; align-items: center;
  padding: 70px 50px 0; position: relative;
}
.c1,.c2 { position:absolute;border-radius:50%;pointer-events:none; }
.c1 { width:600px;height:600px;background:rgba(255,255,255,0.05);top:-180px;right:-160px; }
.c2 { width:360px;height:360px;background:rgba(255,255,255,0.04);bottom:120px;left:-130px; }
.badge {
  background:#fff;color:${s.badgeColor};font-size:20px;font-weight:800;
  padding:12px 30px;border-radius:999px;margin-bottom:36px;
  position:relative;align-self:flex-start;
  box-shadow:0 6px 20px rgba(0,0,0,0.22);letter-spacing:.02em;white-space:nowrap;
}
.badge::after {
  content:'';position:absolute;bottom:-11px;left:28px;
  width:0;height:0;border-left:8px solid transparent;
  border-right:8px solid transparent;border-top:12px solid #fff;
}
.text-section { width:100%;color:white;margin-bottom:28px; }
.small-label { font-size:18px;font-weight:600;opacity:.65;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px; }
.hl { font-size:88px;font-weight:900;line-height:1.1;letter-spacing:-0.02em; }
.hl-accent { color:#fbbf24;font-size:100px;font-weight:900;letter-spacing:-0.03em;line-height:1.08;display:block; }
.desc { margin-top:18px;font-size:24px;font-weight:500;opacity:.82;line-height:1.65; }
.phone-wrap { flex:1;display:flex;align-items:flex-end;justify-content:center; }
.phone {
  width:380px;height:820px;background:#0c0c0c;border-radius:70px;padding:18px;
  position:relative;flex-shrink:0;
  box-shadow:0 0 0 2px #2e2e2e,0 0 0 4px #111,0 40px 100px rgba(0,0,0,0.55),${s.phoneColor};
  transform:${s.transform};
}
.phone-screen { width:100%;height:100%;background:#f0f2f5;border-radius:54px;overflow:hidden; }
img { width:100%;height:100%;object-fit:cover;object-position:top;border-radius:54px; }
</style></head>
<body>
<div class="c1"></div><div class="c2"></div>
<div class="badge">${s.badge}</div>
<div class="text-section">
  <div class="small-label">${s.smallLabel}</div>
  <div class="hl">${s.hl1}</div>
  <span class="hl-accent">${s.accent}</span>
${hl2Line}
  <div class="desc">${s.desc}</div>
</div>
<div class="phone-wrap">
  <div class="phone">
    <div class="phone-screen">
      <img src="${s.img}" alt="アプリ画面">
    </div>
  </div>
</div>
</body></html>`;
  fs.writeFileSync(s.file, html);
  console.log(`Created ${s.file}`);
}
