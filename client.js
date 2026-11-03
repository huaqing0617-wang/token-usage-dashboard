window.__ModuleLoader__.load({
  id: '@huaqing/dsh-token-usage-dashboard',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const useSyncExternalStore = React.useSyncExternalStore;

    const NS = 'tokenUsageDashboard';
    const SETTINGS_KEY = 'dsh.token-usage-dashboard.v1';
    const USAGE_ROUTE = 'api/token-usage-dashboard';
    const USAGE_REFRESH_MS = 15_000;
    const PLATFORM_URL = 'https://platform.deepseek.com/usage';

    const zh = {
      'bar.title': 'Token 看板',
      'bar.badgeOfficial': '官方',
      'bar.badgeStale': '官方·旧',
      'bar.badgeLocal': '本机',
      'bar.todayTokens': '今日 Token',
      'bar.todayCost': '今日花费',
      'bar.balance': '余额',
      'bar.totalCost': '累计花费',
      'bar.totalTokens': '累计 Token',
      'bar.localTotalCost': '本机累计花费',
      'bar.localTotalTokens': '本机累计 Token',
      'bar.apis': 'API',
      'bar.models': '模型',
      'bar.details': '详情',
      'bar.closeDetails': '收起',
      'bar.refresh': '刷新',
      'bar.alwaysOn': '常驻',
      'bar.alwaysOnTitle': '切换是否常驻显示看板',
      'bar.loading': '加载中',
      'bar.unavailable': '不可用',
      'bar.retry': '重试',
      'bar.signedOut': '不可用',
      'bar.updated': '更新于',
      'bar.justNow': '刚刚',
      'bar.minutesAgo': '分钟前',
      'bar.hoursAgo': '小时前',
      'bar.collapsed': '打开 Token 看板',
      'details.officialTitle': '官方平台（全部 API Key · 全部设备 · 全部时间）',
      'details.localTitle': '本机 DSH',
      'details.today': '今天',
      'details.allTime': '全部时间',
      'details.cost': '花费',
      'details.requests': '请求',
      'details.tokens': 'tokens',
      'details.input': '输入',
      'details.cacheRead': '缓存读取',
      'details.cacheWrite': '缓存写入',
      'details.output': '输出',
      'details.calls': '次调用',
      'details.apiKeys': 'API Keys',
      'details.models': '模型',
      'details.balance': '余额',
      'details.keys30': 'API Key 用量（全部时间）',
      'details.modelUsage': '官方模型用量（全部时间）',
      'details.localToday': '本机今天',
      'details.localLifetime': '本机累计',
      'details.localEstimated': '本机 USD 估算',
      'details.providers': '本机模型提供方',
      'details.noKeys': '暂无 API Key 用量',
      'details.noModels': '暂无模型用量',
      'details.noProviders': '暂无本机模型提供方',
      'details.catalogFailed': '本机模型目录读取失败',
      'details.bridgeReady': '官方桥接已连接',
      'details.bridgeStale': '官方桥接已停止更新',
      'details.bridgeOff': '官方桥接未连接',
      'details.bridgeHelp': '在 Edge 的扩展页加载 token-usage-dashboard/edge-bridge 文件夹，并保持 platform.deepseek.com/usage 标签页打开。数据会自动同步，无需手动填写。',
      'details.openPlatform': '打开 Platform 账单',
      'details.retry': '重试',
      'details.received': '更新于',
      'details.coverage': '覆盖',
      'details.months': '个月',
      'details.localNote': '本机 Token 来自 DSH 会话日志；费用按 DeepSeek 官方价估算为 USD。',
      'details.officialNote': '官方花费、请求数和 Token 来自 DeepSeek Platform 全账号账本。',
      'details.excluded': '不含搜索/抓取按次费用；本机累计不等于 Platform 账单。',
      'details.error': '错误',
      'details.source': '来源',
      'details.balanceFromPlatform': 'Platform 官方',
      'details.balanceFromKey': 'DeepSeek API Key',
      'details.balanceUnavailable': '余额暂不可用',
      'details.apiKeyUsageNote': '按 Key 的明细与总计均为全部时间。',
      'details.last30': '近 30 天',
      'details.allTimeNote': '全部时间由浏览器桥接按连续 30 天窗口汇总。',
      'details.browser': '浏览器',
      'details.syncingAllTime': '全部时间正在后台同步…',
      'details.syncErrors': '时间窗口同步失败',
      'details.loading': '正在同步官方数据…',
      'aria.bar': 'Token 看板',
      'aria.toggle': '常驻显示',
      'aria.details': '展开详情',
      'aria.refresh': '刷新',
      'aria.launcher': '打开 Token 看板',
      'aria.providers': 'API 和模型',
      'aria.balance': '账户余额',
    };

    const en = {
      'bar.title': 'Token board',
      'bar.badgeOfficial': 'Official',
      'bar.badgeStale': 'Official·stale',
      'bar.badgeLocal': 'Local',
      'bar.todayTokens': 'Today tokens',
      'bar.todayCost': 'Today spend',
      'bar.balance': 'Balance',
      'bar.totalCost': 'Total spend',
      'bar.totalTokens': 'Total tokens',
      'bar.localTotalCost': 'Local lifetime spend',
      'bar.localTotalTokens': 'Local lifetime tokens',
      'bar.apis': 'APIs',
      'bar.models': 'models',
      'bar.details': 'Details',
      'bar.closeDetails': 'Close',
      'bar.refresh': 'Refresh',
      'bar.alwaysOn': 'Always on',
      'bar.alwaysOnTitle': 'Toggle the always-on dashboard',
      'bar.loading': 'Loading',
      'bar.unavailable': 'Unavailable',
      'bar.retry': 'Retry',
      'bar.signedOut': 'Unavailable',
      'bar.updated': 'Updated',
      'bar.justNow': 'just now',
      'bar.minutesAgo': 'min ago',
      'bar.hoursAgo': 'hr ago',
      'bar.collapsed': 'Open token board',
      'details.officialTitle': 'Official Platform (all API keys · all devices · all time)',
      'details.localTitle': 'Local DSH',
      'details.today': 'Today',
      'details.allTime': 'All time',
      'details.cost': 'Spend',
      'details.requests': 'Requests',
      'details.tokens': 'tokens',
      'details.input': '输入',
      'details.cacheRead': '缓存读取',
      'details.cacheWrite': '缓存写入',
      'details.output': '输出',
      'details.calls': '次调用',
      'details.apiKeys': 'API keys',
      'details.models': 'Models',
      'details.balance': 'Balance',
      'details.keys30': 'API key usage (all time)',
      'details.modelUsage': 'Official model usage (all time)',
      'details.localToday': 'Local today',
      'details.localLifetime': 'Local lifetime',
      'details.localEstimated': 'Local USD estimate',
      'details.providers': 'Local model providers',
      'details.noKeys': 'No API key usage yet',
      'details.noModels': 'No model usage yet',
      'details.noProviders': 'No local model providers',
      'details.catalogFailed': 'Local model catalog read failed',
      'details.bridgeReady': 'Official bridge connected',
      'details.bridgeStale': 'Official bridge stopped updating',
      'details.bridgeOff': 'Official bridge disconnected',
      'details.bridgeHelp': 'Load the token-usage-dashboard/edge-bridge folder in Edge extensions and keep platform.deepseek.com/usage open. The bridge syncs automatically; no manual entry.',
      'details.openPlatform': 'Open Platform billing',
      'details.retry': 'Retry',
      'details.received': 'Updated',
      'details.coverage': 'Coverage',
      'details.months': 'months',
      'details.localNote': 'Local tokens come from DSH Session logs; spend is a USD estimate at DeepSeek pricing.',
      'details.officialNote': 'Official spend, requests, and tokens come from the DeepSeek Platform account ledger.',
      'details.excluded': 'Excludes Search/Fetch per-request fees; local lifetime does not equal the Platform bill.',
      'details.error': 'Error',
      'details.source': 'Source',
      'details.balanceFromPlatform': 'Platform official',
      'details.balanceFromKey': 'DeepSeek API key',
      'details.balanceUnavailable': 'Balance unavailable',
      'details.apiKeyUsageNote': 'Per-key rows and totals cover all time.',
      'details.last30': 'Last 30 days',
      'details.allTimeNote': 'All-time totals aggregate consecutive 30-day windows in the browser bridge.',
      'details.browser': 'Browser',
      'details.syncingAllTime': 'All-time history is still syncing…',
      'details.syncErrors': 'Time windows failed to sync',
      'details.loading': 'Syncing official data…',
      'aria.bar': 'Token board',
      'aria.toggle': 'Always-on display',
      'aria.details': 'Expand details',
      'aria.refresh': 'Refresh',
      'aria.launcher': 'Open the token board',
      'aria.providers': 'APIs and models',
      'aria.balance': 'Account balance',
    };

    const CSS = `
.dsh-usage-shell { border-top:.5px solid var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font-family:var(--dsw-font-family); font-size:11px; line-height:1.35; min-width:0; }
.dsh-usage-bar { display:flex; align-items:center; gap:10px; min-height:44px; padding:0 12px; min-width:0; }
.dsh-usage-brand { display:flex; align-items:center; gap:7px; flex:0 0 auto; min-width:0; }
.dsh-usage-brand-button { appearance:none; border:0; background:transparent; color:inherit; font:inherit; display:inline-flex; align-items:center; gap:7px; padding:4px 2px; border-radius:var(--dsw-radius-sm); cursor:pointer; }
.dsh-usage-brand-button:hover { background:var(--dsw-alias-interactive-bg-hover); }
.dsh-usage-brand-button:focus-visible,.dsh-usage-button:focus-visible,.dsh-usage-switch:focus-visible,.dsh-usage-launcher:focus-visible,.dsh-usage-link:focus-visible,.dsh-usage-retry:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }
.dsh-usage-icon { color:var(--dsw-alias-brand-primary); flex:0 0 auto; display:block; }
.dsh-usage-brand-text { font-size:11px; font-weight:600; white-space:nowrap; }
.dsh-usage-badge { display:inline-flex; align-items:center; height:16px; padding:0 5px; border-radius:999px; border:.5px solid var(--dsw-alias-border-l2); color:var(--dsw-alias-label-tertiary); background:var(--dsw-alias-bg-layer-1); font-size:8px; line-height:16px; white-space:nowrap; }
.dsh-usage-badge[data-kind='official'] { color:var(--dsw-alias-state-success-primary); border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 30%,transparent); }
.dsh-usage-badge[data-kind='stale'] { color:var(--dsw-alias-state-warn-label); border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 30%,transparent); }
.dsh-usage-live { width:6px; height:6px; border-radius:50%; background:var(--dsw-alias-state-success-primary); box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent); flex:0 0 auto; }
.dsh-usage-live[data-state='loading'],.dsh-usage-live[data-state='stale'] { background:var(--dsw-alias-state-warn-primary); box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-warn-primary) 14%,transparent); }
.dsh-usage-live[data-state='error'],.dsh-usage-live[data-state='off'] { background:var(--dsw-alias-state-error-primary); box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent); }
.dsh-usage-metrics { display:flex; align-items:stretch; flex:1 1 auto; min-width:0; overflow-x:auto; scrollbar-width:none; }
.dsh-usage-metrics::-webkit-scrollbar { display:none; }
.dsh-usage-metric { display:flex; flex-direction:column; justify-content:center; gap:1px; padding:0 14px; min-width:max-content; }
.dsh-usage-metric:first-child { padding-left:4px; }
.dsh-usage-metric + .dsh-usage-metric { border-left:.5px solid var(--dsw-alias-border-l2); }
.dsh-usage-label { color:var(--dsw-alias-label-tertiary); font-size:9px; line-height:12px; white-space:nowrap; }
.dsh-usage-value { color:var(--dsw-alias-label-primary); font-family:var(--dsw-font-mono); font-size:12px; line-height:16px; font-variant-numeric:tabular-nums; white-space:nowrap; }
.dsh-usage-value[data-muted='true'] { color:var(--dsw-alias-label-tertiary); }
.dsh-usage-value[data-warn='true'] { color:var(--dsw-alias-state-warn-label); }
.dsh-usage-star { color:var(--dsw-alias-state-warn-primary); font-size:10px; margin-left:1px; }
.dsh-usage-actions { display:flex; align-items:center; gap:2px; flex:0 0 auto; }
.dsh-usage-button { appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-secondary); height:28px; min-width:28px; padding:0 6px; border-radius:var(--dsw-radius-sm); display:inline-flex; align-items:center; justify-content:center; gap:5px; font:inherit; cursor:pointer; white-space:nowrap; }
.dsh-usage-button:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.dsh-usage-button[data-active='true'] { background:var(--dsw-alias-interactive-bg-active); color:var(--dsw-alias-label-primary); }
.dsh-usage-button:disabled { cursor:default; opacity:.7; }
.dsh-usage-apis { appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-tertiary); height:28px; padding:0 7px; border-radius:var(--dsw-radius-sm); display:inline-flex; align-items:center; gap:6px; font:inherit; cursor:pointer; white-space:nowrap; }
.dsh-usage-apis:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-secondary); }
.dsh-usage-apis-dot { width:5px; height:5px; border-radius:50%; background:var(--dsw-alias-state-success-primary); flex:0 0 auto; }
.dsh-usage-apis-dot[data-state='warn'] { background:var(--dsw-alias-state-warn-primary); }
.dsh-usage-apis-dot[data-state='error'] { background:var(--dsw-alias-state-error-primary); }
.dsh-usage-switch { appearance:none; border:0; background:transparent; color:var(--dsw-alias-label-tertiary); height:28px; padding:0 5px; border-radius:var(--dsw-radius-sm); display:inline-flex; align-items:center; gap:6px; font:inherit; cursor:pointer; white-space:nowrap; }
.dsh-usage-switch:hover { background:var(--dsw-alias-interactive-bg-hover); }
.dsh-usage-switch[aria-checked='true'] { color:var(--dsw-alias-label-secondary); }
.dsh-usage-switch-track { width:30px; height:18px; border-radius:9px; background:var(--dsw-alias-bg-layer-3); position:relative; flex:0 0 auto; transition:background var(--ds-transition-duration-fast) var(--ds-ease-in-out); }
.dsh-usage-switch-thumb { width:14px; height:14px; border-radius:50%; background:var(--dsw-alias-switch-thumb); position:absolute; top:2px; left:2px; box-shadow:0 1px 2px color-mix(in srgb,#000 25%,transparent); transition:transform var(--ds-transition-duration-fast) var(--ds-ease-in-out); }
.dsh-usage-switch[aria-checked='true'] .dsh-usage-switch-track { background:var(--dsw-alias-brand-primary); }
.dsh-usage-switch[aria-checked='true'] .dsh-usage-switch-thumb { transform:translateX(12px); }
.dsh-usage-spinner { animation:dsh-usage-spin .8s linear infinite; }
@keyframes dsh-usage-spin { to { transform:rotate(360deg); } }
.dsh-usage-details { display:flex; flex-direction:column; gap:12px; padding:12px 14px 14px; border-top:.5px solid var(--dsw-alias-border-l2); max-height:58vh; overflow:auto; scrollbar-color:var(--dsw-alias-scrollbar-bg-l2) transparent; }
.dsh-usage-section { display:flex; flex-direction:column; gap:10px; min-width:0; }
.dsh-usage-section-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding-bottom:2px; }
.dsh-usage-section-title { color:var(--dsw-alias-label-primary); font-size:11px; font-weight:600; white-space:nowrap; }
.dsh-usage-section-meta { color:var(--dsw-alias-label-tertiary); font-size:9px; }
.dsh-usage-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
.dsh-usage-grid[data-cols='2'] { grid-template-columns:repeat(2,minmax(0,1fr)); }
.dsh-usage-card { background:var(--dsw-alias-bg-layer-1); border:.5px solid var(--dsw-alias-border-l2); border-radius:var(--dsw-radius-md); padding:11px; min-width:0; }
.dsh-usage-card-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:7px; }
.dsh-usage-card-title { color:var(--dsw-alias-label-secondary); font-size:10px; font-weight:500; white-space:nowrap; }
.dsh-usage-card-meta { color:var(--dsw-alias-label-tertiary); font-size:9px; white-space:nowrap; }
.dsh-usage-hero { display:flex; align-items:baseline; gap:5px; min-width:0; }
.dsh-usage-hero-value { color:var(--dsw-alias-label-primary); font-family:var(--dsw-font-mono); font-size:20px; line-height:25px; font-weight:500; font-variant-numeric:tabular-nums; letter-spacing:-.02em; }
.dsh-usage-hero-unit { color:var(--dsw-alias-label-tertiary); font-size:9px; }
.dsh-usage-cost-line { display:flex; align-items:baseline; gap:6px; margin-top:2px; color:var(--dsw-alias-label-secondary); font-size:10px; flex-wrap:wrap; }
.dsh-usage-cost-value { color:var(--dsw-alias-label-primary); font-family:var(--dsw-font-mono); font-variant-numeric:tabular-nums; font-size:12px; }
.dsh-usage-cost-note { color:var(--dsw-alias-label-tertiary); font-size:9px; }
.dsh-usage-breakdown { display:grid; grid-template-columns:1fr 1fr; gap:3px 10px; margin-top:9px; padding-top:7px; border-top:.5px solid var(--dsw-alias-border-l2); }
.dsh-usage-breakdown-row { display:flex; align-items:center; gap:5px; min-width:0; color:var(--dsw-alias-label-tertiary); font-size:9px; white-space:nowrap; }
.dsh-usage-breakdown-row b { color:var(--dsw-alias-label-secondary); font-family:var(--dsw-font-mono); font-weight:400; font-variant-numeric:tabular-nums; margin-left:auto; }
.dsh-usage-dot { width:5px; height:5px; border-radius:50%; flex:0 0 auto; background:var(--dsw-alias-label-tertiary); }
.dsh-usage-dot[data-kind='input'] { background:#5b7cfa; }
.dsh-usage-dot[data-kind='cacheRead'] { background:#15a89b; }
.dsh-usage-dot[data-kind='cacheWrite'] { background:#d99832; }
.dsh-usage-dot[data-kind='output'] { background:#b267d9; }
.dsh-usage-two-col { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1fr); gap:10px; }
.dsh-usage-list { display:flex; flex-direction:column; gap:1px; max-height:190px; overflow:auto; }
.dsh-usage-list-row { display:grid; grid-template-columns:minmax(80px,1.3fr) repeat(3,minmax(52px,.7fr)); gap:8px; align-items:center; padding:4px 0; border-bottom:.5px solid var(--dsw-alias-border-l2); min-width:0; }
.dsh-usage-list-row:last-child { border-bottom:0; }
.dsh-usage-list-name { color:var(--dsw-alias-label-primary); font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-usage-list-sub { color:var(--dsw-alias-label-tertiary); font-size:8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dsh-usage-list-number { color:var(--dsw-alias-label-secondary); font-family:var(--dsw-font-mono); font-size:9px; font-variant-numeric:tabular-nums; text-align:right; white-space:nowrap; }
.dsh-usage-list-head { color:var(--dsw-alias-label-tertiary); font-size:8px; padding-bottom:2px; border-bottom:.5px solid var(--dsw-alias-border-l2); }
.dsh-usage-chips { display:flex; flex-wrap:wrap; gap:3px; margin-top:3px; }
.dsh-usage-chip { display:inline-flex; align-items:center; padding:1px 5px; border:.5px solid var(--dsw-alias-border-l2); border-radius:var(--dsw-radius-sm); background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-tertiary); font-size:8px; line-height:13px; white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; }
.dsh-usage-provider { padding:5px 0; border-bottom:.5px solid var(--dsw-alias-border-l2); min-width:0; }
.dsh-usage-provider:last-child { border-bottom:0; }
.dsh-usage-provider-head { display:flex; align-items:center; gap:6px; }
.dsh-usage-provider-name { color:var(--dsw-alias-label-primary); font-size:10px; font-weight:500; }
.dsh-usage-provider-id { color:var(--dsw-alias-label-tertiary); font-family:var(--dsw-font-mono); font-size:8px; overflow:hidden; text-overflow:ellipsis; }
.dsh-usage-notice { padding:8px 10px; border-radius:var(--dsw-radius-sm); border:.5px solid var(--dsw-alias-border-l2); background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:10px; line-height:16px; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.dsh-usage-notice[data-kind='error'] { border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 28%,transparent); background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 7%,transparent); }
.dsh-usage-notice[data-kind='warn'] { border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 28%,transparent); background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 7%,transparent); }
.dsh-usage-link { color:var(--dsw-alias-link); text-decoration:none; font-size:10px; }
.dsh-usage-link:hover { text-decoration:underline; }
.dsh-usage-retry { appearance:none; border:.5px solid var(--dsw-alias-border-l3); background:var(--dsw-alias-button-elevated-fill); color:var(--dsw-alias-label-secondary); border-radius:var(--dsw-radius-sm); height:24px; padding:0 8px; font:inherit; font-size:10px; cursor:pointer; }
.dsh-usage-retry:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.dsh-usage-empty { color:var(--dsw-alias-label-tertiary); font-size:10px; padding:6px 0; }
.dsh-usage-foot { display:flex; align-items:center; flex-wrap:wrap; gap:4px 12px; color:var(--dsw-alias-label-tertiary); font-size:9px; line-height:14px; }
.dsh-usage-foot-warn { color:var(--dsw-alias-state-warn-label); }
.dsh-usage-launcher { position:absolute; right:16px; bottom:16px; z-index:30; appearance:none; display:inline-flex; align-items:center; gap:6px; max-width:calc(100vw - 32px); height:32px; padding:0 11px; border:.5px solid var(--dsw-alias-border-l3); border-radius:999px; background:var(--dsw-alias-bg-overlay); color:var(--dsw-alias-label-primary); box-shadow:0 8px 24px color-mix(in srgb,#000 16%,transparent); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); font-family:var(--dsw-font-family); font-size:11px; font-weight:500; cursor:pointer; white-space:nowrap; pointer-events:auto; }
.dsh-usage-launcher:hover { background:var(--dsw-alias-bg-layer-2); }
.dsh-usage-launcher-cost { color:var(--dsw-alias-label-tertiary); font-family:var(--dsw-font-mono); font-size:10px; font-variant-numeric:tabular-nums; font-weight:400; }
.dsh-usage-hide-narrow { display:inline; }
@media (max-width:1100px) { .dsh-usage-brand-text { display:none; } .dsh-usage-metric { padding:0 10px; } .dsh-usage-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:860px) { .dsh-usage-apis { display:none; } .dsh-usage-switch-label { display:none; } .dsh-usage-two-col { grid-template-columns:1fr; } }
@media (max-width:640px) { .dsh-usage-bar { gap:4px; padding:0 8px; } .dsh-usage-brand { display:none; } .dsh-usage-hide-narrow { display:none; } .dsh-usage-metric { padding:0 8px; } .dsh-usage-label { font-size:8px; } .dsh-usage-value { font-size:11px; } .dsh-usage-grid { grid-template-columns:1fr; } .dsh-usage-details { padding:10px; } }
@media (prefers-reduced-motion:reduce) { .dsh-usage-spinner { animation:none; } .dsh-usage-switch-track,.dsh-usage-switch-thumb { transition:none; } }
`;

    function readSettings() {
      try {
        const raw = window.localStorage.getItem(SETTINGS_KEY);
        if (raw === null) return { alwaysOn: true };
        return { alwaysOn: JSON.parse(raw)?.alwaysOn !== false };
      } catch {
        return { alwaysOn: true };
      }
    }
    function writeSettings(alwaysOn) {
      try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ alwaysOn })); } catch {}
    }

    function createStore() {
      let settings = readSettings();
      let state = { alwaysOn: settings.alwaysOn, expanded: false, usage: null, usageStatus: 'idle', usageError: null, refreshing: false, updatedAt: 0 };
      let refreshing = false;
      const listeners = new Set();
      const controllers = new Set();
      const patch = (next) => {
        state = { ...state, ...next };
        for (const listener of listeners) { try { listener(); } catch {} }
      };
      async function refreshUsage() {
        const first = state.usage === null;
        if (first) patch({ usageStatus: 'loading', usageError: null });
        const controller = new AbortController();
        controllers.add(controller);
        try {
          const response = await fetch(USAGE_ROUTE, { method: 'GET', cache: 'no-store', headers: { accept: 'application/json' }, signal: controller.signal });
          if (!response.ok) throw new Error(`usage route returned HTTP ${response.status}`);
          const json = await response.json();
          if (json === null || typeof json !== 'object' || json.today === undefined) throw new Error('invalid usage payload');
          patch({ usage: json, usageStatus: 'ready', usageError: null, updatedAt: Date.now() });
        } catch (error) {
          if (error?.name === 'AbortError') return;
          patch({ usageStatus: state.usage === null ? 'error' : 'ready', usageError: error instanceof Error ? error.message : String(error) });
        } finally {
          controllers.delete(controller);
        }
      }
      async function refreshAll() {
        if (refreshing) return;
        refreshing = true;
        patch({ refreshing: true });
        try { await refreshUsage(); } finally { refreshing = false; patch({ refreshing: false }); }
      }
      function setAlwaysOn(value) {
        if (state.alwaysOn === value) return;
        writeSettings(value);
        patch({ alwaysOn: value, expanded: false });
      }
      function setExpanded(value) { patch({ expanded: value === true }); }
      function start() {
        void refreshAll();
        const timer = setInterval(() => { if (document.visibilityState === 'visible') void refreshUsage(); }, USAGE_REFRESH_MS);
        const onVisible = () => { if (document.visibilityState === 'visible') void refreshAll(); };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
          clearInterval(timer);
          document.removeEventListener('visibilitychange', onVisible);
          window.removeEventListener('focus', onVisible);
          for (const controller of controllers) { try { controller.abort(); } catch {} }
          controllers.clear();
          listeners.clear();
        };
      }
      return {
        getSnapshot: () => state,
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        start, refreshAll, refreshUsage, setAlwaysOn, setExpanded,
      };
    }

    function useStore(store) {
      return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    }
    function tOf(props, ctx) {
      if (typeof props?.t === 'function') return props.t;
      try { return ctx.locale.bind(NS); } catch { return (key) => key; }
    }
    function compact(value) {
      if (!Number.isFinite(value)) return '—';
      const n = Math.max(0, value);
      if (n >= 1e12) return `${trim(n / 1e12)}T`;
      if (n >= 1e9) return `${trim(n / 1e9)}B`;
      if (n >= 1e6) return `${trim(n / 1e6)}M`;
      if (n >= 1e3) return `${trim(n / 1e3)}K`;
      return Math.round(n).toLocaleString('en-US');
    }
    function trim(value) {
      const digits = value >= 100 ? 0 : value >= 10 ? 1 : 2;
      return value.toFixed(digits).replace(/\.?0+$/, '');
    }
    function exact(value) { return Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—'; }
    function formatCost(value, currency) {
      if (!Number.isFinite(value)) return '—';
      const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency ? `${currency} ` : '$';
      if (value === 0) return `${symbol}0.00`;
      const amount = Math.abs(value) >= 1000 ? compact(value) : value >= 1 ? value.toFixed(2) : value >= 0.01 ? value.toFixed(3) : value.toFixed(4);
      return `${symbol}${amount}`;
    }
    function formatMoney(value, currency) { return formatCost(value, currency); }
    function walletTotals(usage) {
      const wallets = usage?.official?.balance?.wallets?.length ? usage.official.balance.wallets : usage?.balance?.wallets ?? [];
      return Array.isArray(wallets) ? wallets.filter((wallet) => Number.isFinite(wallet?.total)) : [];
    }
    function walletText(wallets) {
      return wallets.length > 0 ? wallets.map((wallet) => formatMoney(wallet.total, wallet.currency)).join(' · ') : '';
    }
    function relativeTime(time, t) {
      if (!Number.isFinite(time) || time <= 0) return t('bar.loading');
      const sec = Math.max(0, Math.round((Date.now() - time) / 1000));
      if (sec < 15) return t('bar.justNow');
      const minutes = Math.floor(sec / 60);
      if (minutes < 60) return `${minutes} ${t('bar.minutesAgo')}`;
      return `${Math.floor(minutes / 60)} ${t('bar.hoursAgo')}`;
    }
    function officialState(usage) {
      if (!usage?.official) return { kind: 'local', state: 'off' };
      if (usage.officialStatus === 'ready') return { kind: 'official', state: 'ready' };
      if (usage.officialStatus === 'stale') return { kind: 'stale', state: 'stale' };
      return { kind: 'local', state: 'error' };
    }
    function providerCounts(usage) {
      const official = usage?.official;
      if (official) return { apis: official.apiKeyCount ?? official.keys?.length ?? 0, models: official.models?.length ?? 0 };
      const providers = usage?.providers?.providers ?? [];
      return { apis: providers.length, models: providers.reduce((total, provider) => total + (provider.models?.length ?? 0), 0) };
    }

    function UsageIcon({ size = 16 }) {
      return h('svg', { className: 'dsh-usage-icon', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, focusable: false },
        h('path', { d: 'M4 17.5V13M9.33 17.5V8.5M14.67 17.5V5.5M20 17.5v-7', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' }),
        h('circle', { cx: 20, cy: 5.5, r: 2, fill: 'currentColor' }));
    }
    function RefreshIcon({ spinning = false }) {
      return h('svg', { className: spinning ? 'dsh-usage-icon dsh-usage-spinner' : 'dsh-usage-icon', width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, focusable: false },
        h('path', { d: 'M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }
    function ChevronIcon({ up = false }) {
      return h('svg', { className: 'dsh-usage-icon', width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, focusable: false, style: { transform: up ? 'rotate(180deg)' : undefined } },
        h('path', { d: 'm6 9 6 6 6-6', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }
    function Metric({ label, value, title, muted = false, warn = false, star = false, loading = false }) {
      return h('div', { className: 'dsh-usage-metric', title },
        h('span', { className: 'dsh-usage-label' }, label),
        h('span', { className: 'dsh-usage-value', 'data-muted': muted || loading ? 'true' : undefined, 'data-warn': warn || undefined }, value, star ? h('span', { className: 'dsh-usage-star' }, '*') : null));
    }

    function UsageBar(props) {
      const { store, ctx } = props;
      const state = useStore(store);
      const t = tOf(props, ctx);
      if (!state.alwaysOn) return null;
      const usage = state.usage;
      const official = usage?.official;
      const source = officialState(usage);
      const useOfficial = official !== null && official !== undefined;
      const today = useOfficial ? official.today : usage?.today;
      const total = useOfficial ? official.allTime : usage?.total;
      const currency = useOfficial ? official.currency : 'USD';
      const todayCost = useOfficial ? today?.cost : today?.costUsd;
      const totalCost = useOfficial ? total?.cost : total?.costUsd;
      const wallets = walletTotals(usage);
      const balance = walletText(wallets);
      const counts = providerCounts(usage);
      const badge = source.kind === 'official' ? t('bar.badgeOfficial') : source.kind === 'stale' ? t('bar.badgeStale') : t('bar.badgeLocal');
      const totalCostLabel = useOfficial ? t('bar.totalCost') : t('bar.localTotalCost');
      const totalTokensLabel = useOfficial ? t('bar.totalTokens') : t('bar.localTotalTokens');
      const statusState = source.state === 'ready' ? 'ready' : source.state === 'stale' ? 'stale' : source.state === 'off' ? 'off' : 'error';
      const apiState = official ? 'ok' : usage?.providersError ? 'error' : 'warn';
      return h('div', { className: 'dsh-usage-shell', 'data-dsh-plugin': 'token-usage-dashboard' },
        h('div', { className: 'dsh-usage-bar', role: 'region', 'aria-label': t('aria.bar') },
          h('div', { className: 'dsh-usage-brand' },
            h('button', { type: 'button', className: 'dsh-usage-brand-button', onClick: () => store.setExpanded(!state.expanded), 'aria-label': t('aria.details'), title: t('bar.title') },
              h(UsageIcon, { size: 17 }),
              h('span', { className: 'dsh-usage-brand-text' }, t('bar.title')),
              h('span', { className: 'dsh-usage-badge', 'data-kind': source.kind }, badge),
              h('span', { className: 'dsh-usage-live', 'data-state': statusState }))),
          h('div', { className: 'dsh-usage-metrics' },
            h(Metric, { label: t('bar.todayTokens'), value: compact(today?.tokens), title: today === undefined ? undefined : `${exact(today.tokens)} tokens`, loading: today === undefined }),
            h(Metric, { label: t('bar.todayCost'), value: formatCost(todayCost, currency), title: today === undefined ? undefined : `${formatCost(todayCost, currency)}`, loading: today === undefined }),
            h(Metric, { label: t('bar.balance'), value: balance || '—', muted: wallets.length === 0, title: usage?.balanceError ?? t('aria.balance') }),
            h(Metric, { label: totalCostLabel, value: formatCost(totalCost, currency), title: total === undefined ? undefined : `${formatCost(totalCost, currency)}`, loading: total === undefined }),
            h(Metric, { label: totalTokensLabel, value: compact(total?.tokens), title: total === undefined ? undefined : `${exact(total.tokens)} tokens`, loading: total === undefined })),
          h('div', { className: 'dsh-usage-actions' },
            h('button', { type: 'button', className: 'dsh-usage-apis', onClick: () => store.setExpanded(true), title: t('aria.providers'), 'aria-label': t('aria.providers') },
              h('span', { className: 'dsh-usage-apis-dot', 'data-state': apiState === 'ok' ? undefined : apiState }),
              `${counts.apis} ${t('bar.apis')} · ${counts.models} ${t('bar.models')}`),
            h('button', { type: 'button', className: 'dsh-usage-button', onClick: () => void store.refreshAll(), title: t('aria.refresh'), 'aria-label': t('aria.refresh'), disabled: state.refreshing }, h(RefreshIcon, { spinning: state.refreshing })),
            h('button', { type: 'button', className: 'dsh-usage-button', 'data-active': state.expanded ? 'true' : undefined, onClick: () => store.setExpanded(!state.expanded), title: state.expanded ? t('bar.closeDetails') : t('bar.details'), 'aria-label': state.expanded ? t('bar.closeDetails') : t('bar.details'), 'aria-expanded': state.expanded },
              h(ChevronIcon, { up: state.expanded }), h('span', { className: 'dsh-usage-hide-narrow' }, state.expanded ? t('bar.closeDetails') : t('bar.details'))),
            h('button', { type: 'button', className: 'dsh-usage-switch', role: 'switch', 'aria-checked': state.alwaysOn, 'aria-label': t('aria.toggle'), title: t('bar.alwaysOnTitle'), onClick: () => store.setAlwaysOn(!state.alwaysOn) },
              h('span', { className: 'dsh-usage-switch-label' }, t('bar.alwaysOn')),
              h('span', { className: 'dsh-usage-switch-track' }, h('span', { className: 'dsh-usage-switch-thumb' }))))),
        state.expanded ? h(UsageDetails, { state, t, store }) : null);
    }

    function StatCard({ title, bucket, currency, t }) {
      if (bucket === undefined || bucket === null) return h('div', { className: 'dsh-usage-card' }, h('div', { className: 'dsh-usage-card-title' }, title), h('div', { className: 'dsh-usage-empty' }, '—'));
      return h('div', { className: 'dsh-usage-card' },
        h('div', { className: 'dsh-usage-card-head' }, h('span', { className: 'dsh-usage-card-title' }, title), h('span', { className: 'dsh-usage-card-meta' }, `${exact(bucket.requests)} ${t('details.requests')}`)),
        h('div', { className: 'dsh-usage-hero' }, h('span', { className: 'dsh-usage-hero-value' }, compact(bucket.tokens)), h('span', { className: 'dsh-usage-hero-unit' }, t('details.tokens'))),
        h('div', { className: 'dsh-usage-cost-line' }, h('span', null, t('details.cost')), h('span', { className: 'dsh-usage-cost-value' }, formatCost(bucket.cost, currency))));
    }
    function LocalStatCard({ title, bucket, t }) {
      const rows = [['input', t('details.input'), bucket?.inputTokens], ['cacheRead', t('details.cacheRead'), bucket?.cacheReadTokens], ['cacheWrite', t('details.cacheWrite'), bucket?.cacheWriteTokens], ['output', t('details.output'), bucket?.outputTokens]];
      return h('div', { className: 'dsh-usage-card' },
        h('div', { className: 'dsh-usage-card-head' }, h('span', { className: 'dsh-usage-card-title' }, title), h('span', { className: 'dsh-usage-card-meta' }, `${bucket?.calls ?? 0} ${t('details.calls')}`)),
        h('div', { className: 'dsh-usage-hero' }, h('span', { className: 'dsh-usage-hero-value' }, compact(bucket?.tokens)), h('span', { className: 'dsh-usage-hero-unit' }, t('details.tokens'))),
        h('div', { className: 'dsh-usage-cost-line' }, h('span', null, t('details.cost')), h('span', { className: 'dsh-usage-cost-value' }, formatCost(bucket?.costUsd, 'USD')), h('span', { className: 'dsh-usage-cost-note' }, t('details.localEstimated'))),
        h('div', { className: 'dsh-usage-breakdown' },
          rows.map(([kind, label, value]) =>
            h('div', { className: 'dsh-usage-breakdown-row', key: kind, title: `${exact(value)} tokens` },
              h('span', { className: 'dsh-usage-dot', 'data-kind': kind }),
              h('span', null, label),
              h('b', null, compact(value))))));
    }
    function BalanceCard({ usage, t }) {
      const wallets = walletTotals(usage);
      const source = usage?.official?.balance?.wallets?.length ? t('details.balanceFromPlatform') : usage?.balance?.wallets?.length ? t('details.balanceFromKey') : '';
      return h('div', { className: 'dsh-usage-card' },
        h('div', { className: 'dsh-usage-card-head' }, h('span', { className: 'dsh-usage-card-title' }, t('details.balance')), h('span', { className: 'dsh-usage-card-meta' }, source || t('bar.unavailable'))),
        wallets.length > 0
          ? h('div', { className: 'dsh-usage-list' }, wallets.map((wallet) => h('div', { className: 'dsh-usage-list-row', key: wallet.currency, style: { gridTemplateColumns: '40px 1fr 1fr' } },
              h('span', { className: 'dsh-usage-list-name' }, wallet.currency),
              h('span', { className: 'dsh-usage-list-number' }, formatMoney(wallet.normal, wallet.currency)),
              h('span', { className: 'dsh-usage-list-number' }, formatMoney(wallet.bonus, wallet.currency)))))
          : h('div', { className: 'dsh-usage-empty' }, usage?.balanceError ? `${t('details.balanceUnavailable')}: ${usage.balanceError}` : t('details.balanceUnavailable')));
    }

    function OfficialSection({ usage, t }) {
      const official = usage?.official;
      const status = usage?.officialStatus;
      if (!official) {
        return h('section', { className: 'dsh-usage-section' },
          h('div', { className: 'dsh-usage-section-head' },
            h('span', { className: 'dsh-usage-section-title' }, t('details.officialTitle')),
            h('span', { className: 'dsh-usage-badge', 'data-kind': 'stale' }, t('details.bridgeOff'))),
          h('div', { className: 'dsh-usage-notice', 'data-kind': 'warn' },
            h('span', null, t('details.bridgeHelp')),
            h('a', { className: 'dsh-usage-link', href: PLATFORM_URL, target: '_blank', rel: 'noreferrer' }, t('details.openPlatform'))));
      }
      const received = official.receivedAt;
      return h('section', { className: 'dsh-usage-section' },
        h('div', { className: 'dsh-usage-section-head' },
          h('span', { className: 'dsh-usage-section-title' }, t('details.officialTitle')),
          h('span', { className: 'dsh-usage-badge', 'data-kind': status === 'stale' ? 'stale' : 'official' }, status === 'stale' ? t('details.bridgeStale') : t('details.bridgeReady')),
          h('span', { className: 'dsh-usage-section-meta' }, `${t('details.received')} ${relativeTime(received, t)}`),
          h('a', { className: 'dsh-usage-link', href: PLATFORM_URL, target: '_blank', rel: 'noreferrer' }, t('details.openPlatform'))),
        status === 'stale' ? h('div', { className: 'dsh-usage-notice', 'data-kind': 'warn' }, t('details.bridgeHelp')) : null,
        official.coverage?.complete === false
          ? h('div', { className: 'dsh-usage-notice', 'data-kind': 'warn' }, t('details.syncingAllTime'))
          : null,
        official.syncErrors?.length > 0
          ? h('div', { className: 'dsh-usage-notice', 'data-kind': 'warn' },
              `${t('details.syncErrors')} (${official.syncErrors.length}): ${official.syncErrors.slice(0, 3).join(' · ')}${official.syncErrors.length > 3 ? ' …' : ''}`)
          : null,
        h('div', { className: 'dsh-usage-grid' },
          h(StatCard, { title: t('details.today'), bucket: official.today, currency: official.currency, t }),
          h(StatCard, { title: t('details.allTime'), bucket: official.allTime, currency: official.currency, t }),
          h(BalanceCard, { usage, t }),
          h('div', { className: 'dsh-usage-card' },
            h('div', { className: 'dsh-usage-card-title' }, `${t('details.apiKeys')} / ${t('details.models')}`),
            h('div', { className: 'dsh-usage-hero' }, h('span', { className: 'dsh-usage-hero-value' }, String(official.apiKeyCount ?? 0)), h('span', { className: 'dsh-usage-hero-unit' }, t('details.apiKeys'))),
            h('div', { className: 'dsh-usage-cost-line' }, h('span', null, `${official.models?.length ?? 0} ${t('details.models')}`), h('span', { className: 'dsh-usage-cost-note' }, official.topModel ?? '')))),
        h('div', { className: 'dsh-usage-two-col' }, h(KeysCard, { official, t }), h(OfficialModelsCard, { official, t })),
        h('div', { className: 'dsh-usage-foot' },
          h('span', null, `${t('details.coverage')}: ${official.coverage?.from || '—'} → ${official.coverage?.to || '—'}`),
          h('span', null, t('details.apiKeyUsageNote')),
          h('span', null, t('details.allTimeNote'))));
    }

    function KeysCard({ official, t }) {
      const keys = Array.isArray(official.keys) ? official.keys : [];
      const head = h('div', { className: 'dsh-usage-list-row dsh-usage-list-head' },
        h('span', null, 'Key'),
        h('span', { className: 'dsh-usage-list-number' }, 'Tokens'),
        h('span', { className: 'dsh-usage-list-number' }, 'Cost'),
        h('span', { className: 'dsh-usage-list-number' }, t('details.requests')));
      const rows = keys.map((key) =>
        h('div', { className: 'dsh-usage-list-row', key: key.id },
          h('span', { style: { minWidth: 0 } },
            h('div', { className: 'dsh-usage-list-name', title: key.id }, key.name || key.id),
            h('div', { className: 'dsh-usage-chips' },
              (key.models ?? []).slice(0, 6).map((model) => h('span', { className: 'dsh-usage-chip', key: model }, model)))),
          h('span', { className: 'dsh-usage-list-number' }, compact(key.tokens)),
          h('span', { className: 'dsh-usage-list-number' }, formatCost(key.cost, official.currency)),
          h('span', { className: 'dsh-usage-list-number' }, exact(key.requests))));
      return h('div', { className: 'dsh-usage-card' },
        h('div', { className: 'dsh-usage-card-head' },
          h('span', { className: 'dsh-usage-card-title' }, t('details.keys30')),
          h('span', { className: 'dsh-usage-card-meta' }, String(keys.length))),
        keys.length === 0
          ? h('div', { className: 'dsh-usage-empty' }, t('details.noKeys'))
          : h('div', { className: 'dsh-usage-list' }, head, rows));
    }

    function OfficialModelsCard({ official, t }) {
      const models = Array.isArray(official.models) ? official.models : [];
      const rows = models.map((model) =>
        h('div', { className: 'dsh-usage-list-row', key: model.model, style: { gridTemplateColumns: '1fr 70px 70px' } },
          h('span', { className: 'dsh-usage-list-name' }, model.model),
          h('span', { className: 'dsh-usage-list-number' }, compact(model.tokens)),
          h('span', { className: 'dsh-usage-list-number' }, formatCost(model.cost, official.currency))));
      return h('div', { className: 'dsh-usage-card' },
        h('div', { className: 'dsh-usage-card-head' },
          h('span', { className: 'dsh-usage-card-title' }, t('details.modelUsage')),
          h('span', { className: 'dsh-usage-card-meta' }, String(models.length))),
        models.length === 0
          ? h('div', { className: 'dsh-usage-empty' }, t('details.noModels'))
          : h('div', { className: 'dsh-usage-list' }, rows));
    }

    function LocalSection({ usage, t }) {
      const providers = usage?.providers?.providers ?? [];
      const failures = usage?.providers?.failures ?? [];
      return h('section', { className: 'dsh-usage-section' },
        h('div', { className: 'dsh-usage-section-head' },
          h('span', { className: 'dsh-usage-section-title' }, t('details.localTitle')),
          h('span', { className: 'dsh-usage-section-meta' }, `${usage?.scan?.completedSessions ?? 0}/${usage?.scan?.totalSessions ?? 0} sessions`)),
        h('div', { className: 'dsh-usage-grid', 'data-cols': '2' },
          h(LocalStatCard, { title: t('details.localToday'), bucket: usage?.today, t }),
          h(LocalStatCard, { title: t('details.localLifetime'), bucket: usage?.total, t })),
        h('div', { className: 'dsh-usage-card' },
          h('div', { className: 'dsh-usage-card-head' }, h('span', { className: 'dsh-usage-card-title' }, t('details.providers')), h('span', { className: 'dsh-usage-card-meta' }, `${providers.length}`)),
          providers.length === 0 ? h('div', { className: 'dsh-usage-empty' }, usage?.providersError ?? t('details.noProviders')) : h('div', null,
            providers.map((provider) => h('div', { className: 'dsh-usage-provider', key: provider.id },
              h('div', { className: 'dsh-usage-provider-head' }, h('span', { className: 'dsh-usage-live' }), h('span', { className: 'dsh-usage-provider-name' }, provider.name || provider.id), h('span', { className: 'dsh-usage-provider-id' }, provider.id)),
              h('div', { className: 'dsh-usage-chips' }, (provider.models ?? []).slice(0, 20).map((model) => h('span', { className: 'dsh-usage-chip', key: model.id }, model.name || model.id)))))),
          failures.length > 0 ? h('div', { className: 'dsh-usage-notice', 'data-kind': 'warn' }, failures.map((failure) => `${failure.name || failure.id}: ${failure.error}`).join(' · ')) : null),
        h('div', { className: 'dsh-usage-foot' }, h('span', null, t('details.localNote')), h('span', null, t('details.excluded'))));
    }

    function UsageDetails({ state, t, store }) {
      const usage = state.usage;
      return h('div', { className: 'dsh-usage-details' },
        h(OfficialSection, { usage, t }),
        h(LocalSection, { usage, t }),
        h('div', { className: 'dsh-usage-foot' },
          h('span', null, t('details.officialNote')),
          state.usageError !== null ? h('span', { className: 'dsh-usage-foot-warn' }, `${t('details.error')}: ${state.usageError}`) : null,
          h('span', { style: { marginLeft: 'auto' } }, `${t('bar.updated')} ${relativeTime(state.updatedAt, t)}`),
          h('button', { type: 'button', className: 'dsh-usage-retry', onClick: () => void store.refreshAll() }, t('details.retry'))));
    }

    function UsageLauncher(props) {
      const { store, ctx } = props;
      const state = useStore(store);
      const t = tOf(props, ctx);
      if (state.alwaysOn) return null;
      const usage = state.usage;
      const official = usage?.official;
      const total = official ? official.allTime : usage?.total;
      const currency = official ? official.currency : 'USD';
      const cost = official ? total?.cost : total?.costUsd;
      return h('button', { type: 'button', className: 'dsh-usage-launcher', onClick: () => store.setAlwaysOn(true), title: t('bar.collapsed'), 'aria-label': t('aria.launcher') },
        h(UsageIcon, { size: 14 }), h('span', null, t('bar.title')), total === undefined ? null : h('span', { className: 'dsh-usage-launcher-cost' }, formatCost(cost, currency)));
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'token-usage-dashboard: dictionaries');
      const style = document.createElement('style');
      style.dataset.dshPlugin = 'token-usage-dashboard';
      style.textContent = CSS;
      ctx.effect(() => { document.head.append(style); return () => style.remove(); }, 'token-usage-dashboard: styles');
      const store = createStore();
      ctx.effect(() => store.start(), 'token-usage-dashboard: data refresh');
      ctx.slots.inject('shell.bottom', () => ctx.slots.register({ name: 'shell.bottom', id: 'token-usage-dashboard', locale: NS }, (props) => h(UsageBar, { ...props, store, ctx })));
      ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'token-usage-dashboard-launcher', order: 100, locale: NS }, (props) => h(UsageLauncher, { ...props, store, ctx })));
    }

    return { inject: ['slots', 'locale'], apply };
  },
});
