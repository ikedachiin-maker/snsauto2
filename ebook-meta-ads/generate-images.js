#!/usr/bin/env node
// Meta広告カラー系インフォグラフィック生成スクリプト
// Chrome ヘッドレスモードでHTML→PNG変換

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, 'images');
const TEMP_DIR = os.tmpdir();

// Meta カラーパレット
const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
    background: #0F1D38;
    color: #E8EFF8;
    padding: 0;
  }
  .card {
    background: linear-gradient(145deg, #1A2E52 0%, #0F1D38 100%);
    border: 1px solid #2A4A80;
    border-radius: 16px;
    padding: 36px 40px;
    min-width: 900px;
    max-width: 1100px;
    margin: 40px auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .chapter-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #1877F2;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 22px;
    font-weight: 800;
    color: #FFFFFF;
    margin-bottom: 28px;
    line-height: 1.4;
    border-left: 4px solid #1877F2;
    padding-left: 14px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 10px;
    overflow: hidden;
  }
  thead tr {
    background: linear-gradient(90deg, #1877F2 0%, #0F5ED4 100%);
  }
  thead th {
    padding: 14px 18px;
    font-size: 13px;
    font-weight: 700;
    color: #FFFFFF;
    text-align: left;
    letter-spacing: 0.5px;
  }
  tbody tr {
    border-bottom: 1px solid #1E3460;
    transition: background 0.2s;
  }
  tbody tr:nth-child(even) {
    background: rgba(24, 119, 242, 0.07);
  }
  tbody tr:last-child {
    border-bottom: none;
  }
  tbody td {
    padding: 14px 18px;
    font-size: 14px;
    color: #C8D8F0;
    line-height: 1.6;
  }
  tbody td:first-child {
    font-weight: 600;
    color: #E8EFF8;
  }
  .badge {
    display: inline-block;
    background: rgba(24, 119, 242, 0.25);
    border: 1px solid rgba(24, 119, 242, 0.5);
    color: #6AB0FF;
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 600;
  }
  .tag-good { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.4); color: #4ADE80; }
  .tag-warn { background: rgba(251,191,36,0.15); border-color: rgba(251,191,36,0.4); color: #FCD34D; }
  .tag-bad  { background: rgba(239,68,68,0.15);  border-color: rgba(239,68,68,0.4);  color: #FCA5A5; }
  .footer-note {
    margin-top: 16px;
    font-size: 11px;
    color: #5A7AAA;
    text-align: right;
  }
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 8px;
  }
  .stat-box {
    background: rgba(24,119,242,0.1);
    border: 1px solid rgba(24,119,242,0.3);
    border-radius: 10px;
    padding: 18px 20px;
    text-align: center;
  }
  .stat-label { font-size: 12px; color: #7A9CC8; margin-bottom: 6px; }
  .stat-value { font-size: 26px; font-weight: 800; color: #FFFFFF; }
  .stat-sub   { font-size: 11px; color: #5A7AAA; margin-top: 4px; }
  .before-after {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0;
    align-items: stretch;
  }
  .ba-col {
    background: rgba(24,119,242,0.08);
    border: 1px solid rgba(24,119,242,0.25);
    border-radius: 10px;
    padding: 16px 20px;
  }
  .ba-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 12px;
    color: #5A7AAA;
  }
  .ba-label.after { color: #1877F2; }
  .ba-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    font-size: 28px;
    color: #1877F2;
  }
  .ba-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; }
  .ba-key { color: #7A9CC8; }
  .ba-val { font-weight: 600; color: #E8EFF8; }
  .ba-val.highlight { color: #4ADE80; }
`;

function buildHtml(title, chapter, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>
<div class="card">
  <div class="chapter-label">${chapter}</div>
  <h2>${title}</h2>
  ${bodyHtml}
</div>
</body>
</html>`;
}

function simpleTable(headers, rows) {
  const ths = headers.map(h => `<th>${h}</th>`).join('');
  const trs = rows.map(r =>
    `<tr>${r.map((c, i) => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function screenshot(html, filename) {
  const tmpFile = path.join(TEMP_DIR, `meta_img_${Date.now()}.html`);
  fs.writeFileSync(tmpFile, html, 'utf8');
  const outPath = path.join(OUTPUT_DIR, filename);
  try {
    execSync(
      `"${CHROME}" --headless=new --disable-gpu --no-sandbox \
       --screenshot="${outPath}" \
       --window-size=1100,800 \
       --hide-scrollbars \
       "file://${tmpFile}"`,
      { stdio: 'pipe', timeout: 30000 }
    );
    // Chrome screenshots entire viewport; crop is done via window-size
    console.log(`✓ ${filename}`);
  } catch (e) {
    console.error(`✗ ${filename}: ${e.message.slice(0,100)}`);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ─── 各画像の定義 ────────────────────────────────────────

const images = [

  // ── CH01 ──────────────────────────────────────────────
  {
    file: 'ch01-budget-reach.png',
    html: buildHtml(
      '実店舗向け認知広告の予算とリーチ目安',
      'CHAPTER 1 — 少額予算でも効く理由',
      simpleTable(
        ['1日の予算', '月額', '想定リーチ（認知広告）', '想定インプレッション'],
        [
          ['500円', '約15,000円', '500〜1,500人/日', '1,000〜3,000回/日'],
          ['1,000円', '約30,000円', '1,000〜3,000人/日', '2,000〜6,000回/日'],
          ['2,000円', '約60,000円', '2,000〜6,000人/日', '4,000〜12,000回/日'],
        ]
      ) + `<p class="footer-note">※ 地域・業種・クリエイティブの質によって変動あり</p>`
    ),
  },

  // ── CH02 ──────────────────────────────────────────────
  {
    file: 'ch02-profile-visit-rate.png',
    html: buildHtml(
      'プロフィール最適化で来店率が変わる',
      'CHAPTER 2 — SNSと広告の関係',
      simpleTable(
        ['プロフィールの状態', '来店率の目安'],
        [
          ['整っていない', '<span class="badge tag-bad">1%</span>'],
          ['基本要素あり', '<span class="badge tag-warn">2〜3%</span>'],
          ['最適化済み', '<span class="badge tag-good">5%</span>'],
        ]
      ) + `<p class="footer-note">※ 月アクセス400人なら最適化前後で年間48〜192万円の売上差</p>`
    ),
  },

  // ── CH03-1 ─────────────────────────────────────────────
  {
    file: 'ch03-radius-guide.png',
    html: buildHtml(
      '立地別・推奨ターゲット半径',
      'CHAPTER 3 — ターゲティング設定',
      simpleTable(
        ['立地', '推奨半径', '理由'],
        [
          ['都市部（山手線内など）', '3〜5km', '交通が便利・競合も多い'],
          ['郊外・住宅街', '5〜8km', '車での来店も想定'],
          ['ロードサイド店', '8〜10km', '車移動が前提'],
        ]
      )
    ),
  },

  // ── CH03-2 ─────────────────────────────────────────────
  {
    file: 'ch03-target-esthetic.png',
    html: buildHtml(
      'エステサロン向けターゲット基本設定',
      'CHAPTER 3 — ターゲティング設定',
      simpleTable(
        ['項目', '設定値'],
        [
          ['年齢', '25〜50歳'],
          ['性別', '女性'],
          ['地域', '店舗から半径5km'],
        ]
      )
    ),
  },

  // ── CH03-3 ─────────────────────────────────────────────
  {
    file: 'ch03-target-gym.png',
    html: buildHtml(
      'パーソナルジム向けターゲット基本設定',
      'CHAPTER 3 — ターゲティング設定',
      simpleTable(
        ['項目', '設定値'],
        [
          ['年齢', '25〜45歳'],
          ['性別', '男女両方（女性特化の場合は女性のみ）'],
          ['地域', '店舗から半径5〜8km'],
        ]
      )
    ),
  },

  // ── CH03-4 ─────────────────────────────────────────────
  {
    file: 'ch03-target-eyebrow.png',
    html: buildHtml(
      '眉サロン向けターゲット基本設定',
      'CHAPTER 3 — ターゲティング設定',
      simpleTable(
        ['項目', '設定値'],
        [
          ['年齢', '20〜45歳'],
          ['性別', '女性'],
          ['地域', '店舗から半径3〜5km（都市部は特に絞る）'],
        ]
      )
    ),
  },

  // ── CH03-5 ─────────────────────────────────────────────
  {
    file: 'ch03-target-hair-removal.png',
    html: buildHtml(
      '脱毛サロン向けターゲット基本設定',
      'CHAPTER 3 — ターゲティング設定',
      simpleTable(
        ['項目', '設定値'],
        [
          ['年齢', '18〜40歳'],
          ['性別', '女性（ひげ脱毛を扱う場合は男性も）'],
          ['地域', '店舗から半径5km'],
        ]
      )
    ),
  },

  // ── CH04-1 ─────────────────────────────────────────────
  {
    file: 'ch04-format-comparison.png',
    html: buildHtml(
      '実店舗系で高CTRの3クリエイティブフォーマット',
      'CHAPTER 4 — クリエイティブ制作',
      simpleTable(
        ['フォーマット', '向いている業種', '制作難易度'],
        [
          ['Before/After画像', 'エステ・眉サロン・脱毛・ジム', '★★☆'],
          ['リール動画（15〜30秒）', '全業種', '★★★'],
          ['UGC風動画（お客様目線）', 'エステ・ジム・脱毛', '★★★'],
        ]
      )
    ),
  },

  // ── CH04-2 ─────────────────────────────────────────────
  {
    file: 'ch04-opening-patterns.png',
    html: buildHtml(
      '冒頭3秒を止める！効果的な動画パターン',
      'CHAPTER 4 — クリエイティブ制作',
      simpleTable(
        ['パターン', '例'],
        [
          ['衝撃の問いかけ', '「毎朝の眉メイク、まだやってるんですか？」'],
          ['数字で驚かせる', '「月1万円以下で、新規3名が来るようになった話」'],
          ['Before状態の提示', '「こんな悩みありませんか？」＋施術前の写真'],
          ['結果を先に見せる', 'Afterの状態から始まり「実はこれ、1ヶ月前の話です」'],
        ]
      )
    ),
  },

  // ── CH04-3 ─────────────────────────────────────────────
  {
    file: 'ch04-creative-kpi.png',
    html: buildHtml(
      '良質なクリエイティブの目標数値',
      'CHAPTER 4 — クリエイティブ制作',
      simpleTable(
        ['指標', '目標値', '備考'],
        [
          ['プロフィールアクセス単価', '<span class="badge tag-good">3〜5円</span>', 'インフルエンサーレベルの動画品質'],
          ['フォロワー獲得単価', '<span class="badge tag-good">30〜40円</span>', 'プロフィール最適化済みの場合'],
          ['ThruPlay率（視聴完了率）', '<span class="badge tag-good">7%以上</span>', 'オーガニック当たり動画で達成しやすい'],
        ]
      )
    ),
  },

  // ── CH05-1 ─────────────────────────────────────────────
  {
    file: 'ch05-adset-settings.png',
    html: buildHtml(
      '広告セット（ターゲット・予算）の基本設定',
      'CHAPTER 5 — 広告設定と計測',
      simpleTable(
        ['項目', '設定内容'],
        [
          ['予算', '1日の予算：500〜1,000円からスタート'],
          ['掲載期間', '終了日なし（いつでも停止できる）'],
          ['場所', '店舗から半径○km（第3章を参照）'],
          ['年齢', '業種に合わせて（第3章を参照）'],
          ['性別', '業種に合わせて'],
          ['オーディエンス', 'Advantage+（推奨）または詳細設定'],
        ]
      )
    ),
  },

  // ── CH05-2 ─────────────────────────────────────────────
  {
    file: 'ch05-creative-settings.png',
    html: buildHtml(
      '広告（クリエイティブ）の基本設定',
      'CHAPTER 5 — 広告設定と計測',
      simpleTable(
        ['項目', '設定内容'],
        [
          ['形式', '画像1枚 または 動画'],
          ['画像/動画', '第4章で作成したもの'],
          ['広告文', '3〜5行のシンプルなキャプション'],
          ['見出し', '15文字以内（任意）'],
          ['掲載面', '「自動配置」推奨（Instagram・Facebookに自動配信）'],
        ]
      )
    ),
  },

  // ── CH05-3 ─────────────────────────────────────────────
  {
    file: 'ch05-cpm-benchmark.png',
    html: buildHtml(
      'CPM（1,000回表示単価）の評価目安',
      'CHAPTER 5 — 見るべき数値はたった3つ',
      simpleTable(
        ['評価', '目安CPM'],
        [
          ['<span class="badge tag-good">良好</span>', '500円以下'],
          ['<span class="badge tag-warn">普通</span>', '500〜1,000円'],
          ['<span class="badge tag-bad">要改善</span>', '1,000円以上'],
        ]
      ) + `<p class="footer-note">CPMが高い場合 → クリエイティブを変える・ターゲットを見直す</p>`
    ),
  },

  // ── CH05-4 ─────────────────────────────────────────────
  {
    file: 'ch05-frequency-benchmark.png',
    html: buildHtml(
      'フリークエンシー（表示頻度）の評価目安',
      'CHAPTER 5 — 見るべき数値はたった3つ',
      simpleTable(
        ['評価', '目安'],
        [
          ['<span class="badge tag-good">良好</span>', '1.0〜3.0回'],
          ['<span class="badge tag-warn">注意</span>', '3.0〜5.0回'],
          ['<span class="badge tag-bad">要停止 / 変更</span>', '5.0回以上'],
        ]
      ) + `<p class="footer-note">5回超 → クリエイティブ差し替え or オーディエンスを広げる</p>`
    ),
  },

  // ── CH05-5 ─────────────────────────────────────────────
  {
    file: 'ch05-action-guide.png',
    html: buildHtml(
      '週次PDCA — 改善アクション早見表',
      'CHAPTER 5 — 広告設定と計測',
      simpleTable(
        ['数値の状態', '取るべきアクション'],
        [
          ['CPMが高い（1,000円超）', 'クリエイティブを変更'],
          ['リーチが少ない', '地域範囲を広げる・予算を増やす'],
          ['フリークエンシーが高い', 'クリエイティブを差し替え'],
          ['フォロワーが増えない', 'Instagramプロフィールを見直す'],
          ['全体的に低調', '2週間待つ（AI学習中の可能性）'],
        ]
      )
    ),
  },

  // ── CH06-1 設定 ───────────────────────────────────────
  {
    file: 'ch06-case1-settings.png',
    html: buildHtml(
      '事例①エステサロン — 広告設定',
      'CHAPTER 6 — ケーススタディ',
      simpleTable(
        ['項目', '内容'],
        [
          ['月額予算', '約25,000円（1日800円）'],
          ['目的', 'リーチ（認知度アップ）'],
          ['地域', '店舗から半径6km'],
          ['年齢・性別', '30〜50歳・女性'],
          ['オーディエンス', 'Advantage+'],
          ['クリエイティブ', 'Before/After画像2種類'],
        ]
      )
    ),
  },

  // ── CH06-1 結果 ───────────────────────────────────────
  {
    file: 'ch06-case1-results.png',
    html: buildHtml(
      '事例①エステサロン — 3ヶ月後の結果',
      'CHAPTER 6 — ケーススタディ',
      `<div class="before-after">
        <div class="ba-col">
          <div class="ba-label">BEFORE</div>
          <div class="ba-row"><span class="ba-key">フォロワー</span><span class="ba-val">200名</span></div>
          <div class="ba-row"><span class="ba-key">プロフィールアクセス/月</span><span class="ba-val">約80回</span></div>
          <div class="ba-row"><span class="ba-key">新規問い合わせ/月</span><span class="ba-val">1〜2名</span></div>
          <div class="ba-row"><span class="ba-key">CPM</span><span class="ba-val">—</span></div>
        </div>
        <div class="ba-arrow">→</div>
        <div class="ba-col">
          <div class="ba-label after">3ヶ月後</div>
          <div class="ba-row"><span class="ba-key">フォロワー</span><span class="ba-val highlight">480名</span></div>
          <div class="ba-row"><span class="ba-key">プロフィールアクセス/月</span><span class="ba-val highlight">約420回</span></div>
          <div class="ba-row"><span class="ba-key">新規問い合わせ/月</span><span class="ba-val highlight">4〜5名</span></div>
          <div class="ba-row"><span class="ba-key">CPM</span><span class="ba-val highlight">約620円</span></div>
        </div>
      </div>`
    ),
  },

  // ── CH06-2 設定 ───────────────────────────────────────
  {
    file: 'ch06-case2-settings.png',
    html: buildHtml(
      '事例②パーソナルジム — 広告設定',
      'CHAPTER 6 — ケーススタディ',
      simpleTable(
        ['項目', '内容'],
        [
          ['月額予算', '約30,000円（1日1,000円）'],
          ['目的', 'リーチ（認知度アップ）'],
          ['地域', '店舗から半径5km'],
          ['年齢・性別', '28〜45歳・女性'],
          ['オーディエンス', '興味関心：ダイエット・フィットネス・ボディメイク'],
          ['クリエイティブ', 'リール動画（トレーナーが語りかける形式）1本'],
        ]
      )
    ),
  },

  // ── CH06-2 結果 ───────────────────────────────────────
  {
    file: 'ch06-case2-results.png',
    html: buildHtml(
      '事例②パーソナルジム — 2ヶ月後の結果',
      'CHAPTER 6 — ケーススタディ',
      `<div class="before-after">
        <div class="ba-col">
          <div class="ba-label">BEFORE</div>
          <div class="ba-row"><span class="ba-key">フォロワー</span><span class="ba-val">0名</span></div>
          <div class="ba-row"><span class="ba-key">体験申込み/月</span><span class="ba-val">0〜1名（紹介のみ）</span></div>
          <div class="ba-row"><span class="ba-key">体験申込みCPA</span><span class="ba-val">—</span></div>
          <div class="ba-row"><span class="ba-key">CPM</span><span class="ba-val">—</span></div>
        </div>
        <div class="ba-arrow">→</div>
        <div class="ba-col">
          <div class="ba-label after">2ヶ月後</div>
          <div class="ba-row"><span class="ba-key">フォロワー</span><span class="ba-val highlight">230名</span></div>
          <div class="ba-row"><span class="ba-key">体験申込み/月</span><span class="ba-val highlight">月5〜6名</span></div>
          <div class="ba-row"><span class="ba-key">体験申込みCPA</span><span class="ba-val highlight">約2,300円</span></div>
          <div class="ba-row"><span class="ba-key">CPM</span><span class="ba-val highlight">約780円</span></div>
        </div>
      </div>`
    ),
  },

  // ── CH06-3 設定 ───────────────────────────────────────
  {
    file: 'ch06-case3-settings.png',
    html: buildHtml(
      '事例③眉サロン — 広告設定',
      'CHAPTER 6 — ケーススタディ',
      simpleTable(
        ['項目', '内容'],
        [
          ['月額予算', '約15,000円（1日500円）'],
          ['目的', 'リーチ（認知度アップ）'],
          ['地域', '店舗から半径4km'],
          ['年齢・性別', '22〜42歳・女性'],
          ['オーディエンス', 'Advantage+'],
          ['クリエイティブ', 'Before/After画像（月2種類ローテーション）'],
        ]
      )
    ),
  },

  // ── CH06-3 結果 ───────────────────────────────────────
  {
    file: 'ch06-case3-results.png',
    html: buildHtml(
      '事例③眉サロン — 3ヶ月後の結果',
      'CHAPTER 6 — ケーススタディ',
      `<div class="before-after">
        <div class="ba-col">
          <div class="ba-label">BEFORE</div>
          <div class="ba-row"><span class="ba-key">フォロワー</span><span class="ba-val">85名</span></div>
          <div class="ba-row"><span class="ba-key">フォロワー増加/月</span><span class="ba-val">約5名/月</span></div>
          <div class="ba-row"><span class="ba-key">ホットペッパー依存度</span><span class="ba-val">売上の90%</span></div>
          <div class="ba-row"><span class="ba-key">CPM</span><span class="ba-val">—</span></div>
        </div>
        <div class="ba-arrow">→</div>
        <div class="ba-col">
          <div class="ba-label after">3ヶ月後</div>
          <div class="ba-row"><span class="ba-key">フォロワー</span><span class="ba-val highlight">720名（+635名）</span></div>
          <div class="ba-row"><span class="ba-key">フォロワー増加/月</span><span class="ba-val highlight">約200名/月</span></div>
          <div class="ba-row"><span class="ba-key">ホットペッパー依存度</span><span class="ba-val highlight">売上の60%（減少）</span></div>
          <div class="ba-row"><span class="ba-key">CPM</span><span class="ba-val highlight">約480円</span></div>
        </div>
      </div>`
    ),
  },

  // ── CH06-4 設定 ───────────────────────────────────────
  {
    file: 'ch06-case4-settings.png',
    html: buildHtml(
      '事例④脱毛サロン — 認知広告への変更設定',
      'CHAPTER 6 — ケーススタディ',
      simpleTable(
        ['項目', '内容'],
        [
          ['月額予算', '約30,000円（1日1,000円）'],
          ['目的', 'リーチ（認知度アップ）に変更'],
          ['地域', '店舗から半径8km（ロードサイドのため広めに設定）'],
          ['年齢・性別', '20〜38歳・女性'],
          ['クリエイティブ', 'UGC風リール動画（スタッフが語りかける形式）'],
        ]
      )
    ),
  },

  // ── CH06-4 結果（比較） ───────────────────────────────
  {
    file: 'ch06-case4-results.png',
    html: buildHtml(
      '事例④脱毛サロン — コンバージョン広告 vs 認知広告',
      'CHAPTER 6 — ケーススタディ',
      simpleTable(
        ['指標', '変更前（コンバージョン広告）', '変更後（認知広告）'],
        [
          ['月額広告費', '30,000円', '30,000円（同額）'],
          ['月間カウンセリング予約', '2〜3件', '<span class="badge tag-good">6〜8件</span>'],
          ['CPA（顧客獲得単価）', '<span class="badge tag-bad">約15,000円</span>', '<span class="badge tag-good">約4,500円</span>'],
          ['Instagramフォロワー', '120名', '<span class="badge tag-good">580名</span>'],
        ]
      )
    ),
  },

];

// ─── 実行 ────────────────────────────────────────────────

console.log(`\n🎨 Meta広告カラー インフォグラフィック生成\n`);
console.log(`出力先: ${OUTPUT_DIR}\n`);

for (const img of images) {
  screenshot(img.html, img.file);
}

console.log(`\n✅ 完了: ${images.length}枚\n`);
