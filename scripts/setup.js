#!/usr/bin/env node
/**
 * Meta広告自動化プロジェクト - セットアップスクリプト
 *
 * 環境変数の検証、依存関係のインストール、動作確認を自動実行
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// カラー出力
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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

function logBright(message) {
  console.log(`${colors.bright}${message}${colors.reset}`);
}

// readline インターフェース
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// 必須環境変数の定義
const REQUIRED_ENV_VARS = {
  meta: {
    META_ACCESS_TOKEN: {
      description: 'Meta Marketing API アクセストークン',
      example: 'EAAxxxxxxxxxxxxx',
      required: true,
    },
    META_AD_ACCOUNT_ID: {
      description: '広告アカウントID',
      example: 'act_1234567890',
      required: true,
    },
    META_PAGE_ID: {
      description: 'Facebook ページID',
      example: '1234567890',
      required: true,
    },
    META_PIXEL_ID: {
      description: 'Facebook Pixel ID',
      example: '1234567890',
      required: true,
    },
    META_TEST_EVENT_CODE: {
      description: 'テストイベントコード（オプション）',
      example: 'TEST12345',
      required: false,
    },
  },
  ai: {
    ANTHROPIC_API_KEY: {
      description: 'Claude API キー（広告コピー生成用）',
      example: 'sk-ant-xxxxxxxx',
      required: true,
    },
    GEMINI_API_KEY: {
      description: 'Gemini API キー（画像生成用）',
      example: 'AIzaSyXXXXXXXX',
      required: true,
    },
  },
};

// モジュール定義
const MODULES = [
  'meta-ad-creative-mcp',
  'meta-campaign-mcp',
  'meta-budget-mcp',
  'meta-experiment-mcp',
  'meta-tracking-mcp',
  'meta-report-mcp',
];

/**
 * 環境変数の読み込み
 */
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach((line) => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    env[key.trim()] = value;
  });

  return env;
}

/**
 * 環境変数の検証
 */
function validateEnv(env) {
  const issues = [];
  const warnings = [];

  // Meta API
  log('\n[1] Meta Marketing API 設定の検証', 'cyan');
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS.meta)) {
    const value = env[key] || process.env[key];
    if (!value && config.required) {
      issues.push(`✗ ${key}: 未設定（${config.description}）`);
      log(`  ✗ ${key}: 未設定`, 'red');
    } else if (!value && !config.required) {
      warnings.push(`⚠ ${key}: 未設定（オプション）`);
      log(`  ⚠ ${key}: 未設定（オプション）`, 'yellow');
    } else {
      log(`  ✓ ${key}: 設定済み`, 'green');
    }
  }

  // AI APIs
  log('\n[2] AI API 設定の検証', 'cyan');
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS.ai)) {
    const value = env[key] || process.env[key];
    if (!value && config.required) {
      issues.push(`✗ ${key}: 未設定（${config.description}）`);
      log(`  ✗ ${key}: 未設定`, 'red');
    } else if (!value && !config.required) {
      warnings.push(`⚠ ${key}: 未設定（オプション）`);
      log(`  ⚠ ${key}: 未設定（オプション）`, 'yellow');
    } else {
      log(`  ✓ ${key}: 設定済み`, 'green');
    }
  }

  // Gemini API キーファイルの確認
  const geminiKeyPath = path.join(__dirname, 'google-flow-mcp', 'apikey.txt');
  if (!fs.existsSync(geminiKeyPath)) {
    issues.push('✗ google-flow-mcp/apikey.txt が存在しません');
    log('  ✗ google-flow-mcp/apikey.txt: 未設定', 'red');
  } else {
    log('  ✓ google-flow-mcp/apikey.txt: 設定済み', 'green');
  }

  return { issues, warnings };
}

/**
 * .env ファイルの作成補助
 */
async function createEnvFile() {
  log('\n.env ファイルを作成します。', 'cyan');
  log('各項目を入力してください（スキップする場合は Enter）\n', 'gray');

  const env = {};

  // Meta API
  log('=== Meta Marketing API ===', 'blue');
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS.meta)) {
    const required = config.required ? '（必須）' : '（オプション）';
    const answer = await question(`${key} ${required}\n  ${config.description}\n  例: ${config.example}\n> `);
    if (answer.trim()) {
      env[key] = answer.trim();
    }
    console.log();
  }

  // AI APIs
  log('=== AI APIs ===', 'blue');
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS.ai)) {
    const required = config.required ? '（必須）' : '（オプション）';
    const answer = await question(`${key} ${required}\n  ${config.description}\n  例: ${config.example}\n> `);
    if (answer.trim()) {
      env[key] = answer.trim();
    }
    console.log();
  }

  // DRY_RUN
  const dryRun = await question('DRY_RUN モードを有効にしますか？ (Y/n): ');
  env.DRY_RUN = (dryRun.toLowerCase() === 'n' ? 'false' : 'true');

  // .env ファイルに書き込み
  const envPath = path.join(__dirname, '.env');
  let content = '# Meta広告自動化プロジェクト - 環境変数\n';
  content += `# 作成日: ${new Date().toISOString()}\n\n`;

  content += '# ===========================================\n';
  content += '# Meta Marketing API\n';
  content += '# ===========================================\n';
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS.meta)) {
    content += `# ${config.description}\n`;
    content += `${key}=${env[key] || ''}\n\n`;
  }

  content += '# ===========================================\n';
  content += '# AI APIs\n';
  content += '# ===========================================\n';
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS.ai)) {
    content += `# ${config.description}\n`;
    content += `${key}=${env[key] || ''}\n\n`;
  }

  content += '# ===========================================\n';
  content += '# オプション設定\n';
  content += '# ===========================================\n';
  content += `DRY_RUN=${env.DRY_RUN}\n`;
  content += 'TZ=Asia/Tokyo\n';

  fs.writeFileSync(envPath, content, 'utf-8');
  log(`\n✓ .env ファイルを作成しました: ${envPath}`, 'green');

  // Gemini API キーファイルも作成
  if (env.GEMINI_API_KEY) {
    const geminiKeyPath = path.join(__dirname, 'google-flow-mcp', 'apikey.txt');
    fs.mkdirSync(path.dirname(geminiKeyPath), { recursive: true });
    fs.writeFileSync(geminiKeyPath, env.GEMINI_API_KEY, 'utf-8');
    log(`✓ google-flow-mcp/apikey.txt を作成しました`, 'green');
  }

  return env;
}

/**
 * モジュールの依存関係をインストール
 */
async function installDependencies() {
  log('\n[3] 依存関係のインストール', 'cyan');

  for (const module of MODULES) {
    const modulePath = path.join(__dirname, module);
    const nodeModulesPath = path.join(modulePath, 'node_modules');

    if (fs.existsSync(nodeModulesPath)) {
      log(`  ✓ ${module}: 既にインストール済み`, 'gray');
      continue;
    }

    log(`  📦 ${module}: インストール中...`, 'cyan');

    try {
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      execSync(`${npm} install`, {
        cwd: modulePath,
        stdio: 'pipe',
      });
      log(`  ✓ ${module}: インストール完了`, 'green');
    } catch (error) {
      log(`  ✗ ${module}: インストール失敗`, 'red');
      return false;
    }
  }

  return true;
}

/**
 * Node.js バージョン確認
 */
function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);

  log('\n[0] システム要件の確認', 'cyan');
  log(`  Node.js: ${version}`, 'gray');

  if (majorVersion < 18) {
    log(`  ✗ Node.js v18.0.0 以上が必要です（現在: ${version}）`, 'red');
    log('  https://nodejs.org/ から最新版をインストールしてください', 'yellow');
    return false;
  }

  log(`  ✓ Node.js バージョン: OK`, 'green');
  return true;
}

/**
 * MCP 設定ファイルの生成
 */
function generateMcpConfig() {
  const projectPath = __dirname.replace(/\\/g, '/');

  const config = {
    mcpServers: {},
  };

  const moduleConfigs = [
    {
      name: 'meta-ad-creative',
      path: 'meta-ad-creative-mcp/index.js',
      env: ['ANTHROPIC_API_KEY', 'GEMINI_API_KEY'],
    },
    {
      name: 'meta-campaign',
      path: 'meta-campaign-mcp/index.js',
      env: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID', 'META_PAGE_ID'],
    },
    {
      name: 'meta-budget',
      path: 'meta-budget-mcp/index.js',
      env: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
    },
    {
      name: 'meta-experiment',
      path: 'meta-experiment-mcp/index.js',
      env: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
    },
    {
      name: 'meta-tracking',
      path: 'meta-tracking-mcp/index.js',
      env: ['META_ACCESS_TOKEN', 'META_PIXEL_ID', 'META_TEST_EVENT_CODE'],
    },
    {
      name: 'meta-report',
      path: 'meta-report-mcp/index.js',
      env: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID'],
    },
  ];

  moduleConfigs.forEach((moduleConfig) => {
    const envVars = {};
    moduleConfig.env.forEach((key) => {
      envVars[key] = `\${${key}}`;
    });

    config.mcpServers[moduleConfig.name] = {
      command: 'node',
      args: [`${projectPath}/${moduleConfig.path}`],
      env: envVars,
    };
  });

  const outputPath = path.join(__dirname, 'mcp-config.json');
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');

  log(`\n✓ MCP設定ファイルを生成しました: ${outputPath}`, 'green');
  log('  このファイルの内容を ~/.claude/settings.json に追加してください', 'yellow');
}

/**
 * メイン処理
 */
async function main() {
  logBright('\n========================================');
  logBright('  Meta広告自動化プロジェクト');
  logBright('  セットアップスクリプト');
  logBright('========================================\n');

  // Node.js バージョン確認
  if (!checkNodeVersion()) {
    process.exit(1);
  }

  // .env ファイルの確認
  let env = loadEnvFile();
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    log('\n.env ファイルが見つかりません。', 'yellow');
    const createNew = await question('新しく作成しますか？ (Y/n): ');

    if (createNew.toLowerCase() !== 'n') {
      env = await createEnvFile();
    } else {
      log('\nセットアップを中断しました。', 'yellow');
      log('手動で .env ファイルを作成してから再実行してください。', 'gray');
      rl.close();
      return;
    }
  }

  // 環境変数の検証
  const { issues, warnings } = validateEnv(env);

  if (issues.length > 0) {
    log('\n❌ 環境変数に不足があります:', 'red');
    issues.forEach((issue) => log(`  ${issue}`, 'red'));
    log('\nSETUP_GUIDE.md を参照して環境変数を設定してください。', 'yellow');

    const continueAnyway = await question('\nそれでも続行しますか？ (y/N): ');
    if (continueAnyway.toLowerCase() !== 'y') {
      rl.close();
      return;
    }
  }

  if (warnings.length > 0) {
    log('\n⚠ 警告:', 'yellow');
    warnings.forEach((warning) => log(`  ${warning}`, 'yellow'));
  }

  // 依存関係のインストール
  const installed = await installDependencies();
  if (!installed) {
    log('\n❌ 依存関係のインストールに失敗しました。', 'red');
    rl.close();
    return;
  }

  // MCP 設定ファイルの生成
  generateMcpConfig();

  // 完了
  log('\n========================================', 'green');
  log('  セットアップ完了！', 'green');
  log('========================================\n', 'green');

  log('次のステップ:', 'cyan');
  log('  1. mcp-config.json の内容を ~/.claude/settings.json に追加', 'gray');
  log('  2. 統合テストを実行: node integration-test.js', 'gray');
  log('  3. Claude Code でツールが利用可能か確認', 'gray');
  log('\n詳細は SETUP_GUIDE.md を参照してください。\n', 'yellow');

  rl.close();
}

// 実行
main().catch((error) => {
  log(`\n致命的エラー: ${error.message}`, 'red');
  console.error(error);
  rl.close();
  process.exit(1);
});
