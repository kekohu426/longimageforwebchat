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
            <div className="p-5 border-b border-slate-100">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    🎴 {TOOL_BRAND_NAME}
                </h1>
                <p className="text-sm text-slate-500 mt-1">朋友圈营销卡片生成器</p>
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
                        二维码设置
                    </label>

                    <div className="space-y-3">
                        {/* 文章二维码 */}
                        <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                            <label className="text-xs font-medium text-slate-700">📱 文章二维码</label>
                            <input
                                type="url"
                                value={config.articleLink}
                                onChange={(e) => setConfig(prev => ({ ...prev, articleLink: e.target.value }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="文章链接"
                            />
                            <input
                                type="text"
                                value={config.articleQrText}
                                onChange={(e) => setConfig(prev => ({ ...prev, articleQrText: e.target.value }))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 outline-none"
                                placeholder="二维码下方文字（默认：扫码看全文）"
                            />
                        </div>

                        {/* 工具推广二维码 */}
                        <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl space-y-2 border border-amber-100">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-amber-800">🎴 {TOOL_BRAND_NAME}推广</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.showToolQr}
                                        onChange={(e) => setConfig(prev => ({ ...prev, showToolQr: e.target.checked }))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                            {config.showToolQr && (
                                <>
                                    <input
                                        type="url"
                                        value={config.toolLink}
                                        onChange={(e) => setConfig(prev => ({ ...prev, toolLink: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder="工具链接"
                                    />
                                    <input
                                        type="text"
                                        value={config.toolQrText}
                                        onChange={(e) => setConfig(prev => ({ ...prev, toolQrText: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                                        placeholder={`默认：${TOOL_BRAND_NAME}制作`}
                                    />
                                </>
                            )}
                        </div>
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
                            placeholder="智谱 GLM API Key"
                        />
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
                        <p className="text-[10px] text-violet-600 text-center">提取文章核心要点，生成营销卡片</p>
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
