import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    // デモモード: 実際のMCP呼び出しの代わりにモックデータを返す
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function generateMockData(action: string, params: any) {
  switch (action) {
    case 'list_templates':
      return {
        templates: [
          {
            id: 'discount',
            name: '割引・キャンペーン訴求',
            description: '具体的な割引率や限定性を強調',
            best_for: 'セール、期間限定オファー、クーポン配布',
          },
          {
            id: 'urgency',
            name: '緊急性・希少性訴求',
            description: '数量・時間の制限で行動を促す',
            best_for: '在庫限り、タイムセール、先着特典',
          },
          {
            id: 'benefit',
            name: 'ベネフィット訴求',
            description: '商品・サービスの具体的なメリットを強調',
            best_for: '機能訴求、問題解決型商品',
          },
          {
            id: 'social_proof',
            name: '社会的証明',
            description: 'レビュー、実績、利用者数で信頼性を訴求',
            best_for: 'BtoC商品、サービス、アプリ',
          },
          {
            id: 'storytelling',
            name: 'ストーリー型',
            description: '体験談やビフォーアフターで共感を生む',
            best_for: 'ライフスタイル商品、変化を感じる商品',
          },
        ],
      };

    case 'generate_ad_copy':
      return {
        copy: {
          headline: `【期間限定】${params.product_name || '特別オファー'}`,
          primary_text: `${params.key_message || '今だけのチャンス'}。${params.target_audience || 'あなた'}にぴったりの商品をご用意しました。`,
          description: '送料無料・即日発送',
          cta: '今すぐチェック',
        },
        template: params.template_id,
        format: params.ad_format,
      };

    case 'generate_ad_image':
      return {
        image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiM0Mjg1RjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gSW1hZ2U8L3RleHQ+PC9zdmc+',
        format: params.ad_format || 'feed_square',
        aspect_ratio: '1:1',
        pixels: '1080x1080',
      };

    case 'generate_ad_creative':
      return {
        creative: {
          image_url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDgwIiBoZWlnaHQ9IjEwODAiIGZpbGw9IiM0Mjg1RjQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gSW1hZ2U8L3RleHQ+PC9zdmc+',
          copy: {
            headline: `【期間限定】${params.product_name || '特別オファー'}`,
            primary_text: `${params.key_message || '今だけのチャンス'}。`,
            description: '送料無料・即日発送',
            cta: '今すぐチェック',
          },
          format: params.ad_format || 'feed_square',
          template: params.template_id,
        },
        campaign_id: params.campaign_id,
        output_path: `output/${params.campaign_id}/demo/creative.json`,
      };

    default:
      return { message: 'アクションが実装されていません' };
  }
}
