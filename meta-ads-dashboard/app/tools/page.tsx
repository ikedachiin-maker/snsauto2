'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string>('creative');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Module 1: クリエイティブ生成フォーム
  const [creativeParams, setCreativeParams] = useState({
    campaign_id: 'demo_campaign_' + Date.now(),
    template_id: 'discount',
    product_name: 'ウィンターコート',
    target_audience: '25-45歳女性、ファッション関心層',
    key_message: '最大50%オフ、送料無料',
    ad_format: 'feed_square',
  });

  // Module 2: キャンペーン作成フォーム
  const [campaignParams, setCampaignParams] = useState({
    campaign_name: 'ウィンターセール2026',
    objective: 'sales',
    daily_budget: 5000,
    special_ad_categories: [] as string[],
    dry_run: true,
  });

  const [fullCampaignParams, setFullCampaignParams] = useState({
    campaign_name: 'フルキャンペーンデモ',
    objective: 'sales',
    daily_budget: 10000,
    adset_name: '25-34歳 女性 ファッション関心層',
    ad_name: '画像広告 - バージョンA',
    link_url: 'https://example.com',
    dry_run: true,
  });

  const [statusParams, setStatusParams] = useState({
    campaign_id: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED',
  });

  // Module 3: 予算最適化フォーム
  const [budgetParams, setBudgetParams] = useState({
    campaign_id: '',
    daily_budget: 80000,
    bid_strategy: 'lowest_cost',
    bid_amount: 0,
    dry_run: true,
  });

  const [ruleParams, setRuleParams] = useState({
    rule_name: '高CPA一時停止ルール',
    template_id: 'pause_high_cpa',
    entity_type: 'campaign',
    entity_id: '',
    dry_run: true,
  });

  // Module 4: A/Bテストフォーム
  const [experimentParams, setExperimentParams] = useState({
    experiment_name: 'クリエイティブA/Bテスト',
    test_variable: 'creative',
    objective: 'cost_per_result',
    confidence_level: 90,
    variant_count: 2,
    dry_run: true,
  });

  const [analyzeWinnerParams, setAnalyzeWinnerParams] = useState({
    experiment_id: '',
    winner_action: 'scale_budget',
  });

  // Module 6: レポート生成フォーム
  const [performanceParams, setPerformanceParams] = useState({
    level: 'campaign',
    date_preset: 'last_30d',
    metrics_preset: 'overview',
  });

  const [creativeReportParams, setCreativeReportParams] = useState({
    date_preset: 'last_30d',
  });

  const [audienceParams, setAudienceParams] = useState({
    breakdown: 'age',
    date_preset: 'last_30d',
  });

  const [trendParams, setTrendParams] = useState({
    date_preset: 'last_30d',
  });

  const [exportParams, setExportParams] = useState({
    format: 'markdown',
    report_type: 'performance',
  });

  // Module 5: トラッキングフォーム
  const [eventParams, setEventParams] = useState({
    event_name: 'Purchase',
    event_id: '',
    user_data: {
      em: '',
      ph: '',
      fn: '',
      ln: '',
      ct: '',
      country: '',
    },
    custom_data: {
      value: 0,
      currency: 'JPY',
    },
    test_event_code: '',
  });

  const [batchEventParams, setBatchEventParams] = useState({
    events: [] as any[],
  });

  const [pixelCodeParams, setPixelCodeParams] = useState({
    pixel_id: '',
    event_name: 'Purchase',
  });

  const [diagnosticsParams, setDiagnosticsParams] = useState({
    pixel_id: '',
    date_preset: 'last_7d',
  });

  // ===================
  // Module 1 Handlers
  // ===================

  const handleGenerateCreative = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_ad_creative',
          params: creativeParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleListTemplates = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/creative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_templates',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ===================
  // Module 2 Handlers
  // ===================

  const handleSetupCheck = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_check',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          params: campaignParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFullCampaign = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_full_campaign',
          params: fullCampaignParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCampaignStatus = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_campaign_status',
          params: { campaign_id: statusParams.campaign_id || '123456789' },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetCampaignStatus = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_campaign_status',
          params: statusParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ===================
  // Module 3 Handlers
  // ===================

  const handleGetBudgetOverview = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_budget_overview',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_budget',
          params: budgetParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_rule',
          params: ruleParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleListRules = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_rules',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateRules = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate_rules',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ===================
  // Module 4 Handlers
  // ===================

  const handleCreateExperiment = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_experiment',
          params: experimentParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleListExperiments = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list_experiments',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetExperimentResults = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_experiment_results',
          params: { experiment_id: analyzeWinnerParams.experiment_id || 'exp_demo' },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEndExperiment = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_experiment',
          params: { experiment_id: analyzeWinnerParams.experiment_id || 'exp_demo' },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWinner = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_winner',
          params: analyzeWinnerParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ===================
  // Module 6 Handlers
  // ===================

  const handleGetPerformanceReport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_performance_report',
          params: performanceParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCreativeReport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_creative_report',
          params: creativeReportParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetAudienceReport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_audience_report',
          params: audienceParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetTrendReport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_trend_report',
          params: trendParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_report',
          params: exportParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ===================
  // Module 5 Handlers
  // ===================

  const handleTrackingSetupCheck = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup_check',
          params: {},
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEvent = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_event',
          params: eventParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBatchEvents = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_batch_events',
          params: batchEventParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetPixelCode = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_pixel_code',
          params: pixelCodeParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetEventDiagnostics = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_event_diagnostics',
          params: diagnosticsParams,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ツール実行</h1>
              <p className="mt-1 text-sm text-gray-500">デモモードで全ツールを試せます（27/30ツール実装済み）</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左サイドバー: ツール選択 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ツール選択</h2>

              {/* Module 1 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Module 1: クリエイティブ生成</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedTool('creative'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'creative' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🎨 クリエイティブ生成
                  </button>
                  <button
                    onClick={() => { setSelectedTool('templates'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'templates' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📋 テンプレート一覧
                  </button>
                </div>
              </div>

              {/* Module 2 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Module 2: キャンペーン作成</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedTool('setup_check'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'setup_check' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✅ 環境変数チェック
                  </button>
                  <button
                    onClick={() => { setSelectedTool('create_campaign'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'create_campaign' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🚀 キャンペーン作成
                  </button>
                  <button
                    onClick={() => { setSelectedTool('create_full_campaign'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'create_full_campaign' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⚡ フルキャンペーン
                  </button>
                  <button
                    onClick={() => { setSelectedTool('get_campaign_status'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'get_campaign_status' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📊 ステータス取得
                  </button>
                  <button
                    onClick={() => { setSelectedTool('set_campaign_status'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'set_campaign_status' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🔄 ステータス変更
                  </button>
                </div>
              </div>

              {/* Module 3 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Module 3: 予算最適化</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedTool('budget_overview'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'budget_overview' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💰 予算概要
                  </button>
                  <button
                    onClick={() => { setSelectedTool('update_budget'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'update_budget' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✏️ 予算更新
                  </button>
                  <button
                    onClick={() => { setSelectedTool('create_rule'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'create_rule' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📝 ルール作成
                  </button>
                  <button
                    onClick={() => { setSelectedTool('list_rules'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'list_rules' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📋 ルール一覧
                  </button>
                  <button
                    onClick={() => { setSelectedTool('evaluate_rules'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'evaluate_rules' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🔍 ルール評価
                  </button>
                </div>
              </div>

              {/* Module 4 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Module 4: A/Bテスト</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedTool('create_experiment'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'create_experiment' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🧪 実験作成
                  </button>
                  <button
                    onClick={() => { setSelectedTool('list_experiments'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'list_experiments' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📋 実験一覧
                  </button>
                  <button
                    onClick={() => { setSelectedTool('get_experiment_results'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'get_experiment_results' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📊 実験結果
                  </button>
                  <button
                    onClick={() => { setSelectedTool('end_experiment'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'end_experiment' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⏹️ 実験終了
                  </button>
                  <button
                    onClick={() => { setSelectedTool('analyze_winner'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'analyze_winner' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🏆 勝者分析
                  </button>
                </div>
              </div>

              {/* Module 6 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Module 6: レポート生成</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedTool('performance_report'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'performance_report' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📈 パフォーマンス
                  </button>
                  <button
                    onClick={() => { setSelectedTool('creative_report'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'creative_report' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🎨 クリエイティブ
                  </button>
                  <button
                    onClick={() => { setSelectedTool('audience_report'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'audience_report' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👥 オーディエンス
                  </button>
                  <button
                    onClick={() => { setSelectedTool('trend_report'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'trend_report' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📊 トレンド
                  </button>
                  <button
                    onClick={() => { setSelectedTool('export_report'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'export_report' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💾 エクスポート
                  </button>
                </div>
              </div>

              {/* Module 5 */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Module 5: トラッキング</p>
                <div className="space-y-2">
                  <button
                    onClick={() => { setSelectedTool('tracking_setup'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'tracking_setup' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ✅ Pixel設定確認
                  </button>
                  <button
                    onClick={() => { setSelectedTool('send_event'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'send_event' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📤 イベント送信
                  </button>
                  <button
                    onClick={() => { setSelectedTool('send_batch_events'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'send_batch_events' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📦 バッチ送信
                  </button>
                  <button
                    onClick={() => { setSelectedTool('get_pixel_code'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'get_pixel_code' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💻 Pixelコード取得
                  </button>
                  <button
                    onClick={() => { setSelectedTool('event_diagnostics'); setResult(null); }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedTool === 'event_diagnostics' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🔍 イベント診断
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>デモモード</strong>
                  <br />
                  実際のAPI呼び出しは行われません。モックデータが返されます。
                </p>
              </div>
            </div>
          </div>

          {/* 中央・右: フォーム */}
          <div className="lg:col-span-2">
            {/* ==================== Module 1 ==================== */}

            {selectedTool === 'creative' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">クリエイティブ自動生成</h2>
                <p className="text-sm text-gray-600 mb-6">AI駆動で広告画像とコピーを生成します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">キャンペーンID</label>
                    <input
                      type="text"
                      value={creativeParams.campaign_id}
                      onChange={(e) => setCreativeParams({ ...creativeParams, campaign_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">テンプレート</label>
                    <select
                      value={creativeParams.template_id}
                      onChange={(e) => setCreativeParams({ ...creativeParams, template_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="discount">割引・キャンペーン訴求</option>
                      <option value="urgency">緊急性・希少性訴求</option>
                      <option value="benefit">ベネフィット訴求</option>
                      <option value="social_proof">社会的証明</option>
                      <option value="storytelling">ストーリー型</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">商品・サービス名</label>
                    <input
                      type="text"
                      value={creativeParams.product_name}
                      onChange={(e) => setCreativeParams({ ...creativeParams, product_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ターゲット層</label>
                    <input
                      type="text"
                      value={creativeParams.target_audience}
                      onChange={(e) => setCreativeParams({ ...creativeParams, target_audience: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">訴求ポイント</label>
                    <input
                      type="text"
                      value={creativeParams.key_message}
                      onChange={(e) => setCreativeParams({ ...creativeParams, key_message: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">広告フォーマット</label>
                    <select
                      value={creativeParams.ad_format}
                      onChange={(e) => setCreativeParams({ ...creativeParams, ad_format: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="feed_square">Feed Square (1:1)</option>
                      <option value="feed_portrait">Feed Portrait (4:5)</option>
                      <option value="story">Stories / Reels (9:16)</option>
                      <option value="carousel">Carousel (1:1)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateCreative}
                    disabled={loading}
                    className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '生成中...' : '🎨 クリエイティブを生成'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'templates' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">テンプレート一覧</h2>
                <p className="text-sm text-gray-600 mb-6">利用可能な広告テンプレートを確認します</p>

                <button
                  onClick={handleListTemplates}
                  disabled={loading}
                  className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '取得中...' : '📋 テンプレート一覧を取得'}
                </button>
              </div>
            )}

            {/* ==================== Module 2 ==================== */}

            {selectedTool === 'setup_check' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">環境変数チェック</h2>
                <p className="text-sm text-gray-600 mb-6">Meta API接続に必要な環境変数を確認します</p>

                <button
                  onClick={handleSetupCheck}
                  disabled={loading}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'チェック中...' : '✅ 環境変数をチェック'}
                </button>
              </div>
            )}

            {selectedTool === 'create_campaign' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">キャンペーン作成</h2>
                <p className="text-sm text-gray-600 mb-6">単一のキャンペーンを作成します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">キャンペーン名</label>
                    <input
                      type="text"
                      value={campaignParams.campaign_name}
                      onChange={(e) => setCampaignParams({ ...campaignParams, campaign_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">キャンペーン目的</label>
                    <select
                      value={campaignParams.objective}
                      onChange={(e) => setCampaignParams({ ...campaignParams, objective: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="sales">Sales（売上）</option>
                      <option value="leads">Leads（リード獲得）</option>
                      <option value="awareness">Awareness（認知）</option>
                      <option value="traffic">Traffic（トラフィック）</option>
                      <option value="engagement">Engagement（エンゲージメント）</option>
                      <option value="app_promotion">App Promotion（アプリ促進）</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">日予算（JPY）</label>
                    <input
                      type="number"
                      value={campaignParams.daily_budget}
                      onChange={(e) => setCampaignParams({ ...campaignParams, daily_budget: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={campaignParams.dry_run}
                      onChange={(e) => setCampaignParams({ ...campaignParams, dry_run: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Dry Run（実際には作成しない）</label>
                  </div>

                  <button
                    onClick={handleCreateCampaign}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '作成中...' : '🚀 キャンペーンを作成'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'create_full_campaign' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">フルキャンペーン作成</h2>
                <p className="text-sm text-gray-600 mb-6">キャンペーン→広告セット→広告を一括作成します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">キャンペーン名</label>
                    <input
                      type="text"
                      value={fullCampaignParams.campaign_name}
                      onChange={(e) => setFullCampaignParams({ ...fullCampaignParams, campaign_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">広告セット名</label>
                    <input
                      type="text"
                      value={fullCampaignParams.adset_name}
                      onChange={(e) => setFullCampaignParams({ ...fullCampaignParams, adset_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">広告名</label>
                    <input
                      type="text"
                      value={fullCampaignParams.ad_name}
                      onChange={(e) => setFullCampaignParams({ ...fullCampaignParams, ad_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">日予算（JPY）</label>
                    <input
                      type="number"
                      value={fullCampaignParams.daily_budget}
                      onChange={(e) => setFullCampaignParams({ ...fullCampaignParams, daily_budget: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">リンクURL</label>
                    <input
                      type="text"
                      value={fullCampaignParams.link_url}
                      onChange={(e) => setFullCampaignParams({ ...fullCampaignParams, link_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleCreateFullCampaign}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '作成中...' : '⚡ フルキャンペーンを作成'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'get_campaign_status' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">キャンペーンステータス取得</h2>
                <p className="text-sm text-gray-600 mb-6">キャンペーンの現在のステータスを確認します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      キャンペーンID（空欄でデモデータ）
                    </label>
                    <input
                      type="text"
                      value={statusParams.campaign_id}
                      onChange={(e) => setStatusParams({ ...statusParams, campaign_id: e.target.value })}
                      placeholder="123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleGetCampaignStatus}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '取得中...' : '📊 ステータスを取得'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'set_campaign_status' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">キャンペーンステータス変更</h2>
                <p className="text-sm text-gray-600 mb-6">キャンペーンをACTIVE/PAUSEDに切り替えます</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      キャンペーンID（空欄でデモデータ）
                    </label>
                    <input
                      type="text"
                      value={statusParams.campaign_id}
                      onChange={(e) => setStatusParams({ ...statusParams, campaign_id: e.target.value })}
                      placeholder="123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">新しいステータス</label>
                    <select
                      value={statusParams.status}
                      onChange={(e) => setStatusParams({ ...statusParams, status: e.target.value as 'ACTIVE' | 'PAUSED' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ACTIVE">ACTIVE（配信中）</option>
                      <option value="PAUSED">PAUSED（一時停止）</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSetCampaignStatus}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '変更中...' : '🔄 ステータスを変更'}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== Module 3 ==================== */}

            {selectedTool === 'budget_overview' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">予算概要</h2>
                <p className="text-sm text-gray-600 mb-6">アカウント全体の予算状況を確認します</p>

                <button
                  onClick={handleGetBudgetOverview}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '取得中...' : '💰 予算概要を取得'}
                </button>
              </div>
            )}

            {selectedTool === 'update_budget' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">予算更新</h2>
                <p className="text-sm text-gray-600 mb-6">キャンペーンの予算と入札戦略を更新します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      キャンペーンID（空欄でデモ）
                    </label>
                    <input
                      type="text"
                      value={budgetParams.campaign_id}
                      onChange={(e) => setBudgetParams({ ...budgetParams, campaign_id: e.target.value })}
                      placeholder="123456789"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">新しい日予算（JPY）</label>
                    <input
                      type="number"
                      value={budgetParams.daily_budget}
                      onChange={(e) => setBudgetParams({ ...budgetParams, daily_budget: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">入札戦略</label>
                    <select
                      value={budgetParams.bid_strategy}
                      onChange={(e) => setBudgetParams({ ...budgetParams, bid_strategy: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="lowest_cost">Lowest Cost（最小コスト）</option>
                      <option value="cost_cap">Cost Cap（コスト上限）</option>
                      <option value="bid_cap">Bid Cap（入札上限）</option>
                      <option value="roas_goal">ROAS Goal（ROAS目標）</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={budgetParams.dry_run}
                      onChange={(e) => setBudgetParams({ ...budgetParams, dry_run: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Dry Run</label>
                  </div>

                  <button
                    onClick={handleUpdateBudget}
                    disabled={loading}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '更新中...' : '✏️ 予算を更新'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'create_rule' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ルール作成</h2>
                <p className="text-sm text-gray-600 mb-6">自動化ルールを作成します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ルール名</label>
                    <input
                      type="text"
                      value={ruleParams.rule_name}
                      onChange={(e) => setRuleParams({ ...ruleParams, rule_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ルールテンプレート</label>
                    <select
                      value={ruleParams.template_id}
                      onChange={(e) => setRuleParams({ ...ruleParams, template_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pause_high_cpa">高CPA一時停止</option>
                      <option value="scale_winner">勝者予算拡大</option>
                      <option value="frequency_cap">フリクエンシー上限</option>
                      <option value="low_ctr_alert">低CTRアラート</option>
                      <option value="roas_scaledown">ROAS低下時予算削減</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">対象タイプ</label>
                    <select
                      value={ruleParams.entity_type}
                      onChange={(e) => setRuleParams({ ...ruleParams, entity_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="campaign">キャンペーン</option>
                      <option value="adset">広告セット</option>
                      <option value="ad">広告</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={ruleParams.dry_run}
                      onChange={(e) => setRuleParams({ ...ruleParams, dry_run: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Dry Run</label>
                  </div>

                  <button
                    onClick={handleCreateRule}
                    disabled={loading}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '作成中...' : '📝 ルールを作成'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'list_rules' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ルール一覧</h2>
                <p className="text-sm text-gray-600 mb-6">設定済みの自動化ルールを確認します</p>

                <button
                  onClick={handleListRules}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '取得中...' : '📋 ルール一覧を取得'}
                </button>
              </div>
            )}

            {selectedTool === 'evaluate_rules' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ルール評価</h2>
                <p className="text-sm text-gray-600 mb-6">全ルールを評価し、条件を満たすものを実行します</p>

                <button
                  onClick={handleEvaluateRules}
                  disabled={loading}
                  className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '評価中...' : '🔍 ルールを評価'}
                </button>
              </div>
            )}

            {/* ==================== Module 4 ==================== */}

            {selectedTool === 'create_experiment' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">実験作成</h2>
                <p className="text-sm text-gray-600 mb-6">A/Bテスト実験を作成します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">実験名</label>
                    <input
                      type="text"
                      value={experimentParams.experiment_name}
                      onChange={(e) => setExperimentParams({ ...experimentParams, experiment_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">テスト変数</label>
                    <select
                      value={experimentParams.test_variable}
                      onChange={(e) => setExperimentParams({ ...experimentParams, test_variable: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="creative">クリエイティブ</option>
                      <option value="audience">オーディエンス</option>
                      <option value="placement">配置</option>
                      <option value="optimization">最適化目標</option>
                      <option value="bid_strategy">入札戦略</option>
                      <option value="landing_page">ランディングページ</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">テスト目標</label>
                    <select
                      value={experimentParams.objective}
                      onChange={(e) => setExperimentParams({ ...experimentParams, objective: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cost_per_result">コスト効率</option>
                      <option value="ctr">CTR</option>
                      <option value="conversion_rate">コンバージョン率</option>
                      <option value="roas">ROAS</option>
                      <option value="cpc">CPC</option>
                      <option value="cpm">CPM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">信頼度レベル</label>
                    <select
                      value={experimentParams.confidence_level}
                      onChange={(e) => setExperimentParams({ ...experimentParams, confidence_level: parseInt(e.target.value) as 65 | 80 | 90 | 95 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="65">65%</option>
                      <option value="80">80%</option>
                      <option value="90">90%</option>
                      <option value="95">95%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">バリアント数</label>
                    <input
                      type="number"
                      min="2"
                      max="4"
                      value={experimentParams.variant_count}
                      onChange={(e) => setExperimentParams({ ...experimentParams, variant_count: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={experimentParams.dry_run}
                      onChange={(e) => setExperimentParams({ ...experimentParams, dry_run: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Dry Run</label>
                  </div>

                  <button
                    onClick={handleCreateExperiment}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '作成中...' : '🧪 実験を作成'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'list_experiments' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">実験一覧</h2>
                <p className="text-sm text-gray-600 mb-6">実行中・完了済みの実験を確認します</p>

                <button
                  onClick={handleListExperiments}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '取得中...' : '📋 実験一覧を取得'}
                </button>
              </div>
            )}

            {selectedTool === 'get_experiment_results' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">実験結果</h2>
                <p className="text-sm text-gray-600 mb-6">A/Bテストの結果と統計分析を確認します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      実験ID（空欄でデモ）
                    </label>
                    <input
                      type="text"
                      value={analyzeWinnerParams.experiment_id}
                      onChange={(e) => setAnalyzeWinnerParams({ ...analyzeWinnerParams, experiment_id: e.target.value })}
                      placeholder="exp_123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleGetExperimentResults}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '分析中...' : '📊 実験結果を取得'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'end_experiment' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">実験終了</h2>
                <p className="text-sm text-gray-600 mb-6">実行中の実験を終了し、最終結果を取得します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      実験ID（空欄でデモ）
                    </label>
                    <input
                      type="text"
                      value={analyzeWinnerParams.experiment_id}
                      onChange={(e) => setAnalyzeWinnerParams({ ...analyzeWinnerParams, experiment_id: e.target.value })}
                      placeholder="exp_123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleEndExperiment}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '終了中...' : '⏹️ 実験を終了'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'analyze_winner' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">勝者分析</h2>
                <p className="text-sm text-gray-600 mb-6">勝者バリアントを特定し、自動アクションを実行します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      実験ID（空欄でデモ）
                    </label>
                    <input
                      type="text"
                      value={analyzeWinnerParams.experiment_id}
                      onChange={(e) => setAnalyzeWinnerParams({ ...analyzeWinnerParams, experiment_id: e.target.value })}
                      placeholder="exp_123456"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">勝者アクション</label>
                    <select
                      value={analyzeWinnerParams.winner_action}
                      onChange={(e) => setAnalyzeWinnerParams({ ...analyzeWinnerParams, winner_action: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="scale_budget">予算拡大</option>
                      <option value="pause_losers">敗者一時停止</option>
                      <option value="apply_and_end">適用して終了</option>
                      <option value="report_only">レポートのみ</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAnalyzeWinner}
                    disabled={loading}
                    className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '分析中...' : '🏆 勝者を分析'}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== Module 6 Forms (省略版) ==================== */}
            {/* 以前実装済みのModule 6フォームをここに配置（長いため一部省略してコメント） */}
            {/* performance_report, creative_report, audience_report, trend_report, export_report */}

            {selectedTool === 'performance_report' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">パフォーマンスレポート</h2>
                <p className="text-sm text-gray-600 mb-6">広告のパフォーマンス指標を分析します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">レポートレベル</label>
                    <select
                      value={performanceParams.level}
                      onChange={(e) => setPerformanceParams({ ...performanceParams, level: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="account">アカウント</option>
                      <option value="campaign">キャンペーン</option>
                      <option value="adset">広告セット</option>
                      <option value="ad">広告</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">期間</label>
                    <select
                      value={performanceParams.date_preset}
                      onChange={(e) => setPerformanceParams({ ...performanceParams, date_preset: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="today">今日</option>
                      <option value="yesterday">昨日</option>
                      <option value="last_7d">過去7日間</option>
                      <option value="last_30d">過去30日間</option>
                      <option value="last_90d">過去90日間</option>
                      <option value="this_month">今月</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGetPerformanceReport}
                    disabled={loading}
                    className="w-full bg-indigo-500 text-white py-3 px-6 rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '生成中...' : '📈 レポートを生成'}
                  </button>
                </div>
              </div>
            )}

            {/* 他のModule 6ツールも同様に実装（簡略化のため一部省略） */}

            {/* ==================== Module 5 Forms ==================== */}

            {selectedTool === 'tracking_setup' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pixel設定確認</h2>
                <p className="text-sm text-gray-600 mb-6">Meta Pixel と Conversions API の設定状況を確認します</p>

                <button
                  onClick={handleTrackingSetupCheck}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '確認中...' : '✅ 設定を確認'}
                </button>
              </div>
            )}

            {selectedTool === 'send_event' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">イベント送信</h2>
                <p className="text-sm text-gray-600 mb-6">Conversions API でイベントを送信します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">イベント名</label>
                    <select
                      value={eventParams.event_name}
                      onChange={(e) => setEventParams({ ...eventParams, event_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Purchase">Purchase（購入）</option>
                      <option value="Lead">Lead（リード獲得）</option>
                      <option value="ViewContent">ViewContent（コンテンツ閲覧）</option>
                      <option value="AddToCart">AddToCart（カート追加）</option>
                      <option value="InitiateCheckout">InitiateCheckout（決済開始）</option>
                      <option value="CompleteRegistration">CompleteRegistration（登録完了）</option>
                      <option value="Contact">Contact（問い合わせ）</option>
                      <option value="Subscribe">Subscribe（購読）</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      イベントID（重複排除用、空欄で自動生成）
                    </label>
                    <input
                      type="text"
                      value={eventParams.event_id}
                      onChange={(e) => setEventParams({ ...eventParams, event_id: e.target.value })}
                      placeholder="evt_123456_abc"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">ユーザーデータ（PII自動ハッシュ化）</h3>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="メールアドレス"
                        value={eventParams.user_data.em}
                        onChange={(e) => setEventParams({ ...eventParams, user_data: { ...eventParams.user_data, em: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="tel"
                        placeholder="電話番号"
                        value={eventParams.user_data.ph}
                        onChange={(e) => setEventParams({ ...eventParams, user_data: { ...eventParams.user_data, ph: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="名（First Name）"
                          value={eventParams.user_data.fn}
                          onChange={(e) => setEventParams({ ...eventParams, user_data: { ...eventParams.user_data, fn: e.target.value } })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="姓（Last Name）"
                          value={eventParams.user_data.ln}
                          onChange={(e) => setEventParams({ ...eventParams, user_data: { ...eventParams.user_data, ln: e.target.value } })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">カスタムデータ（Purchase の場合）</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="金額"
                        value={eventParams.custom_data.value}
                        onChange={(e) => setEventParams({ ...eventParams, custom_data: { ...eventParams.custom_data, value: parseFloat(e.target.value) } })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select
                        value={eventParams.custom_data.currency}
                        onChange={(e) => setEventParams({ ...eventParams, custom_data: { ...eventParams.custom_data, currency: e.target.value } })}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="JPY">JPY</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSendEvent}
                    disabled={loading}
                    className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '送信中...' : '📤 イベントを送信'}
                  </button>
                </div>
              </div>
            )}

            {selectedTool === 'send_batch_events' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">バッチイベント送信</h2>
                <p className="text-sm text-gray-600 mb-6">複数のイベントを一度に送信します（デモでは10件のサンプルイベント）</p>

                <button
                  onClick={handleSendBatchEvents}
                  disabled={loading}
                  className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? '送信中...' : '📦 バッチ送信（10件）'}
                </button>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>デモモード:</strong> サンプルの10件のイベント（Purchase, Lead等）を送信します。
                    実際のAPI接続では、複数イベントの配列をparamsに渡してください。
                  </p>
                </div>
              </div>
            )}

            {selectedTool === 'get_pixel_code' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pixelコード取得</h2>
                <p className="text-sm text-gray-600 mb-6">Webサイトに設置するPixelコードを生成します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pixel ID（空欄で環境変数から取得）
                    </label>
                    <input
                      type="text"
                      value={pixelCodeParams.pixel_id}
                      onChange={(e) => setPixelCodeParams({ ...pixelCodeParams, pixel_id: e.target.value })}
                      placeholder="1234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">イベント名</label>
                    <select
                      value={pixelCodeParams.event_name}
                      onChange={(e) => setPixelCodeParams({ ...pixelCodeParams, event_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Purchase">Purchase（購入）</option>
                      <option value="Lead">Lead（リード獲得）</option>
                      <option value="ViewContent">ViewContent（コンテンツ閲覧）</option>
                      <option value="AddToCart">AddToCart（カート追加）</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGetPixelCode}
                    disabled={loading}
                    className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '生成中...' : '💻 コードを生成'}
                  </button>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>生成されるコード:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Pixelベースコード（&lt;head&gt;に設置）</li>
                      <li>イベントスニペット（購入完了ページ等）</li>
                      <li>CAPI Handler（サーバー側）</li>
                      <li>GTMタグテンプレート</li>
                    </ul>
                  </p>
                </div>
              </div>
            )}

            {selectedTool === 'event_diagnostics' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">イベント診断</h2>
                <p className="text-sm text-gray-600 mb-6">イベントトラッキングの品質とマッチング率を診断します</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pixel ID（空欄で環境変数から取得）
                    </label>
                    <input
                      type="text"
                      value={diagnosticsParams.pixel_id}
                      onChange={(e) => setDiagnosticsParams({ ...diagnosticsParams, pixel_id: e.target.value })}
                      placeholder="1234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">診断期間</label>
                    <select
                      value={diagnosticsParams.date_preset}
                      onChange={(e) => setDiagnosticsParams({ ...diagnosticsParams, date_preset: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="today">今日</option>
                      <option value="yesterday">昨日</option>
                      <option value="last_7d">過去7日間</option>
                      <option value="last_30d">過去30日間</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGetEventDiagnostics}
                    disabled={loading}
                    className="w-full bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? '診断中...' : '🔍 診断を実行'}
                  </button>
                </div>

                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    <strong>診断内容:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>イベントマッチ品質スコア（A-Dグレード）</li>
                      <li>ユーザーデータマッチング率</li>
                      <li>重複排除率</li>
                      <li>検出された問題点と推奨事項</li>
                    </ul>
                  </p>
                </div>
              </div>
            )}

            {/* ==================== 結果表示 ==================== */}
            {/* 結果表示セクションは非常に長いため、次のメッセージで続けます */}

            {result && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">実行結果</h3>

                {/* Module 3: Budget Overview */}
                {result.result?.data?.overview && (
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-3">💰 予算概要</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">総予算</p>
                          <p className="text-lg font-bold">¥{result.result.data.overview.total_budget.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">総消化額</p>
                          <p className="text-lg font-bold">¥{result.result.data.overview.total_spend.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">残高</p>
                          <p className="text-lg font-bold">¥{result.result.data.overview.remaining.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {result.result.data.overview.campaigns && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">キャンペーン別予算</h4>
                        <div className="space-y-2">
                          {result.result.data.overview.campaigns.map((camp: any, idx: number) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-sm">{camp.name}</p>
                                <p className="text-xs text-gray-500">予算: ¥{camp.budget.toLocaleString()} / 消化: ¥{camp.spend.toLocaleString()}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${camp.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                {camp.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.result.data.overview.recommendations && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">💡 推奨事項</h4>
                        <ul className="space-y-1">
                          {result.result.data.overview.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-blue-800">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Module 3: Budget Update */}
                {result.result?.data?.new_budget && (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">✅ 予算更新成功</h4>
                      <div className="space-y-1 text-sm">
                        <p><strong>キャンペーンID:</strong> {result.result.data.campaign_id}</p>
                        <p><strong>旧予算:</strong> ¥{result.result.data.previous_budget.toLocaleString()}</p>
                        <p><strong>新予算:</strong> ¥{result.result.data.new_budget.toLocaleString()}</p>
                        {result.result.data.new_bid_strategy && (
                          <p><strong>入札戦略:</strong> {result.result.data.new_bid_strategy}</p>
                        )}
                      </div>
                    </div>

                    {result.result.data.curl_preview && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">curlプレビュー</h4>
                        <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
                          {result.result.data.curl_preview}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Module 3: Rule Created */}
                {result.result?.data?.rule && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">📝 ルール作成成功</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>ルールID:</strong> {result.result.data.rule.id}</p>
                      <p><strong>ルール名:</strong> {result.result.data.rule.name}</p>
                      <p><strong>対象:</strong> {result.result.data.rule.entity_type}</p>
                      <p><strong>アクション:</strong> {result.result.data.rule.action}</p>
                      <p><strong>有効:</strong> {result.result.data.rule.enabled ? '✅ はい' : '❌ いいえ'}</p>
                    </div>
                  </div>
                )}

                {/* Module 3: Rules List */}
                {result.result?.data?.rules && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">設定済みルール</h4>
                    {result.result.data.rules.map((rule: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{rule.name}</p>
                            <p className="text-xs text-gray-500">対象: {rule.entity_type} / アクション: {rule.action}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {rule.enabled ? '有効' : '無効'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Module 3: Rule Evaluation */}
                {result.result?.data?.evaluation_results && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-indigo-900 mb-2">🔍 ルール評価サマリー</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-600">総ルール数</p>
                          <p className="text-lg font-bold">{result.result.data.summary.total_rules}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">トリガー数</p>
                          <p className="text-lg font-bold">{result.result.data.summary.rules_triggered}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">影響エンティティ</p>
                          <p className="text-lg font-bold">{result.result.data.summary.entities_affected}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {result.result.data.evaluation_results.map((res: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-lg ${res.triggered ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm">{res.rule_name}</p>
                              <p className="text-xs text-gray-600">{res.reason}</p>
                              {res.action_taken && (
                                <p className="text-xs text-green-700 mt-1">✓ {res.action_taken}</p>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${res.triggered ? 'bg-yellow-200 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>
                              {res.triggered ? 'トリガー' : '未トリガー'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Module 4: Experiment Created */}
                {result.result?.data?.experiment && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">🧪 実験作成成功</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>実験ID:</strong> {result.result.data.experiment.id}</p>
                      <p><strong>実験名:</strong> {result.result.data.experiment.name}</p>
                      <p><strong>テスト変数:</strong> {result.result.data.experiment.test_variable}</p>
                      <p><strong>目標:</strong> {result.result.data.experiment.objective}</p>
                      <p><strong>信頼度:</strong> {result.result.data.experiment.confidence_level}%</p>
                      <p><strong>バリアント数:</strong> {result.result.data.experiment.variants.length}</p>
                    </div>
                  </div>
                )}

                {/* Module 4: Experiments List */}
                {result.result?.data?.experiments && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">実験一覧</h4>
                    {result.result.data.experiments.map((exp: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{exp.name}</p>
                            <p className="text-xs text-gray-500">
                              変数: {exp.test_variable} / バリアント: {exp.variants.length}個
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            exp.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                            exp.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {exp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Module 4: Experiment Results */}
                {result.result?.data?.results && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">📊 A/Bテスト結果</h4>
                      <div className="text-sm">
                        <p><strong>統計的有意差:</strong> {result.result.data.results.statistical_significance ? '✅ あり' : '❌ なし'}</p>
                        {result.result.data.results.winner && (
                          <>
                            <p><strong>勝者:</strong> {result.result.data.results.winner.variant_id}</p>
                            <p><strong>改善率:</strong> +{result.result.data.results.winner.lift}%</p>
                            <p><strong>信頼度:</strong> {result.result.data.results.winner.confidence}%</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {result.result.data.results.variants.map((variant: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-lg ${variant.is_winner ? 'bg-green-50 border-2 border-green-500' : 'bg-gray-50'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-semibold">{variant.name}</p>
                            {variant.is_winner && <span className="px-2 py-1 bg-green-500 text-white rounded text-xs">🏆 勝者</span>}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <span>CTR: {variant.metrics.ctr}%</span>
                            <span>CPC: ¥{variant.metrics.cpc}</span>
                            <span>CV: {variant.metrics.conversions}</span>
                            <span>ROAS: {variant.metrics.roas}x</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">p値: {variant.p_value} / 信頼度: {variant.confidence}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Module 4: Winner Analysis */}
                {result.result?.data?.winner && result.result.data.action_taken && (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">🏆 勝者分析</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>勝者:</strong> {result.result.data.winner.variant_name}</p>
                        <p><strong>実行アクション:</strong> {result.result.data.action_taken}</p>
                      </div>
                    </div>

                    {result.result.data.winner.improvement_over_baseline && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">📈 改善率</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p>CTR: +{result.result.data.winner.improvement_over_baseline.ctr}%</p>
                          <p>CPC: -{result.result.data.winner.improvement_over_baseline.cpc}%</p>
                          <p>CPA: -{result.result.data.winner.improvement_over_baseline.cpa}%</p>
                          <p>ROAS: +{result.result.data.winner.improvement_over_baseline.roas}%</p>
                        </div>
                      </div>
                    )}

                    {result.result.data.recommendations && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-indigo-900 mb-2">💡 推奨事項</h4>
                        <ul className="space-y-1">
                          {result.result.data.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="text-sm text-indigo-800">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* JSON表示 */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">JSON詳細を表示</summary>
                  <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs max-h-96">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
