#!/usr/bin/env node
// 2-3 フロー図 PNG生成スクリプト

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT = path.join(__dirname, 'images', 'ch02-flow-follower.png');
const TEMP = path.join(os.tmpdir(), `flow_${Date.now()}.html`);

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Helvetica Neue', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
  background: #0F1D38;
  padding: 40px 48px 48px;
  width: 1100px;
}
.chapter-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #1877F2;
  margin-bottom: 10px;
}
h2 {
  font-size: 22px;
  font-weight: 800;
  color: #FFFFFF;
  margin-bottom: 36px;
  border-left: 4px solid #1877F2;
  padding-left: 14px;
  line-height: 1.4;
}
.flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}
.step {
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: 20px;
}
.step-box {
  flex: 1;
  background: linear-gradient(135deg, #1A2E52 0%, #162545 100%);
  border: 1px solid #2A4A80;
  border-radius: 14px;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
.step-num {
  background: linear-gradient(135deg, #1877F2, #0F5ED4);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}
.step-content { flex: 1; }
.step-title {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4px;
}
.step-sub {
  font-size: 13px;
  color: #7A9CC8;
  line-height: 1.5;
}
.step-last .step-box {
  border-color: #4ADE80;
  background: linear-gradient(135deg, #1A3828 0%, #112A1E 100%);
}
.step-last .step-num {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.arrow-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 22px;
  flex: 1;
  margin: 6px 0;
}
.arrow-line {
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, #1877F2, #2A4A80);
}
.arrow-tip {
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 10px solid #1877F2;
}
.arrow-label {
  font-size: 12px;
  color: #5A7AAA;
  margin-top: 6px;
  text-align: center;
  line-height: 1.5;
}
.arrow-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
}
.arrow-col {
  width: 44px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}
.arrow-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 0;
}
</style>
</head>
<body>
  <div class="chapter-label">CHAPTER 2 — SNS運用と広告の正しい組み合わせ方</div>
  <h2>広告→Instagram→フォロワー化のフロー設計</h2>

  <div class="flow">

    <div class="step">
      <div class="step-box">
        <div class="step-num">Step<br>1</div>
        <div class="step-content">
          <div class="step-title">Meta認知広告を配信</div>
          <div class="step-sub">地域の見込み客 5,000〜10,000人にリーチ</div>
        </div>
      </div>
    </div>

    <div class="arrow-row">
      <div class="arrow-col"></div>
      <div class="arrow-main">
        <div class="arrow-line"></div>
        <div class="arrow-tip"></div>
        <div class="arrow-label">気になる → プロフィール確認</div>
      </div>
    </div>

    <div class="step">
      <div class="step-box">
        <div class="step-num">Step<br>2</div>
        <div class="step-content">
          <div class="step-title">広告を見た人がInstagramプロフィールへ</div>
          <div class="step-sub">広告経由の訪問者が「このお店、気になる」と感じる</div>
        </div>
      </div>
    </div>

    <div class="arrow-row">
      <div class="arrow-col"></div>
      <div class="arrow-main">
        <div class="arrow-line"></div>
        <div class="arrow-tip"></div>
        <div class="arrow-label">ハイライト・投稿で「信頼形成」</div>
      </div>
    </div>

    <div class="step">
      <div class="step-box">
        <div class="step-num">Step<br>3</div>
        <div class="step-content">
          <div class="step-title">整ったプロフィールでフォロー獲得</div>
          <div class="step-sub">最適化済みプロフィールが来店率を1% → 5%に引き上げる</div>
        </div>
      </div>
    </div>

    <div class="arrow-row">
      <div class="arrow-col"></div>
      <div class="arrow-main">
        <div class="arrow-line"></div>
        <div class="arrow-tip"></div>
        <div class="arrow-label">「行ってみたい」という気持ちが醸成される</div>
      </div>
    </div>

    <div class="step">
      <div class="step-box">
        <div class="step-num">Step<br>4</div>
        <div class="step-content">
          <div class="step-title">投稿・ストーリーでエンゲージメント向上</div>
          <div class="step-sub">ストーリー週2〜3回更新で継続的な接触機会を作る</div>
        </div>
      </div>
    </div>

    <div class="arrow-row">
      <div class="arrow-col"></div>
      <div class="arrow-main">
        <div class="arrow-line"></div>
        <div class="arrow-tip"></div>
        <div class="arrow-label">信頼が溜まって来店へ</div>
      </div>
    </div>

    <div class="step">
      <div class="step-box">
        <div class="step-num">Step<br>5</div>
        <div class="step-content">
          <div class="step-title">予約・来店</div>
          <div class="step-sub">広告費を直接回収。新規顧客として来店</div>
        </div>
      </div>
    </div>

    <div class="arrow-row">
      <div class="arrow-col"></div>
      <div class="arrow-main">
        <div class="arrow-line"></div>
        <div class="arrow-tip"></div>
        <div class="arrow-label">さらなる認知拡大（広告なしでも広がる）</div>
      </div>
    </div>

    <div class="step step-last">
      <div class="step-box">
        <div class="step-num">Step<br>6</div>
        <div class="step-content">
          <div class="step-title">来店客がUGC（口コミ投稿）</div>
          <div class="step-sub">お客様の自然な投稿が新たな認知を生み、広告費ゼロで集客が継続</div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;

fs.writeFileSync(TEMP, html, 'utf8');
try {
  execSync(
    `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless=new --disable-gpu --no-sandbox \
     --screenshot="${OUTPUT}" \
     --window-size=1100,900 \
     --hide-scrollbars \
     "file://${TEMP}"`,
    { stdio: 'pipe', timeout: 30000 }
  );
  console.log(`✓ ${OUTPUT}`);
} finally {
  fs.unlinkSync(TEMP);
}
