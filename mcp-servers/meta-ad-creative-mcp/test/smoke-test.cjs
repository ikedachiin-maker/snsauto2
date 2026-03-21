#!/usr/bin/env node
/**
 * meta-ad-creative-mcp - スモークテスト
 *
 * クリエイティブ自動生成モジュールの基本動作確認
 */

const fs = require('fs');
const path = require('path');

// カラー出力
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// テスト結果
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    log(`✓ ${name}`, 'green');
    passed++;
  } catch (error) {
    log(`✗ ${name}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    failed++;
  }
}

// メイン処理
async function main() {
  log('\n=== meta-ad-creative-mcp スモークテスト ===\n', 'cyan');

  // 1. ディレクトリ構造の検証
  log('[1] ディレクトリ構造の検証', 'cyan');

  test('index.js が存在する', () => {
    const indexPath = path.join(__dirname, '..', 'index.js');
    if (!fs.existsSync(indexPath)) {
      throw new Error('index.js not found');
    }
  });

  test('lib/ ディレクトリが存在する', () => {
    const libPath = path.join(__dirname, '..', 'lib');
    if (!fs.existsSync(libPath) || !fs.statSync(libPath).isDirectory()) {
      throw new Error('lib/ directory not found');
    }
  });

  test('templates/ ディレクトリが存在する', () => {
    const templatesPath = path.join(__dirname, '..', 'templates');
    if (!fs.existsSync(templatesPath) || !fs.statSync(templatesPath).isDirectory()) {
      throw new Error('templates/ directory not found');
    }
  });

  test('package.json が存在する', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    if (!fs.existsSync(packagePath)) {
      throw new Error('package.json not found');
    }
  });

  // 2. 必須ファイルの検証
  log('\n[2] 必須ファイルの検証', 'cyan');

  const requiredLibFiles = [
    'gemini-client.js',
    'claude-client.js',
    'templates.js',
    'output-manager.js',
  ];

  requiredLibFiles.forEach((file) => {
    test(`lib/${file} が存在する`, () => {
      const filePath = path.join(__dirname, '..', 'lib', file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`lib/${file} not found`);
      }
    });
  });

  // 3. テンプレートの検証
  log('\n[3] テンプレートの検証', 'cyan');

  test('templates/prompts/ ディレクトリが存在する', () => {
    const promptsPath = path.join(__dirname, '..', 'templates', 'prompts');
    if (!fs.existsSync(promptsPath) || !fs.statSync(promptsPath).isDirectory()) {
      throw new Error('templates/prompts/ directory not found');
    }
  });

  // 4. package.json の検証
  log('\n[4] package.json の検証', 'cyan');

  test('package.json が有効なJSON', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const content = fs.readFileSync(packagePath, 'utf-8');
    JSON.parse(content); // パースできればOK
  });

  test('package.json に必須フィールドがある', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    if (!pkg.name) throw new Error('name field missing');
    if (!pkg.version) throw new Error('version field missing');
    if (!pkg.dependencies) throw new Error('dependencies field missing');
  });

  // 5. 依存関係の検証
  log('\n[5] 依存関係の検証', 'cyan');

  test('node_modules/ が存在する', () => {
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error('node_modules/ not found - run npm install');
    }
  });

  test('@modelcontextprotocol/sdk がインストール済み', () => {
    const sdkPath = path.join(__dirname, '..', 'node_modules', '@modelcontextprotocol', 'sdk');
    if (!fs.existsSync(sdkPath)) {
      throw new Error('@modelcontextprotocol/sdk not installed');
    }
  });

  // 6. モジュールの読み込みテスト
  log('\n[6] モジュールの読み込みテスト', 'cyan');

  test('templates.js が読み込める', () => {
    const templates = require('../lib/templates');
    if (!templates) throw new Error('templates module failed to load');
  });

  test('output-manager.js が読み込める', () => {
    const outputManager = require('../lib/output-manager');
    if (!outputManager) throw new Error('output-manager module failed to load');
  });

  test('gemini-client.js が読み込める', () => {
    const geminiClient = require('../lib/gemini-client');
    if (!geminiClient) throw new Error('gemini-client module failed to load');
  });

  test('claude-client.js が読み込める', () => {
    const claudeClient = require('../lib/claude-client');
    if (!claudeClient) throw new Error('claude-client module failed to load');
  });

  // 7. templates.js の内容確認
  log('\n[7] templates.js の内容確認', 'cyan');

  test('templates.js にexportがある', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'templates.js'), 'utf-8');
    if (!content.includes('export')) {
      throw new Error('templates.js should use ES module exports');
    }
  });

  test('templates.js に AD_FORMATS が定義されている', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'templates.js'), 'utf-8');
    if (!content.includes('AD_FORMATS')) {
      throw new Error('AD_FORMATS not defined in templates.js');
    }
  });

  test('templates.js に4つの広告フォーマットが定義されている', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'templates.js'), 'utf-8');
    const expectedFormats = ['feed_square', 'feed_portrait', 'story', 'carousel'];

    expectedFormats.forEach((format) => {
      if (!content.includes(format)) {
        throw new Error(`Missing format: ${format}`);
      }
    });
  });

  // 9. 出力ディレクトリの検証
  log('\n[9] 出力ディレクトリの検証', 'cyan');

  test('output/ ディレクトリが存在するか作成可能', () => {
    const outputPath = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputPath)) {
      // 作成できるかテスト
      fs.mkdirSync(outputPath, { recursive: true });
      fs.rmdirSync(outputPath); // テスト後削除
    }
  });

  // 10. 出力マネージャーの検証
  log('\n[10] 出力マネージャーの検証', 'cyan');

  test('output-manager.js にexportがある', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'output-manager.js'), 'utf-8');
    if (!content.includes('export') && !content.includes('module.exports')) {
      throw new Error('output-manager.js should have exports');
    }
  });

  test('output-manager.js にクラスまたは関数定義がある', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'output-manager.js'), 'utf-8');
    if (!content.includes('class ') && !content.includes('function ')) {
      throw new Error('output-manager.js should define a class or function');
    }
  });

  // 結果サマリー
  log('\n=== テスト結果 ===', 'cyan');
  log(`✓ 成功: ${passed}`, 'green');
  log(`✗ 失敗: ${failed}`, failed > 0 ? 'red' : 'green');

  if (failed === 0) {
    log('\n✓ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n✗ Some tests failed.', 'red');
    process.exit(1);
  }
}

// 実行
main().catch((error) => {
  log(`\n致命的エラー: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
