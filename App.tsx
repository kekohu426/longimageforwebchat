import React, { useState, useRef, useMemo } from 'react';
import * as htmlToImage from 'html-to-image';
import { AppConfig, FontSize, MarginSize, CardSize } from './types';
import { TEMPLATES, FONTS, TOOL_PROMO_LINK } from './constants';
import { callGLM, stringifyError, preprocessImagesInHtml, extractTextFromHtml, cleanupHtmlContent } from './utils';
import { EditorPanel } from './components/EditorPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { SettingsPanel } from './components/SettingsPanel';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>({
    title: '卡片君',
    signature: '我的署名',
    content: '',
    images: [],
    templateId: TEMPLATES[0].id,
    cardSize: CardSize.PORTRAIT,
    fontFamily: FONTS[0].value,
    fontSize: FontSize.MEDIUM,
    margin: MarginSize.STANDARD,
    logo: 'https://api.dicebear.com/7.x/bottts/svg?seed=card',
    articleLink: '',
    articleQrText: '',
    toolLink: TOOL_PROMO_LINK,
    toolQrText: '',
    showToolQr: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [editorKey, setEditorKey] = useState(0);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('29108ee8ab0b4e09a4e12a74f0d536b2.c13tNpEYzmdvPZ8U');
  const previewRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const currentTemplate = useMemo(() => {
    return TEMPLATES.find(t => t.id === config.templateId) || TEMPLATES[0];
  }, [config.templateId]);

  const marginValue = useMemo(() => {
    switch (config.margin) {
      case MarginSize.COMPACT: return '16px';
      case MarginSize.LOOSE: return '32px';
      default: return '24px';
    }
  }, [config.margin]);

  const fontSizeValue = useMemo(() => {
    switch (config.fontSize) {
      case FontSize.SMALL: return '13px';
      case FontSize.LARGE: return '16px';
      default: return '14px';
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
      setExportProgress('正在处理粘贴内容...');
      const { html: processedHtml } = await preprocessImagesInHtml(html);
      document.execCommand('insertHTML', false, processedHtml);
      setExportProgress('');
    } else if (text) {
      document.execCommand('insertText', false, text);
    }

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
      setExportProgress('正在预处理图片...');
      const cleanedContent = cleanupHtmlContent(config.content);
      const { html: processedContent, failedCount } = await preprocessImagesInHtml(
        cleanedContent,
        (current, total) => setExportProgress(`处理图片 ${current}/${total}...`)
      );

      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 张图片无法转换`);
      }

      const contentElement = previewRef.current.querySelector('.rich-content-wrapper');
      if (contentElement) {
        contentElement.innerHTML = processedContent;
      }

      setExportProgress('渲染中...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const dataUrl = await htmlToImage.toPng(previewRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: currentTemplate.background.includes('gradient') ? undefined : currentTemplate.background,
        skipFonts: false,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src;
            if (src.startsWith('data:') || src.startsWith('blob:')) return true;
            if (src.includes('dicebear.com') || src.includes('api.qrserver.com')) return true;
            return src.startsWith('data:');
          }
          return true;
        }
      });

      const link = document.createElement('a');
      link.download = `卡片君_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setExportProgress('导出成功！');
      setTimeout(() => setExportProgress(''), 2000);

    } catch (err) {
      const errorMessage = stringifyError(err);
      console.error('导出失败:', err);
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
      setExportProgress('正在预处理图片...');
      const cleanedContent = cleanupHtmlContent(config.content);
      const { html: processedContent, failedCount } = await preprocessImagesInHtml(
        cleanedContent,
        (current, total) => setExportProgress(`处理图片 ${current}/${total}...`)
      );

      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 张图片无法转换`);
      }

      const contentElement = previewRef.current.querySelector('.rich-content-wrapper');
      if (contentElement) {
        contentElement.innerHTML = processedContent;
      }

      setExportProgress('生成中...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const blob = await htmlToImage.toBlob(previewRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: currentTemplate.background.includes('gradient') ? undefined : currentTemplate.background,
        skipFonts: false,
        cacheBust: true,
        filter: (node) => {
          if (node instanceof HTMLImageElement) {
            const src = node.src;
            if (src.startsWith('data:') || src.startsWith('blob:')) return true;
            if (src.includes('dicebear.com') || src.includes('api.qrserver.com')) return true;
            return src.startsWith('data:');
          }
          return true;
        }
      });

      if (!blob) {
        throw new Error('生成图片失败');
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      setCopySuccess(true);
      setExportProgress('复制成功！');
      setTimeout(() => {
        setExportProgress('');
        setCopySuccess(false);
      }, 2000);

    } catch (err) {
      const errorMessage = stringifyError(err);
      console.error('复制失败:', err);

      if (errorMessage.includes('clipboard') || errorMessage.includes('NotAllowedError')) {
        setExportError('剪贴板访问被拒绝，请尝试导出图片');
      } else {
        setExportError(errorMessage);
      }
    } finally {
      setIsCopying(false);
    }
  };

  const clearContent = () => {
    setConfig(prev => ({ ...prev, content: '' }));
    setEditorKey(prev => prev + 1);
  };

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setConfig(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  const smartFormat = async () => {
    if (!config.content.trim()) {
      setExportError('请先输入或粘贴内容');
      return;
    }

    if (!geminiApiKey.trim()) {
      setExportError('请先输入 GLM API Key');
      return;
    }

    setIsFormatting(true);
    setExportError(null);
    setExportProgress('正在智能排版...');

    try {
      const plainText = extractTextFromHtml(config.content);

      const prompt = `你是一个专业的排版设计师。请将以下文本转换为精美的 HTML 格式，适合制作朋友圈营销卡片。

要求：
1. 分析内容结构，识别标题、段落、要点
2. 使用 HTML 标签：<h2> 主标题，<h3> 小标题，<p> 段落，<ul><li> 要点
3. 重要内容用 <strong> 加粗
4. 内容要精炼，适合卡片展示
5. 直接输出 HTML，不要 markdown 或代码块

原始内容：
${plainText.slice(0, 6000)}

直接输出 HTML：`;

      let formattedHtml = await callGLM(geminiApiKey.trim(), prompt);
      formattedHtml = formattedHtml.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();

      setConfig(prev => ({ ...prev, content: formattedHtml }));
      setEditorKey(prev => prev + 1);

      setExportProgress('排版完成！');
      setTimeout(() => setExportProgress(''), 2000);

    } catch (err) {
      const errorMessage = stringifyError(err);
      console.error('智能排版失败:', err);

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setExportError('API Key 无效，请检查后重试');
      } else {
        setExportError(`排版失败: ${errorMessage}`);
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const generateSummary = async () => {
    if (!config.content.trim()) {
      setExportError('请先粘贴文章内容');
      return;
    }

    if (!geminiApiKey.trim()) {
      setExportError('请先输入 GLM API Key');
      return;
    }

    setIsGeneratingSummary(true);
    setExportError(null);
    setExportProgress('正在生成摘要...');

    try {
      const plainText = extractTextFromHtml(config.content);

      const prompt = `你是一个专业的营销文案专家。请将以下文章提炼为朋友圈营销卡片内容。

要求：
1. 提取 3-5 个核心要点，每个要点一句话
2. 开头用一个吸引眼球的标题
3. 结尾用引导语，引导扫码查看全文
4. 语言简洁有力，突出价值
5. 输出 HTML：<h2> 标题，<ul><li> 要点，<p> 引导语
6. 不要 markdown 或代码块

文章内容：
${plainText.slice(0, 6000)}

直接输出 HTML：`;

      let summaryHtml = await callGLM(geminiApiKey.trim(), prompt);
      summaryHtml = summaryHtml.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();

      setConfig(prev => ({ ...prev, content: summaryHtml }));
      setEditorKey(prev => prev + 1);

      setExportProgress('摘要生成成功！');
      setTimeout(() => setExportProgress(''), 2000);

    } catch (err) {
      const errorMessage = stringifyError(err);
      console.error('生成摘要失败:', err);

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setExportError('API Key 无效，请检查后重试');
      } else if (errorMessage.includes('429')) {
        setExportError('API 调用次数已达上限');
      } else {
        setExportError(`生成失败: ${errorMessage}`);
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden font-sans">
      <EditorPanel
        config={config}
        setConfig={setConfig}
        editorRef={editorRef}
        editorKey={editorKey}
        isFormatting={isFormatting}
        smartFormat={smartFormat}
        execFormat={execFormat}
        handleContentChange={handleContentChange}
        handlePaste={handlePaste}
      />

      <PreviewCanvas
        config={config}
        previewRef={previewRef}
        currentTemplate={currentTemplate}
        marginValue={marginValue}
        fontSizeValue={fontSizeValue}
      />

      <SettingsPanel
        config={config}
        setConfig={setConfig}
        TEMPLATES={TEMPLATES}
        FONTS={FONTS}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        generateSummary={generateSummary}
        isGeneratingSummary={isGeneratingSummary}
        exportAsImage={exportAsImage}
        copyAsImage={copyAsImage}
        clearContent={clearContent}
        isExporting={isExporting}
        isCopying={isCopying}
        copySuccess={copySuccess}
        exportProgress={exportProgress}
        exportError={exportError}
      />
    </div>
  );
};

export default App;
