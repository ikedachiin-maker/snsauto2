#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const OUTPUT = path.join(__dirname, 'images', 'ch02-tanabota-steps.png');
const TEMP = path.join(os.tmpdir(), `tanabota_${Date.now()}.html`);

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Helvetica Neue', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
  background: #0F1D38;
  padding: 40px 48px 52px;
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
  margin-bottom: 10px;
  border-left: 4px solid #1877F2;
  padding-left: 14px;
  line-height: 1.4;
}
.tagline {
  font-size: 13px;
  color: #5A7AAA;
  margin-bottom: 36px;
  padding-left: 18px;
}
.steps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.step {
  background: linear-gradient(145deg, #1A2E52 0%, #142040 100%);
  border: 1px solid #2A4A80;
  border-radius: 14px;
  padding: 24px 28px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  position: relative;
}
.step-num {
  background: linear-gradient(135deg, #1877F2, #0F5ED4);
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.step-body { flex: 1; }
.step-title {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 6px;
  line-height: 1.4;
}
.step-period {
  display: inline-block;
  background: rgba(24,119,242,0.2);
  border: 1px solid rgba(24,119,242,0.4);
  color: #6AB0FF;
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 10px;
}
.step-desc {
  font-size: 13px;
  color: #7A9CC8;
  line-height: 1.7;
}
.step-desc span {
  color: #C8D8F0;
  font-weight: 500;
}
.step:nth-child(4) {
  border-color: #22c55e;
  background: linear-gradient(145deg, #1A3828 0%, #102216 100%);
}
.step:nth-child(4) .step-num {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.step:nth-child(4) .step-period {
  background: rgba(34,197,94,0.15);
  border-color: rgba(34,197,94,0.4);
  color: #4ADE80;
}
.footer {
  margin-top: 24px;
  background: rgba(24,119,242,0.08);
  border: 1px solid rgba(24,119,242,0.25);
  border-radius: 10px;
  padding: 16px 24px;
  font-size: 13px;
  color: #7A9CC8;
  text-align: center;
  line-height: 1.7;
}
.footer strong { color: #E8EFF8; }
</style>
</head>
<body>
  <div class="chapter-label">CHAPTER 2 — SNS運用と広告の正しい組み合わせ方</div>
  <h2>タナボタ戦略の実行ステップ</h2>
  <div class="tagline">一回作ったら広告だけ回せば勝手にフォロワーが増える仕組み</div>

  <div class="steps">

    <div class="step">
      <div class="step-num">①</div>
      <div class="step-body">
        <div class="step-period">1〜2週間</div>
        <div class="step-title">プロフィールの完全構築</div>
        <div class="step-desc">
          2-2で解説した<span>7要素を全て整える</span>。<br>
          テキストより「被言語（ビジュアル）」で伝わる状態を作る。<br>
          ここが土台。手を抜かない。
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">②</div>
      <div class="step-body">
        <div class="step-period">1〜2週間</div>
        <div class="step-title">初期投稿を9〜12本まとめて準備</div>
        <div class="step-desc">
          <span>Before/After・施術シーン・スタッフの人柄・FAQ</span>などを揃える。<br>
          一度まとめて作ってしまえば、その後しばらく更新不要。
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">③</div>
      <div class="step-body">
        <div class="step-period">配信開始</div>
        <div class="step-title">認知広告を配信スタート</div>
        <div class="step-desc">
          広告が流入を作り、<span>プロフィールに人を呼んでくる</span>。<br>
          1日500〜1,000円から始めてOK。<br>
          投稿を増やさなくてもフォロワーが増え始める。
        </div>
      </div>
    </div>

    <div class="step">
      <div class="step-num">④</div>
      <div class="step-body">
        <div class="step-period">週1〜2回だけ</div>
        <div class="step-title">あとはストーリーだけ更新</div>
        <div class="step-desc">
          フォロワーとの関係構築は<span>ストーリーで行う</span>。<br>
          投稿は月2〜4本で十分。<br>
          広告×ストーリーで集客が自動化される。
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    実績例：広告費50万円・投稿<strong>わずか9本</strong>のアカウントで、バックエンド商品の売上<strong>1,100万円</strong>を達成。<br>
    量より「プロフィールと初期投稿の質」に集中することが、タナボタ戦略の核心。
  </div>
</body>
</html>`;

fs.writeFileSync(TEMP, html, 'utf8');
try {
  execSync(
    `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless=new --disable-gpu --no-sandbox \
     --screenshot="${OUTPUT}" \
     --window-size=1100,780 \
     --hide-scrollbars \
     "file://${TEMP}"`,
    { stdio: 'pipe', timeout: 30000 }
  );
  console.log(`✓ ${OUTPUT}`);
} finally {
  fs.unlinkSync(TEMP);
}
