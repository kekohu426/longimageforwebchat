import React from 'react';
import { AppConfig, Template, CardSize } from '../types';
import { cleanupHtmlContent } from '../utils';
import { TOOL_PROMO_LINK, TOOL_BRAND_NAME } from '../constants';

interface PreviewCanvasProps {
    config: AppConfig;
    previewRef: React.RefObject<HTMLDivElement>;
    currentTemplate: Template;
    marginValue: string;
    fontSizeValue: string;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
    config,
    previewRef,
    currentTemplate,
    marginValue,
    fontSizeValue
}) => {
    // 计算卡片容器样式
    const getCardContainerStyle = () => {
        switch (config.cardSize) {
            case CardSize.SQUARE:
                return { aspectRatio: '1 / 1' };
            case CardSize.PORTRAIT:
                return { aspectRatio: '3 / 4' };
            default:
                return { minHeight: '400px' };
        }
    };

    const hasArticleQr = config.articleLink?.trim();
    // 工具推广二维码始终显示
    const hasToolQr = true;

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 p-8 min-w-0 flex flex-col items-center overflow-hidden">
            {/* 标题区域 */}
            <div className="mb-6 w-full max-w-md flex items-center justify-between flex-shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        🎴 卡片预览
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">实时预览 · 所见即所得</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1.5 bg-white rounded-full text-slate-600 shadow-sm border border-slate-200">
                        {config.cardSize === CardSize.SQUARE ? '1:1 正方形' :
                         config.cardSize === CardSize.PORTRAIT ? '3:4 竖图' : '自适应'}
                    </span>
                </div>
            </div>

            {/* 可滚动的卡片区域 */}
            <div className="flex-1 w-full max-w-md overflow-y-auto min-h-0">
            {/* 卡片预览容器 - 长图模式不限制高度 */}
            <div
                className="w-full bg-white rounded-2xl shadow-2xl overflow-visible"
                style={config.cardSize === CardSize.LONG ? {} : getCardContainerStyle()}
            >
                {/* 实际导出区域 */}
                <div
                    ref={previewRef}
                    className={`w-full flex flex-col ${config.fontFamily}`}
                    style={{
                        background: currentTemplate.background,
                        minHeight: config.cardSize === CardSize.LONG ? 'auto' : '100%',
                    }}
                >
                    {/* 内容主体区域 */}
                    <div className="flex-1 p-5 flex flex-col">
                        {/* 内容卡片 */}
                        <div
                            className="flex-1 rounded-2xl shadow-lg flex flex-col"
                            style={{
                                background: currentTemplate.cardBg,
                                padding: marginValue
                            }}
                        >
                            {/* 富文本内容 */}
                            <div
                                className="rich-content-wrapper prose prose-slate max-w-none flex-1"
                                style={{
                                    fontSize: fontSizeValue,
                                    color: currentTemplate.text
                                }}
                                dangerouslySetInnerHTML={{ __html: cleanupHtmlContent(config.content) || '<p style="color: #94a3b8; text-align: center; margin-top: 2rem;">在左侧输入或粘贴内容...</p>' }}
                            />

                            {/* 二维码区域 */}
                            <div className="mt-6 pt-5 border-t border-slate-100">
                                <div className={`flex ${hasArticleQr ? 'justify-between' : 'justify-center'} items-end gap-4`}>
                                    {/* 文章二维码 */}
                                    {hasArticleQr && (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(config.articleLink)}&bgcolor=ffffff&margin=0`}
                                                    alt="文章二维码"
                                                    className="w-20 h-20"
                                                    crossOrigin="anonymous"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium text-center max-w-[100px]">
                                                {config.articleQrText || '扫码看全文'}
                                            </p>
                                        </div>
                                    )}

                                    {/* 工具推广二维码 - 始终显示 */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(TOOL_PROMO_LINK)}&bgcolor=ffffff&margin=0`}
                                                alt="卡片君"
                                                className="w-20 h-20"
                                                crossOrigin="anonymous"
                                            />
                                        </div>
                                        <p className="text-xs font-medium text-center max-w-[100px]" style={{ color: currentTemplate.accent }}>
                                            {TOOL_BRAND_NAME}制作
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 底部署名区域 */}
                    <div className="px-5 pb-5">
                        <div
                            className="flex items-center justify-between py-3 px-4 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.15)' }}
                        >
                            <div className="flex items-center gap-3">
                                {config.logo && (
                                    <img
                                        src={config.logo}
                                        alt="Logo"
                                        className="w-8 h-8 rounded-full border-2 border-white/30 shadow-sm object-cover"
                                        crossOrigin="anonymous"
                                    />
                                )}
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: currentTemplate.text }}
                                >
                                    {config.signature || '署名'}
                                </span>
                            </div>

                            {/* 品牌水印 */}
                            <div
                                className="text-xs opacity-60 flex items-center gap-1"
                                style={{ color: currentTemplate.text }}
                            >
                                <span>🎴</span>
                                <span>{TOOL_BRAND_NAME}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>

            {/* 底部提示 */}
            <p className="mt-6 text-xs text-slate-400 text-center flex-shrink-0">
                提示：导出的图片尺寸为 1080×1440 像素（3倍清晰度）
            </p>
        </div>
    );
};
