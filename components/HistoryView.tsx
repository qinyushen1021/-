import React from 'react';
import { GeneratedArticle } from '../types';
import { Clock, ChevronRight, FileText, Calendar, Hash } from 'lucide-react';

interface HistoryViewProps {
  history: GeneratedArticle[];
  onSelectArticle: (article: GeneratedArticle) => void;
  onBack: () => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onSelectArticle, onBack }) => {
  
  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <Clock className="w-5 h-5 text-blue-600 mr-2" />
          创作历史记录
        </h2>
        <span className="ml-3 text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          共 {history.length} 篇
        </span>
      </header>

      <div className="max-w-5xl mx-auto w-full p-6 md:p-8">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-lg text-slate-500 font-medium">暂无历史记录</p>
            <p className="text-sm text-slate-400 mt-1">去生成第一篇爆文吧！</p>
            <button 
              onClick={onBack}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              去创作
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((article) => (
              <div 
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                     {article.displayId && (
                       <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                         {article.displayId}
                       </span>
                     )}
                     <div className="flex items-center text-xs text-slate-400">
                       <Calendar className="w-3 h-3 mr-1" />
                       {formatDate(article.timestamp)}
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-1">
                   {/* Fallback title logic */}
                   {article.title || article.content.split('\n')[0].replace(/^#+\s*/, '') || '无标题文章'}
                </h3>

                <div className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-sans">
                   {/* Strip markdown chars for preview roughly */}
                   {article.content.replace(/[*#`]/g, '').slice(0, 150)}...
                </div>
                
                <div className="mt-4 flex items-center text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  点击查看详情与修改
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
