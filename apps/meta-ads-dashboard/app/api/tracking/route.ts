import { NextRequest, NextResponse } from 'next/server';
import { generateTimestamp, randomChoice, randomInt } from '@/lib/mock-data';
import type { ConversionEvent, EventDiagnostics, PixelCode, StandardEvent, MatchQuality } from '@/lib/types';
import { callMCP, isDemoMode } from '@/lib/mcp-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    if (isDemoMode()) {
      const mockResponse = {
        action,
        params,
        result: {
          status: 'success',
          message: 'デモモード: 実際のAPI呼び出しは行われていません',
          data: generateMockData(action, params),
        },
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(mockResponse);
    }

    const mcpResult = await callMCP('meta-tracking-mcp', action, params);

    if (!mcpResult.success) {
      return NextResponse.json(
        {
          action,
          params,
          result: {
            status: 'error',
            message: mcpResult.error?.message || 'MCP呼び出しに失敗しました',
            error: mcpResult.error,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      action,
      params,
      result: {
        status: 'success',
        message: 'MCP経由で実行されました',
        data: mcpResult.data,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateMockData(action: string, params: any) {
  switch (action) {
    case 'setup_check':
      return generateSetupCheck();

    case 'send_event':
      return generateSendEvent(params);

    case 'send_batch_events':
      return generateSendBatchEvents(params);

    case 'get_pixel_code':
      return generatePixelCode(params);

    case 'get_event_diagnostics':
      return generateEventDiagnostics(params);

    default:
      return { message: 'アクションが実装されていません' };
  }
}

// ===== Tool 1: setup_check =====

function generateSetupCheck(): {
  pixel_setup: {
    pixel_id: string;
    pixel_installed: boolean;
    events_detected: number;
    last_event_time: string;
  };
  capi_setup: {
    access_token_configured: boolean;
    test_event_code: string;
  };
  recommendations: string[];
} {
  return {
    pixel_setup: {
      pixel_id: process.env.META_PIXEL_ID || '1234567890',
      pixel_installed: true,
      events_detected: randomInt(50, 500),
      last_event_time: generateTimestamp(0),
    },
    capi_setup: {
      access_token_configured: true,
      test_event_code: process.env.META_TEST_EVENT_CODE || 'TEST12345',
    },
    recommendations: [
      '✅ Pixel と Conversions API が正しく設定されています',
      '💡 イベント重複排除のため event_id を必ず設定してください',
      '🔒 ユーザーデータは自動的にSHA-256でハッシュ化されます',
      '📊 マッチ品質を向上させるため、できるだけ多くのユーザーデータを送信しましょう',
      '🧪 本番配信前に Test Events Tool で動作確認することを推奨します',
    ],
  };
}

// ===== Tool 2: send_event =====

function generateSendEvent(params: any): {
  event_id: string;
  event_name: StandardEvent | string;
  event_time: number;
  match_quality: MatchQuality;
  matched_parameters: number;
  total_parameters: number;
  deduplication: {
    event_id_set: boolean;
    pixel_also_sending: boolean;
    deduplicated: boolean;
  };
  test_mode: boolean;
} {
  const eventName: StandardEvent = params.event_name || 'Purchase';
  const eventId = params.event_id || `evt_${Date.now()}_${randomInt(1000, 9999)}`;
  const eventTime = params.event_time || Math.floor(Date.now() / 1000);

  // ユーザーデータのパラメータ数をカウント
  const userData = params.user_data || {};
  const totalParams = 15; // 最大パラメータ数
  const providedParams = Object.keys(userData).filter((key) => userData[key]).length;
  const matchedParams = Math.min(providedParams, 10); // 実際にマッチしたパラメータ数

  // マッチ品質を計算（A-D）
  let matchQuality: MatchQuality;
  if (matchedParams >= 8) matchQuality = 'A';
  else if (matchedParams >= 5) matchQuality = 'B';
  else if (matchedParams >= 3) matchQuality = 'C';
  else matchQuality = 'D';

  return {
    event_id: eventId,
    event_name: eventName,
    event_time: eventTime,
    match_quality: matchQuality,
    matched_parameters: matchedParams,
    total_parameters: totalParams,
    deduplication: {
      event_id_set: !!params.event_id,
      pixel_also_sending: true,
      deduplicated: !!params.event_id,
    },
    test_mode: !!params.test_event_code,
  };
}

// ===== Tool 3: send_batch_events =====

function generateSendBatchEvents(params: any): {
  batch_size: number;
  events_sent: number;
  events_failed: number;
  average_match_quality: MatchQuality;
  deduplication_rate: number;
  processing_time_ms: number;
  errors: Array<{ event_index: number; error_message: string }>;
} {
  const events = params.events || [];
  const batchSize = events.length || 10;
  const failedCount = Math.floor(batchSize * 0.05); // 5%失敗
  const sentCount = batchSize - failedCount;

  // 重複排除率（event_id設定率）
  const eventsWithId = events.filter((e: any) => e.event_id).length;
  const deduplicationRate = batchSize > 0 ? (eventsWithId / batchSize) * 100 : 80;

  // 平均マッチ品質
  const qualities: MatchQuality[] = ['A', 'B', 'C', 'D'];
  const avgQuality = randomChoice(qualities);

  // エラー
  const errors = Array.from({ length: failedCount }, (_, i) => ({
    event_index: randomInt(0, batchSize - 1),
    error_message: randomChoice([
      'Invalid user data format',
      'Missing required field: event_name',
      'Invalid event_time (future timestamp)',
      'Malformed email hash',
    ]),
  }));

  return {
    batch_size: batchSize,
    events_sent: sentCount,
    events_failed: failedCount,
    average_match_quality: avgQuality,
    deduplication_rate: parseFloat(deduplicationRate.toFixed(2)),
    processing_time_ms: randomInt(50, 300),
    errors,
  };
}

// ===== Tool 4: get_pixel_code =====

function generatePixelCode(params: any): { pixel_code: PixelCode } {
  const pixelId = params.pixel_id || process.env.META_PIXEL_ID || '1234567890';
  const eventName: StandardEvent = params.event_name || 'Purchase';

  const baseCode = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->`;

  const eventSnippet = `<!-- ${eventName} Event -->
<script>
fbq('track', '${eventName}', {
  value: 29.99,
  currency: 'JPY',
  content_ids: ['product_123'],
  content_type: 'product'
}, {
  eventID: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(7)
});
</script>`;

  const capiHandler = `// Conversions API Handler (Node.js)
const crypto = require('crypto');

function hashUserData(data) {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

async function sendConversionEvent(eventData) {
  const pixelId = '${pixelId}';
  const accessToken = process.env.META_ACCESS_TOKEN;

  const payload = {
    data: [{
      event_name: eventData.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventData.event_id, // 重複排除用
      action_source: 'website',
      user_data: {
        em: hashUserData(eventData.email),
        ph: hashUserData(eventData.phone),
        client_ip_address: eventData.ip,
        client_user_agent: eventData.userAgent,
        fbc: eventData.fbc, // _fbc cookie
        fbp: eventData.fbp, // _fbp cookie
      },
      custom_data: eventData.custom_data || {}
    }]
  };

  const response = await fetch(
    \`https://graph.facebook.com/v25.0/\${pixelId}/events\`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, access_token: accessToken })
    }
  );

  return response.json();
}

module.exports = { sendConversionEvent };`;

  const gtmTag = `// Google Tag Manager - Meta Pixel Tag
// Tag Type: Custom HTML
// Trigger: All Pages

<script>
  (function() {
    // Pixel Base Code
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){
        n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)
      };
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '${pixelId}');
    fbq('track', 'PageView');

    // Enhanced Conversion Tracking
    window.fbq = fbq;
  })();
</script>

<!-- Trigger: Purchase Page -->
<script>
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'metaPixelPurchase',
    'ecommerce': {
      'purchase': {
        'actionField': {
          'id': '{{Transaction ID}}',
          'revenue': '{{Transaction Total}}'
        }
      }
    }
  });

  fbq('track', 'Purchase', {
    value: {{Transaction Total}},
    currency: 'JPY'
  }, {
    eventID: 'evt_{{Transaction ID}}_' + Date.now()
  });
</script>`;

  const pixelCode: PixelCode = {
    base_code: baseCode,
    event_snippet: eventSnippet,
    capi_handler: capiHandler,
    gtm_tag: gtmTag,
  };

  return { pixel_code: pixelCode };
}

// ===== Tool 5: get_event_diagnostics =====

function generateEventDiagnostics(params: any): { diagnostics: EventDiagnostics } {
  const pixelId = params.pixel_id || process.env.META_PIXEL_ID || '1234567890';
  const eventCount = randomInt(100, 1000);
  const matchedParams = randomInt(5, 12);
  const totalParams = 15;

  // マッチ品質
  let matchQuality: MatchQuality;
  if (matchedParams >= 10) matchQuality = 'A';
  else if (matchedParams >= 7) matchQuality = 'B';
  else if (matchedParams >= 4) matchQuality = 'C';
  else matchQuality = 'D';

  const issues: string[] = [];
  const recommendations: string[] = [];

  // 問題点の生成
  if (matchedParams < 7) {
    issues.push('ユーザーデータのマッチング率が低い（推奨: 7個以上）');
    recommendations.push('📧 メールアドレスと電話番号の送信を必ず含めてください');
  }

  if (Math.random() < 0.3) {
    issues.push('一部のイベントでevent_idが設定されていません');
    recommendations.push('🔄 Pixel と CAPI の重複排除のため、必ず event_id を設定してください');
  }

  if (Math.random() < 0.2) {
    issues.push('未来のタイムスタンプが検出されました');
    recommendations.push('⏰ event_time は必ず過去の時刻（Unixタイムスタンプ）を設定してください');
  }

  if (issues.length === 0) {
    issues.push('問題は検出されませんでした');
    recommendations.push('✅ イベントトラッキングは正常に動作しています');
  }

  recommendations.push('📊 マッチ品質を向上させるため、氏名・住所情報も追加することを検討してください');
  recommendations.push('🧪 Test Events Tool（https://business.facebook.com/events_manager）で動作確認しましょう');

  const diagnostics: EventDiagnostics = {
    pixel_id: pixelId,
    event_count: eventCount,
    match_quality: matchQuality,
    matched_parameters: matchedParams,
    total_parameters: totalParams,
    issues,
    recommendations,
  };

  return { diagnostics };
}
