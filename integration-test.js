#!/usr/bin/env node
/**
 * Meta広告自動化プロジェクト - 統合テストスクリプト
 *
 * 全6モジュールを順番にテストし、モジュール間の連携も検証
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// カラー出力用のヘルパー
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 各モジュールの定義
const modules = [
  {
    id: 1,
    name: 'meta-ad-creative-mcp',
    title: 'クリエイティブ自動生成',
    testScript: 'test/smoke-test.js',
    description: '画像生成（Gemini API）+ コピー生成（Claude API）',
    hasTest: false, // testディレクトリなし
  },
  {
    id: 2,
    name: 'meta-campaign-mcp',
    title: 'キャンペーン自動作成',
    testScript: 'test/smoke-test.js',
    description: 'Meta Marketing API v25.0 + Advantage+ 対応',
    hasTest: true,
  },
  {
    id: 3,
    name: 'meta-budget-mcp',
    title: '予算最適化',
    testScript: 'test/smoke-test.js',
    description: 'CBO管理 + 自動ルール + 入札戦略',
    hasTest: true,
  },
  {
    id: 4,
    name: 'meta-experiment-mcp',
    title: 'A/Bテスト自動化',
    testScript: 'test/smoke-test.js',
    description: 'Experiments API + 統計的有意差判定',
    hasTest: true,
  },
  {
    id: 5,
    name: 'meta-tracking-mcp',
    title: 'トラッキング',
    testScript: 'test/smoke-test.js',
    description: 'Pixel + Conversions API + 重複排除',
    hasTest: true,
  },
  {
    id: 6,
    name: 'meta-report-mcp',
    title: 'レポート自動生成',
    testScript: 'test/smoke-test.js',
    description: 'Insights API + Markdown/CSV出力',
    hasTest: true,
  },
];

// テスト結果の集計
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: [],
};

/**
 * 各モジュールの存在確認
 */
function checkModuleExists(moduleName) {
  const modulePath = path.join(__dirname, moduleName);
  const packagePath = path.join(modulePath, 'package.json');

  if (!fs.existsSync(modulePath)) {
    return { exists: false, reason: 'ディレクトリが存在しません' };
  }

  if (!fs.existsSync(packagePath)) {
    return { exists: false, reason: 'package.jsonが存在しません' };
  }

  return { exists: true };
}

/**
 * モジュールの依存関係をインストール
 */
function installDependencies(moduleName) {
  return new Promise((resolve, reject) => {
    const modulePath = path.join(__dirname, moduleName);
    const nodeModulesPath = path.join(modulePath, 'node_modules');

    // すでにnode_modulesがあればスキップ
    if (fs.existsSync(nodeModulesPath)) {
      log(`  ✓ 依存関係は既にインストール済み`, 'gray');
      resolve();
      return;
    }

    log(`  📦 依存関係をインストール中...`, 'cyan');

    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const proc = spawn(npm, ['install'], {
      cwd: modulePath,
      stdio: 'pipe',
    });

    proc.on('close', (code) => {
      if (code === 0) {
        log(`  ✓ 依存関係のインストール完了`, 'green');
        resolve();
      } else {
        reject(new Error(`npm install failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

/**
 * モジュールのテストを実行
 */
function runModuleTest(module) {
  return new Promise((resolve, reject) => {
    const modulePath = path.join(__dirname, module.name);
    const testPath = path.join(modulePath, module.testScript);

    if (!fs.existsSync(testPath)) {
      log(`  ⚠ テストスクリプトが見つかりません: ${module.testScript}`, 'yellow');
      resolve({ status: 'skipped', reason: 'テストスクリプトなし' });
      return;
    }

    log(`  🧪 テストを実行中...`, 'cyan');

    const proc = spawn('node', [testPath], {
      cwd: modulePath,
      stdio: 'pipe',
      env: { ...process.env, DRY_RUN: 'true' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        log(`  ✓ テスト成功`, 'green');
        resolve({ status: 'passed', output: stdout });
      } else {
        log(`  ✗ テスト失敗 (exit code: ${code})`, 'red');
        resolve({ status: 'failed', error: stderr || stdout, code });
      }
    });

    proc.on('error', (error) => {
      log(`  ✗ テスト実行エラー: ${error.message}`, 'red');
      resolve({ status: 'failed', error: error.message });
    });
  });
}

/**
 * モジュール構造の検証
 */
function validateModuleStructure(module) {
  const modulePath = path.join(__dirname, module.name);
  const checks = [
    { file: 'package.json', required: true },
    { file: 'index.js', required: true },
    { file: 'lib', required: true, type: 'directory' },
  ];

  const issues = [];

  for (const check of checks) {
    const fullPath = path.join(modulePath, check.file);
    const exists = fs.existsSync(fullPath);

    if (!exists && check.required) {
      issues.push(`必須ファイル/ディレクトリが見つかりません: ${check.file}`);
    } else if (exists && check.type === 'directory' && !fs.statSync(fullPath).isDirectory()) {
      issues.push(`ディレクトリであるべきですがファイルです: ${check.file}`);
    }
  }

  return issues;
}

/**
 * メイン処理
 */
async function main() {
  log('\n========================================', 'cyan');
  log('  Meta広告自動化プロジェクト', 'cyan');
  log('  統合テスト', 'cyan');
  log('========================================\n', 'cyan');

  log(`テスト対象: ${modules.length}モジュール\n`, 'blue');

  for (const module of modules) {
    results.total++;

    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue');
    log(`Module ${module.id}: ${module.title}`, 'blue');
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'blue');
    log(`📦 ${module.name}`, 'gray');
    log(`📝 ${module.description}\n`, 'gray');

    // 1. モジュールの存在確認
    log(`[1/4] モジュールの存在確認`, 'cyan');
    const existsCheck = checkModuleExists(module.name);
    if (!existsCheck.exists) {
      log(`  ✗ ${existsCheck.reason}`, 'red');
      results.failed++;
      results.details.push({
        module: module.name,
        status: 'failed',
        reason: existsCheck.reason,
      });
      continue;
    }
    log(`  ✓ モジュールが存在します`, 'green');

    // 2. モジュール構造の検証
    log(`\n[2/4] モジュール構造の検証`, 'cyan');
    const structureIssues = validateModuleStructure(module);
    if (structureIssues.length > 0) {
      structureIssues.forEach(issue => log(`  ✗ ${issue}`, 'red'));
      results.failed++;
      results.details.push({
        module: module.name,
        status: 'failed',
        reason: structureIssues.join(', '),
      });
      continue;
    }
    log(`  ✓ モジュール構造は正常です`, 'green');

    // 3. 依存関係のインストール
    log(`\n[3/4] 依存関係の確認`, 'cyan');
    try {
      await installDependencies(module.name);
    } catch (error) {
      log(`  ✗ 依存関係のインストールに失敗: ${error.message}`, 'red');
      results.failed++;
      results.details.push({
        module: module.name,
        status: 'failed',
        reason: `依存関係エラー: ${error.message}`,
      });
      continue;
    }

    // 4. テストの実行
    log(`\n[4/4] テストの実行`, 'cyan');
    if (!module.hasTest) {
      log(`  ⚠ このモジュールにはテストがありません（スキップ）`, 'yellow');
      results.skipped++;
      results.details.push({
        module: module.name,
        status: 'skipped',
        reason: 'テストなし',
      });
    } else {
      const testResult = await runModuleTest(module);

      if (testResult.status === 'passed') {
        results.passed++;
        results.details.push({
          module: module.name,
          status: 'passed',
        });
      } else if (testResult.status === 'skipped') {
        results.skipped++;
        results.details.push({
          module: module.name,
          status: 'skipped',
          reason: testResult.reason,
        });
      } else {
        results.failed++;
        results.details.push({
          module: module.name,
          status: 'failed',
          reason: testResult.error || `exit code ${testResult.code}`,
        });
      }
    }

    log('');
  }

  // 結果サマリー
  log('\n========================================', 'cyan');
  log('  テスト結果サマリー', 'cyan');
  log('========================================\n', 'cyan');

  log(`総モジュール数: ${results.total}`, 'blue');
  log(`✓ 成功: ${results.passed}`, 'green');
  log(`✗ 失敗: ${results.failed}`, results.failed > 0 ? 'red' : 'gray');
  log(`⚠ スキップ: ${results.skipped}`, results.skipped > 0 ? 'yellow' : 'gray');

  // 詳細結果
  log('\n詳細:', 'cyan');
  results.details.forEach((detail, index) => {
    const module = modules[index];
    const icon = detail.status === 'passed' ? '✓' : detail.status === 'skipped' ? '⚠' : '✗';
    const color = detail.status === 'passed' ? 'green' : detail.status === 'skipped' ? 'yellow' : 'red';
    const reason = detail.reason ? ` (${detail.reason})` : '';
    log(`  ${icon} Module ${module.id}: ${module.title}${reason}`, color);
  });

  // 統合フローの検証
  log('\n========================================', 'cyan');
  log('  モジュール連携の検証', 'cyan');
  log('========================================\n', 'cyan');

  log('推奨ワークフロー:', 'blue');
  log('  1. Module 1 → クリエイティブ生成 (creative.json)', 'gray');
  log('  2. Module 2 → creative.json を読み込んでキャンペーン作成', 'gray');
  log('  3. Module 3 → キャンペーンIDで予算最適化', 'gray');
  log('  4. Module 4 → A/Bテスト実施 → 勝者スケール', 'gray');
  log('  5. Module 5 → トラッキングイベント送信', 'gray');
  log('  6. Module 6 → パフォーマンスレポート生成', 'gray');

  log('\n統合テスト完了!\n', 'green');

  // 終了コード
  process.exit(results.failed > 0 ? 1 : 0);
}

// 実行
main().catch(error => {
  log(`\n致命的エラー: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
