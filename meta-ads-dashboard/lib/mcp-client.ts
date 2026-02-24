import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

/**
 * MCPサーバーの種類
 */
export type MCPServer =
  | 'meta-ad-creative-mcp'
  | 'meta-campaign-mcp'
  | 'meta-budget-mcp'
  | 'meta-experiment-mcp'
  | 'meta-tracking-mcp'
  | 'meta-report-mcp';

/**
 * MCP呼び出し結果
 */
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

/**
 * MCPサーバーを呼び出す
 *
 * @param server MCPサーバー名
 * @param tool ツール名（アクション名）
 * @param params パラメータ
 * @returns MCP実行結果
 */
export async function callMCP<T = any>(
  server: MCPServer,
  tool: string,
  params: Record<string, any> = {}
): Promise<MCPResponse<T>> {
  try {
    // MCPサーバーのパスを解決
    const projectRoot = path.join(process.cwd(), '..');
    const serverPath = path.join(projectRoot, server);

    // パラメータをJSON文字列化（エスケープ処理）
    const paramsJson = JSON.stringify(params).replace(/"/g, '\\"');

    // MCP CLIコマンドを構築
    const command = `npx @modelcontextprotocol/cli call "${serverPath}" ${tool} "${paramsJson}"`;

    console.log('[MCP] Calling:', { server, tool, params });

    // コマンド実行
    const { stdout, stderr } = await execPromise(command, {
      cwd: projectRoot,
      timeout: 60000, // 60秒タイムアウト
    });

    // stderrがある場合は警告として記録
    if (stderr) {
      console.warn('[MCP] Warning:', stderr);
    }

    // 結果をパース
    const result = JSON.parse(stdout);

    console.log('[MCP] Success:', { server, tool, resultKeys: Object.keys(result) });

    return {
      success: true,
      data: result,
    };

  } catch (error: any) {
    console.error('[MCP] Error:', {
      server,
      tool,
      error: error.message,
      stderr: error.stderr,
      stdout: error.stdout,
    });

    // エラーメッセージを解析
    let errorMessage = error.message;
    let errorCode = 'UNKNOWN_ERROR';

    // stdoutにJSONエラーがある場合はパース
    if (error.stdout) {
      try {
        const errorData = JSON.parse(error.stdout);
        if (errorData.error) {
          errorMessage = errorData.error.message || errorMessage;
          errorCode = errorData.error.code || errorCode;
        }
      } catch {
        // パースエラーは無視
      }
    }

    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        details: {
          stderr: error.stderr,
          stdout: error.stdout,
        },
      },
    };
  }
}

/**
 * デモモードかどうかを判定
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== 'false';
}

/**
 * 必要な環境変数をチェック
 */
export function checkEnvironmentVariables(requiredVars: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
