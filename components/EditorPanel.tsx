import React from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Minus, RemoveFormatting, Wand2, Loader2 } from 'lucide-react';
import { AppConfig } from '../types';

interface EditorPanelProps {
    config: AppConfig;
    setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
    editorRef: React.RefObject<HTMLDivElement>;
    editorKey: number;
    isFormatting: boolean;
    smartFormat: () => void;
    execFormat: (command: string, value?: string) => void;
    handleContentChange: (e: React.FormEvent<HTMLDivElement>) => void;
    handlePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
    config,
    editorRef,
    editorKey,
    isFormatting,
    smartFormat,
    execFormat,
    handleContentChange,
    handlePaste
}) => {
    return (
        <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 min-w-0 bg-slate-50/50">
            <div className="mx-auto max-w-3xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-700">内容编辑</h2>
                    <span className="text-sm text-slate-500">支持富文本与 Markdown 粘贴</span>
                </div>

                {/* 格式工具栏 */}
                <div className="mb-4 flex flex-wrap items-center gap-1 p-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl shadow-sm sticky top-0 z-10">
                    <button
                        onClick={() => execFormat('bold')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="加粗"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => execFormat('italic')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="斜体"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={() => execFormat('formatBlock', '<h2>')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="大标题"
                    >
                        <Heading1 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => execFormat('formatBlock', '<h3>')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="小标题"
                    >
                        <Heading2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={() => execFormat('insertUnorderedList')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="无序列表"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => execFormat('insertOrderedList')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="有序列表"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => execFormat('insertHorizontalRule')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="分割线"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1" />
                    <button
                        onClick={() => execFormat('removeFormat')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                        title="清除格式"
                    >
                        <RemoveFormatting className="w-4 h-4" />
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={smartFormat}
                        disabled={isFormatting || !config.content.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                        title="AI 智能排版"
                    >
                        {isFormatting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Wand2 className="w-4 h-4" />
                        )}
                        {isFormatting ? '排版中...' : '智能排版'}
                    </button>
                </div>

                <div
                    key={editorKey}
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentChange}
                    onPaste={handlePaste}
                    dangerouslySetInnerHTML={{ __html: config.content }}
                    className="min-h-[600px] p-8 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none prose prose-slate max-w-none prose-p:my-2 prose-headings:font-bold prose-headings:text-slate-800"
                    placeholder="在此粘贴微信公众号文章内容..."
                />
            </div>
        </div>
    );
};
