'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [activeModule, setActiveModule] = useState<number | null>(null);

  const modules = [
    {
      id: 1,
      name: 'クリエイティブ自動生成',
      icon: '🎨',
      description: 'AI駆動の画像＋コピー生成',
      color: 'bg-purple-500',
      features: ['Gemini API 画像生成', 'Claude API コピー生成', '5つのテンプレート', '4つの広告フォーマット'],
      tools: 5,
    },
    {
      id: 2,
      name: 'キャンペーン自動作成',
      icon: '🚀',
      description: 'Advantage+ 完全対応',
      color: 'bg-blue-500',
      features: ['Meta Marketing API v25.0', 'ODAX 6つの目的', '3層一括作成', 'dry_runモード'],
      tools: 5,
    },
    {
      id: 3,
      name: '予算最適化',
      icon: '💰',
      description: 'CBO管理＋自動ルール',
      color: 'bg-green-500',
      features: ['ルールベース自動化', '5つのルールテンプレート', '4つの入札戦略', 'リアルタイム監視'],
      tools: 5,
    },
    {
      id: 4,
      name: 'A/Bテスト自動化',
      icon: '🧪',
      description: '統計的有意差判定',
      color: 'bg-yellow-500',
      features: ['Experiments API', 'Z-score計算', '6つのテスト変数', '自動スケーリング'],
      tools: 5,
    },
    {
      id: 5,
      name: 'トラッキング',
      icon: '📍',
      description: 'Pixel + CAPI 統合',
      color: 'bg-red-500',
      features: ['重複排除', 'PII自動ハッシュ化', '14標準イベント', '品質診断'],
      tools: 5,
    },
    {
      id: 6,
      name: 'レポート自動生成',
      icon: '📊',
      description: 'Insights API 分析',
      color: 'bg-indigo-500',
      features: ['18指標対応', '4種類のレポート', '自動推奨分析', 'Markdown/CSV出力'],
      tools: 5,
    },
  ];

  const stats = [
    { label: 'モジュール数', value: '6', icon: '📦' },
    { label: 'MCPツール数', value: '30', icon: '🔧' },
    { label: 'テストカバレッジ', value: '100%', icon: '✅' },
    { label: 'ドキュメント', value: '111KB', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Meta広告自動化ダッシュボード
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                AI駆動のFacebook/Instagram広告運用自動化ツール
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/tools"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                🔧 ツールを試す
              </Link>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 mr-2 bg-green-400 rounded-full animate-pulse"></span>
                稼働中
              </span>
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-4xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">モジュール一覧</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
            >
              <div className={`${module.color} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{module.icon}</div>
                  <div className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                    Module {module.id}
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-bold">{module.name}</h3>
                <p className="mt-2 text-sm opacity-90">{module.description}</p>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">MCPツール</span>
                  <span className="text-lg font-bold text-gray-900">{module.tools}</span>
                </div>

                {activeModule === module.id && (
                  <div className="mt-4 space-y-2 animate-fadeIn">
                    <p className="text-sm font-medium text-gray-700 mb-2">主な機能:</p>
                    <ul className="space-y-1">
                      {module.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  className={`mt-4 w-full ${module.color} text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Module ${module.id}: ${module.name}\n\nこの機能は開発中です。\nMCPツールとして利用可能です。`);
                  }}
                >
                  詳細を見る
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">推奨ワークフロー</h2>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="space-y-4">
            {[
              { step: 1, module: 'クリエイティブ自動生成', action: '画像とコピーを生成 → creative.json', icon: '🎨' },
              { step: 2, module: 'キャンペーン自動作成', action: 'creative.json を読み込んでキャンペーン作成', icon: '🚀' },
              { step: 3, module: '予算最適化', action: 'キャンペーンIDで予算設定とルール作成', icon: '💰' },
              { step: 4, module: 'A/Bテスト自動化', action: 'A/Bテスト実施 → 勝者を自動スケール', icon: '🧪' },
              { step: 5, module: 'トラッキング', action: 'Pixel + CAPI でコンバージョン送信', icon: '📍' },
              { step: 6, module: 'レポート自動生成', action: 'パフォーマンス分析 → 改善案を提示', icon: '📊' },
            ].map((item, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{item.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{item.module}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{item.action}</p>
                </div>
                {index < 5 && (
                  <div className="ml-4 text-gray-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2026 Meta広告自動化プロジェクト - MIT License
            </div>
            <div className="flex space-x-6">
              <a href="https://github.com/ikedachiin-maker/snsauto2" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
