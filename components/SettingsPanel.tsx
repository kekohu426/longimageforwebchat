import React from 'react';
import { Download, Copy, Trash2, Check, Loader2, Sparkles, AlertCircle, QrCode, User, Palette, Type } from 'lucide-react';
import { AppConfig, Template, FontSize, MarginSize, CardSize } from '../types';
import { TOOL_PROMO_LINK, TOOL_BRAND_NAME } from '../constants';

interface SettingsPanelProps {
    config: AppConfig;
    setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
    TEMPLATES: Template[];
    FONTS: { name: string; value: string }[];
    geminiApiKey: string;
    setGeminiApiKey: (key: string) => void;
    generateSummary: () => void;
    isGeneratingSummary: boolean;
    exportAsImage: () => void;
    copyAsImage: () => void;
    clearContent: () => void;
    isExporting: boolean;
    isCopying: boolean;
    copySuccess: boolean;
    exportProgress: string;
    exportError: string | null;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    config,
    setConfig,
    TEMPLATES,
    FONTS,
    geminiApiKey,
    setGeminiApiKey,
    generateSummary,
    isGeneratingSummary,
    exportAsImage,
    copyAsImage,
    clearContent,
    isExporting,
    isCopying,
    copySuccess,
    exportProgress,
    exportError,
}) => {
    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-screen">
            {/* 头部 */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        🎴 {TOOL_BRAND_NAME}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">朋友圈营销卡片生成器</p>
                </div>
                <div className="relative group ml-2 flex flex-col items-center cursor-pointer">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 p-0.5 transition-transform hover:shadow-md">
                        <img 
                            src="/feedback-qr.jpg" 
                            alt="反馈二维码" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                const icon = document.createElement('div');
                                icon.innerHTML = '<svg class="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>';
                                e.currentTarget.parentElement?.appendChild(icon.firstChild!);
                            }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 scale-90 origin-top">反馈建议</span>

                    {/* 悬停放大显示 */}
                    <div className="absolute top-0 right-full mr-2 w-48 bg-white p-3 rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 origin-top-right transform translate-x-2 group-hover:translate-x-0">
                        <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden mb-2">
                            <img 
                                src="/feedback-qr.jpg" 
                                alt="反馈二维码大图" 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <p className="text-xs text-center text-slate-600 font-medium">扫码反馈产品建议</p>
                        <p className="text-[10px] text-center text-slate-400 mt-0.5">感谢您的支持！</p>
                    </div>
                </div>
            </div>

            {/* 可滚动设置区域 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* 卡片尺寸 */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">卡片尺寸</label>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.values(CardSize).map((size) => (
                            <button
                                key={size}
                                onClick={() => setConfig(prev => ({ ...prev, cardSize: size }))}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                                    config.cardSize === size
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {size === CardSize.SQUARE ? '1:1' : size === CardSize.PORTRAIT ? '3:4' : '长图'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 主题风格 */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" />
                        主题风格
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {TEMPLATES.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => setConfig(prev => ({ ...prev, templateId: template.id }))}
                                className={`relative h-16 rounded-xl transition-all overflow-hidden ${
                                    config.templateId === template.id
                                        ? 'ring-2 ring-slate-900 ring-offset-2'
                                        : 'hover:scale-105'
                                }`}
                                style={{ background: template.background }}
                                title={template.description}
                            >
                                <span className="absolute bottom-1 left-0 right-0 text-[10px] font-medium text-center"
                                    style={{ color: template.text }}>
                                    {template.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 字体设置 */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5" />
                        字体样式
                    </label>
                    <select
                        value={config.fontFamily}
                        onChange={(e) => setConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                    >
                        {FONTS.map((font) => (
                            <option key={font.value} value={font.value}>{font.name}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">字号</label>
                            <div className="flex rounded-lg bg-slate-100 p-0.5">
                                {Object.values(FontSize).map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setConfig(prev => ({ ...prev, fontSize: size }))}
                                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                            config.fontSize === size
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {size === FontSize.SMALL ? '小' : size === FontSize.MEDIUM ? '中' : '大'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1.5">边距</label>
                            <div className="flex rounded-lg bg-slate-100 p-0.5">
                                {Object.values(MarginSize).map((margin) => (
                                    <button
                                        key={margin}
                                        onClick={() => setConfig(prev => ({ ...prev, margin: margin }))}
                                        className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                            config.margin === margin
                                                ? 'bg-white text-slate-900 shadow-sm'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        {margin === MarginSize.COMPACT ? '紧' : margin === MarginSize.STANDARD ? '适' : '松'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 署名设置 */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        署名 / 品牌
                    </label>
                    <input
                        type="text"
                        value={config.signature}
                        onChange={(e) => setConfig(prev => ({ ...prev, signature: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                        placeholder="你的署名或品牌名"
                    />
                </div>

                {/* 二维码设置 */}
                <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5" />
                        文章二维码
                    </label>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                        <input
                            type="url"
                            value={config.articleLink}
                            onChange={(e) => setConfig(prev => ({ ...prev, articleLink: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                            placeholder="输入文章链接"
                        />
                        <input
                            type="text"
                            value={config.articleQrText}
                            onChange={(e) => setConfig(prev => ({ ...prev, articleQrText: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                            placeholder="二维码下方文字（默认：扫码看全文）"
                        />
                        <p className="text-[10px] text-slate-400">填写后将在卡片底部显示文章二维码</p>
                    </div>
                </div>

                {/* AI 功能 */}
                <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-semibold text-violet-900">AI 智能助手</span>
                    </div>

                    <div className="space-y-2">
                        <input
                            type="password"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            className="w-full px-3 py-2 bg-white/70 border border-violet-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500 outline-none"
                            placeholder="输入智谱 GLM API Key"
                        />
                        <div className="text-[10px] text-violet-600 bg-violet-50 rounded-lg p-2 space-y-1">
                            <p className="font-medium">获取 API Key：</p>
                            <ol className="list-decimal list-inside space-y-0.5 text-violet-500">
                                <li>访问 <a href="https://open.bigmodel.cn/" target="_blank" rel="noopener noreferrer" className="text-violet-700 underline hover:text-violet-900">智谱开放平台</a></li>
                                <li>注册/登录账号</li>
                                <li>进入「API Keys」页面</li>
                                <li>创建并复制 Key</li>
                            </ol>
                        </div>
                        <button
                            onClick={generateSummary}
                            disabled={isGeneratingSummary || !config.content.trim() || !geminiApiKey.trim()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-medium"
                        >
                            {isGeneratingSummary ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {isGeneratingSummary ? '正在思考...' : '生成智能摘要'}
                        </button>
                        <p className="text-[10px] text-violet-500 text-center">提取文章核心要点，生成营销卡片</p>
                    </div>
                </div>
            </div>

            {/* 底部操作区 - 固定 */}
            <div className="p-5 border-t border-slate-100 bg-white space-y-3">
                <button
                    onClick={exportAsImage}
                    disabled={isExporting || isCopying}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl"
                >
                    {isExporting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                    {isExporting ? '正在导出...' : '导出高清图片'}
                </button>

                <div className="flex gap-2">
                    <button
                        onClick={copyAsImage}
                        disabled={isExporting || isCopying}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all text-sm font-medium"
                    >
                        {isCopying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : copySuccess ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                        {isCopying ? '复制中' : copySuccess ? '已复制' : '复制'}
                    </button>
                    <button
                        onClick={clearContent}
                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        title="清空内容"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* 状态提示 */}
                {exportProgress && (
                    <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium text-center">
                        {exportProgress}
                    </div>
                )}

                {exportError && (
                    <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-3">{exportError}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
