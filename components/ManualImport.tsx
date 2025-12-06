import React, { useState } from 'react';
import { NewsItem } from '../types';
import { ArrowLeft, FileInput, ClipboardPaste, Plus } from 'lucide-react';

interface ManualImportProps {
  onBack: () => void;
  onSubmit: (item: NewsItem) => void;
}

const ManualImport: React.FC<ManualImportProps> = ({ onBack, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const handleSubmit = () => {
    if (!content.trim()) {
        alert("请输入文章内容");
        return;
    }

    const newItem: NewsItem = {
        id: `manual-${Date.now()}`,
        title: title || '未命名手动素材',
        source: '手动导入',
        date: new Date().toISOString().split('T')[0],
        category: 'industry',
        content: content,
        selected: true, // Auto-select for generation
    };
    
    onSubmit(newItem);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-10 shrink-0">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-3">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
         </button>
         <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <FileInput className="w-5 h-5 text-blue-600 mr-2" />
            手动导入素材
         </h2>
      </header>

      <div className="max-w-3xl mx-auto w-full p-8 flex-1 flex flex-col">
         <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">文章标题（可选）</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="请输入标题，或者留空..."
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>
            
            <div className="mb-6 flex-1 flex flex-col">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    <span className="flex items-center">
                        <ClipboardPaste className="w-4 h-4 mr-1"/> 正文内容 / 政策原文
                    </span>
                </label>
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="请在此粘贴您需要改写的新闻、政策文件或行业报告..."
                    className="w-full flex-1 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                />
            </div>
            
            <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                    onClick={handleSubmit}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center shadow-lg transition-transform hover:-translate-y-0.5"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    添加到素材库并生成
                </button>
            </div>
         </div>
         
         <p className="text-center text-slate-400 text-xs mt-6">
            提示：手动导入的内容将作为“行业资讯”类素材，您可以直接基于此内容生成爆文。
         </p>
      </div>
    </div>
  );
};

export default ManualImport;
