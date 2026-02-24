import { NextRequest, NextResponse } from 'next/server';
import {
  generateCampaignId,
  generateAdSetId,
  generateAdId,
  generateCurlPreview,
  generateTimestamp,
  randomChoice,
  DUMMY_CAMPAIGN_NAMES,
  DUMMY_ADSET_NAMES,
  DUMMY_AD_NAMES,
} from '@/lib/mock-data';
import type { Campaign, AdSet, Ad, SetupCheck, CampaignObjective, CampaignStatus } from '@/lib/types';

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateMockData(action: string, params: any) {
  switch (action) {
    case 'setup_check':
      return generateSetupCheck();

    case 'create_campaign':
      return generateCreateCampaign(params);

    case 'create_full_campaign':
      return generateFullCampaign(params);

    case 'get_campaign_status':
      return generateCampaignStatus(params);

    case 'set_campaign_status':
      return generateSetCampaignStatus(params);

    default:
      return { message: 'アクションが実装されていません' };
  }
}

// ===== Tool 1: setup_check =====

function generateSetupCheck(): { check: SetupCheck } {
  return {
    check: {
      env_vars: {
        META_ACCESS_TOKEN: true,
        META_AD_ACCOUNT_ID: true,
        META_PAGE_ID: true,
      },
      recommendations: [
        '✅ 環境変数は正しく設定されています',
        '💡 本番環境では System User Token の使用を推奨します',
        '📘 dry_run=true がデフォルトで有効です（安全モード）',
      ],
    },
  };
}

// ===== Tool 2: create_campaign =====

function generateCreateCampaign(params: any): {
  campaign: Campaign;
  curl_preview: string;
  dry_run: boolean;
} {
  const campaignId = generateCampaignId();
  const campaignName = params.campaign_name || randomChoice(DUMMY_CAMPAIGN_NAMES);
  const objective: CampaignObjective = params.objective || 'sales';
  const dailyBudget = params.daily_budget || 5000;

  const campaign: Campaign = {
    id: campaignId,
    name: campaignName,
    objective,
    status: 'PAUSED',
    daily_budget: dailyBudget,
    special_ad_categories: params.special_ad_categories || [],
    created_time: generateTimestamp(),
  };

  const curlParams = {
    name: campaignName,
    objective: objective.toUpperCase(),
    status: 'PAUSED',
    special_ad_categories: params.special_ad_categories || [],
    daily_budget: dailyBudget * 100, // JPYセント単位
  };

  const curlPreview = generateCurlPreview(
    `act_${process.env.META_AD_ACCOUNT_ID || '0000000000'}/campaigns`,
    'POST',
    curlParams
  );

  return {
    campaign,
    curl_preview: curlPreview,
    dry_run: params.dry_run !== false,
  };
}

// ===== Tool 3: create_full_campaign =====

function generateFullCampaign(params: any): {
  campaign: Campaign;
  adset: AdSet;
  ad: Ad;
  creative_input: any;
  curl_previews: {
    campaign: string;
    adset: string;
    ad: string;
  };
  dry_run: boolean;
} {
  const campaignId = generateCampaignId();
  const adsetId = generateAdSetId();
  const adId = generateAdId();
  const campaignName = params.campaign_name || randomChoice(DUMMY_CAMPAIGN_NAMES);
  const objective: CampaignObjective = params.objective || 'sales';
  const dailyBudget = params.daily_budget || 5000;

  // キャンペーン作成
  const campaign: Campaign = {
    id: campaignId,
    name: campaignName,
    objective,
    status: 'PAUSED',
    daily_budget: dailyBudget,
    created_time: generateTimestamp(),
  };

  // 広告セット作成
  const adset: AdSet = {
    id: adsetId,
    name: params.adset_name || randomChoice(DUMMY_ADSET_NAMES),
    campaign_id: campaignId,
    status: 'PAUSED',
    daily_budget: dailyBudget,
    optimization_goal: 'OFFSITE_CONVERSIONS',
    billing_event: 'IMPRESSIONS',
  };

  // 広告作成
  const ad: Ad = {
    id: adId,
    name: params.ad_name || randomChoice(DUMMY_AD_NAMES),
    adset_id: adsetId,
    status: 'PAUSED',
    creative: {
      image_url: params.creative_input?.image_url || 'https://example.com/image.jpg',
      body: params.creative_input?.copy?.primary_text || 'デモ広告本文',
      link_url: params.link_url || 'https://example.com',
    },
  };

  return {
    campaign,
    adset,
    ad,
    creative_input: params.creative_input || null,
    curl_previews: {
      campaign: generateCurlPreview(
        `act_${process.env.META_AD_ACCOUNT_ID || '0000000000'}/campaigns`,
        'POST',
        { name: campaignName, objective: objective.toUpperCase(), status: 'PAUSED' }
      ),
      adset: generateCurlPreview(`act_${process.env.META_AD_ACCOUNT_ID || '0000000000'}/adsets`, 'POST', {
        name: adset.name,
        campaign_id: campaignId,
        optimization_goal: 'OFFSITE_CONVERSIONS',
      }),
      ad: generateCurlPreview(`act_${process.env.META_AD_ACCOUNT_ID || '0000000000'}/ads`, 'POST', {
        name: ad.name,
        adset_id: adsetId,
      }),
    },
    dry_run: params.dry_run !== false,
  };
}

// ===== Tool 4: get_campaign_status =====

function generateCampaignStatus(params: any): {
  campaign_id: string;
  status: CampaignStatus;
  name: string;
  objective: CampaignObjective;
  daily_budget: number;
  lifetime_spend: number;
  effective_status: string;
} {
  return {
    campaign_id: params.campaign_id || generateCampaignId(),
    status: params.expected_status || 'ACTIVE',
    name: randomChoice(DUMMY_CAMPAIGN_NAMES),
    objective: 'sales',
    daily_budget: 5000,
    lifetime_spend: 125000,
    effective_status: 'ACTIVE',
  };
}

// ===== Tool 5: set_campaign_status =====

function generateSetCampaignStatus(params: any): {
  campaign_id: string;
  previous_status: CampaignStatus;
  new_status: CampaignStatus;
  updated_time: string;
  curl_preview: string;
  dry_run: boolean;
} {
  const campaignId = params.campaign_id || generateCampaignId();
  const newStatus: CampaignStatus = params.status || 'ACTIVE';

  return {
    campaign_id: campaignId,
    previous_status: 'PAUSED',
    new_status: newStatus,
    updated_time: generateTimestamp(),
    curl_preview: generateCurlPreview(campaignId, 'POST', { status: newStatus }),
    dry_run: params.dry_run !== false,
  };
}
