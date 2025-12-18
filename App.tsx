import React, { useState, useRef, useMemo } from 'react';
import { Download, Trash2, FileText, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import { AppConfig, FontSize, MarginSize, AspectRatio } from './types';
import { TEMPLATES, FONTS } from './constants';
import * as htmlToImage from 'html-to-image';

/**
 * 诊断级错误解析器：彻底消灭 [object Object]
 * 能够解析标准 Error, DOMException, 以及各种匿名对象
 */
const stringifyError = (err: unknown): string => {
  if (err === null) return 'null';
  if (err === undefined) return 'undefined';
  if (typeof err === 'string') return err;

  try {
    // 如果是标准 Error 对象
    if (err instanceof Error) {
      const parts: string[] = [];
      if (err.name) parts.push(`错误类型: ${err.name}`);
      if (err.message) parts.push(`错误信息: ${err.message}`);
      if (err.stack) parts.push(`调用栈: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
      return parts.join('\n') || String(err);
    }

    const info: Record<string, string> = {
      '_type': Object.prototype.toString.call(err)
    };

    // 递归挖掘所有隐藏属性 (包括 DOMException 的隐藏字段)
    let current = err;
    const allProps = new Set<string>();
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach(p => allProps.add(p));
      current = Object.getPrototypeOf(current);
    }

    allProps.forEach(prop => {
      try {
        const val = (err as Record<string, unknown>)[prop];
        if (typeof val !== 'function' && typeof val !== 'symbol') {
          info[prop] = String(val);
        }
      } catch {
        // 忽略无法访问的属性
      }
    });

    // 针对跨域安全限制的精准识别与翻译
    if (info.name === 'SecurityError' || info.code === '18' || (info.message && info.message.includes('tainted'))) {
      return "【导出失败：图片跨域安全拦截】\n检测到有第三方图片设置了极其严厉的防盗链，禁止浏览器进行像素读取。\n\n解决办法：\n1. 请尝试删除最近粘贴的几张图片。\n2. 检查是否有 GIF 或极其高清的大图。\n3. 可以尝试手动保存图片后重新上传。";
    }

    const result = JSON.stringify(info, null, 2);
    return result === '{}' ? `[未知错误对象]: ${String(err)}` : result;
  } catch {
    return "解析报错失败: " + String(err);
  }
};

// 安全占位符：用于无法转换的图片
const SAFE_PLACEHOLDER = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='60' viewBox='0 0 300 60'%3E%3Crect width='300' height='60' fill='%23f1f5f9' rx='8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2364748b'%3E外部图片（导出时自动处理）%3C/text%3E%3C/svg%3E";

/**
 * 将图片转换为 base64 数据URL
 * 策略：先尝试带 CORS，失败后尝试通过代理
 */
const convertImageToBase64 = async (imgSrc: string): Promise<string | null> => {
  // 如果已经是 data URL，直接返回
  if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) {
    return imgSrc;
  }

  // 尝试1：直接带 CORS 加载（适用于支持 CORS 的图片）
  const tryWithCors = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };

      img.src = imgSrc;
    });
  };

  // 尝试2：通过公共代理获取（绕过 CORS）
  const tryWithProxy = async (): Promise<string | null> => {
    const proxyUrls = [
      `https://images.weserv.nl/?url=${encodeURIComponent(imgSrc)}&w=800`,
      `https://corsproxy.io/?${encodeURIComponent(imgSrc)}`
    ];

    for (const proxyUrl of proxyUrls) {
      try {
        const result = await new Promise<string | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          const timeout = setTimeout(() => resolve(null), 8000);

          img.onload = () => {
            clearTimeout(timeout);
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };

          img.onerror = () => {
            clearTimeout(timeout);
            resolve(null);
          };

          img.src = proxyUrl;
        });

        if (result) return result;
      } catch {
        continue;
      }
    }
    return null;
  };

  // 依次尝试
  let result = await tryWithCors();
  if (!result) {
    result = await tryWithProxy();
  }

  return result;
};

/**
 * 预处理 HTML 内容中的所有图片，转换为 base64
 */
const preprocessImagesInHtml = async (
  html: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ html: string; failedCount: number }> => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(imgRegex)];

  let processedHtml = html;
  let failedCount = 0;
  const total = matches.length;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const fullMatch = match[0];
    const imgSrc = match[1];

    onProgress?.(i + 1, total);

    if (!imgSrc.startsWith('data:') && !imgSrc.startsWith('blob:')) {
      const base64Src = await convertImageToBase64(imgSrc);
      if (base64Src) {
        const newImgTag = fullMatch.replace(imgSrc, base64Src);
        processedHtml = processedHtml.replace(fullMatch, newImgTag);
      } else {
        // 转换失败，使用占位符
        const newImgTag = fullMatch.replace(imgSrc, SAFE_PLACEHOLDER);
        processedHtml = processedHtml.replace(fullMatch, newImgTag);
        failedCount++;
      }
    }
  }

  return { html: processedHtml, failedCount };
};

/**
 * 清理 HTML 内容，移除多余空行
 */
const cleanupHtmlContent = (html: string): string => {
  if (!html) return html;

  let cleaned = html;

  // 移除连续的空段落 <p><br></p> 或 <p></p> 或 <p>&nbsp;</p>
  cleaned = cleaned.replace(/(<p[^>]*>(\s*(<br\s*\/?>|&nbsp;|\s)*\s*)<\/p>\s*){2,}/gi, '<p><br></p>');

  // 移除文末的空段落
  cleaned = cleaned.replace(/(<p[^>]*>(\s*(<br\s*\/?>|&nbsp;|\s)*\s*)<\/p>\s*)+$/gi, '');

  // 移除文末的空div
  cleaned = cleaned.replace(/(<div[^>]*>(\s*(<br\s*\/?>|&nbsp;|\s)*\s*)<\/div>\s*)+$/gi, '');

  // 移除末尾的多个 <br> 标签
  cleaned = cleaned.replace(/(<br\s*\/?>\s*)+$/gi, '');

  // 移除连续的 <br> 标签（超过2个的合并为2个）
  cleaned = cleaned.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  return cleaned.trim();
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({
    title: '微信公众号图文长图生成器',
    signature: '娇姐话AI圈',
    content: '',
    images: [],
    templateColor: TEMPLATES[3].id,
    aspectRatio: AspectRatio.FREE,
    fontFamily: FONTS[0].value,
    fontSize: FontSize.MEDIUM,
    margin: MarginSize.STANDARD,
    logo: 'https://api.dicebear.com/7.x/bottts/svg?seed=AI',
    articleLink: '',
    qrCodeImage: ''
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [editorKey, setEditorKey] = useState(0); // 用于强制重新创建编辑器
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const currentTemplate = useMemo(() => {
    return TEMPLATES.find(t => t.id === config.templateColor) || TEMPLATES[0];
  }, [config.templateColor]);

  const marginValue = useMemo(() => {
    switch (config.margin) {
      case MarginSize.COMPACT: return '16px';
      case MarginSize.LOOSE: return '48px';
      default: return '32px';
    }
  }, [config.margin]);

  const fontSizeValue = useMemo(() => {
    switch (config.fontSize) {
      case FontSize.SMALL: return '14px';
      case FontSize.LARGE: return '18px';
      default: return '16px';
    }
  }, [config.fontSize]);

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setConfig(prev => ({ ...prev, content: newContent }));
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    const clipboardData = e.clipboardData;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    if (html) {
      // 预处理 HTML 中的图片
      setExportProgress('正在处理粘贴内容中的图片...');
      const { html: processedHtml } = await preprocessImagesInHtml(html);
      document.execCommand('insertHTML', false, processedHtml);
      setExportProgress('');
    } else if (text) {
      document.execCommand('insertText', false, text);
    }

    // 触发内容更新
    if (editorRef.current) {
      setConfig(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  const exportAsImage = async () => {
    if (!previewRef.current) {
      setExportError('预览区域未找到');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportProgress('正在准备导出...');

    try {
      // 清理并预处理内容中的图片
      setExportProgress('正在预处理图片（解决跨域问题）...');
      const cleanedContent = cleanupHtmlContent(config.content);
      const { html: processedContent, failedCount } = await preprocessImagesInHtml(
        cleanedContent,
        (current, total) => setExportProgress(`正在处理图片 ${current}/${total}...`)
      );

      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 张图片无法转换，已使用占位符`);
      }

      // 临时更新预览区域的内容
      const contentElement = previewRef.current.querySelector('.rich-content-wrapper');
      if (contentElement) {
        contentElement.innerHTML = processedContent;
      }

      // 等待图片加载完成
      setExportProgress('正在等待图片加载...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress('正在生成图片...');

      const dataUrl = await htmlToImage.toPng(previewRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: false,
        cacheBust: true,
        // 过滤掉可能导致问题的外部图片
        filter: (node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src;
            // 允许 data URL 和本地图片
            if (src.startsWith('data:') || src.startsWith('blob:')) {
              return true;
            }
            // 检查是否为已知安全的图片源
            if (src.includes('dicebear.com') || src.includes('api.qrserver.com')) {
              return true;
            }
            // 其他外部图片，检查是否已转换为 base64
            return src.startsWith('data:');
          }
          return true;
        }
      });

      setExportProgress('正在下载...');

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `${config.title || '长图'}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setExportProgress('导出成功！');
      setTimeout(() => setExportProgress(''), 2000);

    } catch (err) {
      const errorMessage = stringifyError(err);
      console.error('导出失败详情:', err);
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const copyAsImage = async () => {
    if (!previewRef.current) {
      setExportError('预览区域未找到');
      return;
    }

    setIsCopying(true);
    setExportError(null);
    setCopySuccess(false);
    setExportProgress('正在准备复制...');

    try {
      // 清理并预处理内容中的图片
      setExportProgress('正在预处理图片（解决跨域问题）...');
      const cleanedContent = cleanupHtmlContent(config.content);
      const { html: processedContent, failedCount } = await preprocessImagesInHtml(
        cleanedContent,
        (current, total) => setExportProgress(`正在处理图片 ${current}/${total}...`)
      );

      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 张图片无法转换，已使用占位符`);
      }

      // 临时更新预览区域的内容
      const contentElement = previewRef.current.querySelector('.rich-content-wrapper');
      if (contentElement) {
        contentElement.innerHTML = processedContent;
      }

      // 等待图片加载完成
      setExportProgress('正在等待图片加载...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress('正在生成图片...');

      // 生成 Blob 用于复制到剪贴板
      const blob = await htmlToImage.toBlob(previewRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: false,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src;
            if (src.startsWith('data:') || src.startsWith('blob:')) {
              return true;
            }
            if (src.includes('dicebear.com') || src.includes('api.qrserver.com')) {
              return true;
            }
            return src.startsWith('data:');
          }
          return true;
        }
      });

      if (!blob) {
        throw new Error('生成图片失败');
      }

      setExportProgress('正在复制到剪贴板...');

      // 使用 Clipboard API 复制图片
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);

      setCopySuccess(true);
      setExportProgress('复制成功！');
      setTimeout(() => {
        setExportProgress('');
        setCopySuccess(false);
      }, 2000);

    } catch (err) {
      const errorMessage = stringifyError(err);
      console.error('复制失败详情:', err);

      // 特殊处理剪贴板权限错误
      if (errorMessage.includes('clipboard') || errorMessage.includes('NotAllowedError')) {
        setExportError('剪贴板访问被拒绝。请确保浏览器允许访问剪贴板，或尝试使用"导出图片"功能。');
      } else {
        setExportError(errorMessage);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const clearContent = () => {
    setConfig(prev => ({ ...prev, content: '' }));
    // 通过改变 key 强制 React 重新创建编辑器，避免 contentEditable 状态问题
    setEditorKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 左侧：编辑区域 */}
      <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 min-w-0">
        <div className="mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-700">内容编辑</h2>
            <span className="text-sm text-slate-500">支持从微信公众号直接复制粘贴</span>
          </div>
          <div
            key={editorKey}
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onPaste={handlePaste}
            dangerouslySetInnerHTML={{ __html: config.content }}
            className="min-h-[400px] p-6 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none prose prose-slate max-w-none"
            placeholder="在此粘贴微信公众号文章内容..."
          />
        </div>
      </div>

      {/* 中间：预览区域 */}
      <div className="flex-1 bg-slate-100 p-6 overflow-y-auto min-w-0">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-700">预览效果</h2>
          <p className="text-sm text-slate-500">实际导出尺寸，可滚动查看</p>
        </div>

        <div
          ref={previewRef}
          className={`preview-shadow rounded-lg overflow-hidden ${config.fontFamily}`}
          style={{
            background: currentTemplate.background,
            minHeight: '200px',
            width: '100%'
          }}
        >
          {/* 顶部装饰 */}
          <div className="grid-pattern p-8">
            {/* 内容区域 */}
            <div
              className="bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden relative"
              style={{ padding: marginValue }}
            >
              <div
                className="rich-content-wrapper prose prose-slate max-w-none prose-lg"
                style={{ fontSize: fontSizeValue }}
                dangerouslySetInnerHTML={{ __html: cleanupHtmlContent(config.content) }}
              />

              {/* 二维码放在内容区右下角 */}
              {config.articleLink && (
                <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(config.articleLink)}&bgcolor=ffffff&margin=0`}
                      alt="文章二维码"
                      className="w-24 h-24 rounded-lg shadow-sm"
                      crossOrigin="anonymous"
                    />
                    <span className="text-xs text-slate-500">扫码查看全文</span>
                  </div>
                </div>
              )}
            </div>

            {/* 底部署名 */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex items-center gap-4">
                {config.logo && (
                  <img
                    src={config.logo}
                    alt="Logo"
                    className="w-12 h-12 rounded-xl"
                    crossOrigin="anonymous"
                  />
                )}
                <div>
                  <p className="text-xs uppercase tracking-wider opacity-70" style={{ color: currentTemplate.secondary }}>
                    POWERED BY
                  </p>
                  <p className="text-lg font-bold" style={{ color: currentTemplate.text }}>
                    {config.signature}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：设置面板 */}
      <div className="w-80 bg-white border-l border-slate-200 p-6 overflow-y-auto flex-shrink-0">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            设置
          </h1>
          <p className="text-sm text-slate-500 mt-1">调整长图样式</p>
        </div>

        {/* 基础设置 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">模板颜色</label>
            <div className="grid grid-cols-5 gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setConfig(prev => ({ ...prev, templateColor: template.id }))}
                  className={`w-10 h-10 rounded-lg transition-all ${config.templateColor === template.id ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
                  style={{ background: template.background }}
                  title={template.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">字体</label>
            <select
              value={config.fontFamily}
              onChange={(e) => setConfig(prev => ({ ...prev, fontFamily: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {FONTS.map((font) => (
                <option key={font.value} value={font.value}>{font.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">署名</label>
            <input
              type="text"
              value={config.signature}
              onChange={(e) => setConfig(prev => ({ ...prev, signature: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="输入署名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">字体大小</label>
            <div className="flex gap-2">
              {Object.values(FontSize).map((size) => (
                <button
                  key={size}
                  onClick={() => setConfig(prev => ({ ...prev, fontSize: size }))}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                    config.fontSize === size
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {size === FontSize.SMALL ? '小' : size === FontSize.MEDIUM ? '中' : '大'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">边距</label>
            <div className="flex gap-2">
              {Object.values(MarginSize).map((margin) => (
                <button
                  key={margin}
                  onClick={() => setConfig(prev => ({ ...prev, margin: margin }))}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                    config.margin === margin
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {margin === MarginSize.COMPACT ? '紧凑' : margin === MarginSize.STANDARD ? '标准' : '宽松'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">文章链接</label>
            <input
              type="url"
              value={config.articleLink}
              onChange={(e) => setConfig(prev => ({ ...prev, articleLink: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="输入文章链接，自动生成二维码"
            />
            <p className="mt-1 text-xs text-slate-500">填写后将在底部显示二维码</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-6 space-y-3">
          <button
            onClick={exportAsImage}
            disabled={isExporting || isCopying}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {isExporting ? '正在导出...' : '导出图片'}
          </button>

          <button
            onClick={copyAsImage}
            disabled={isExporting || isCopying}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCopying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : copySuccess ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            {isCopying ? '正在复制...' : copySuccess ? '已复制！' : '复制长图'}
          </button>

          <button
            onClick={clearContent}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            清空内容
          </button>
        </div>

        {/* 导出状态 */}
        {exportProgress && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
            {exportProgress}
          </div>
        )}

        {/* 错误提示 */}
        {exportError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-wrap">{exportError}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
