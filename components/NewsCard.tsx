import React from 'react';
import { NewsItem } from '../types';
import { FileText, CheckCircle, Circle, ExternalLink, Image as ImageIcon, Flame } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  onToggle: (id: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ item, onToggle }) => {
  return (
    <div 
      onClick={() => onToggle(item.id)}
      className={`relative rounded-xl border-2 transition-all cursor-pointer hover:shadow-md group flex flex-col h-full overflow-hidden ${
        item.selected 
          ? 'border-blue-600 bg-blue-50/50' 
          : item.category === 'hotspot' 
             ? 'border-orange-100 bg-orange-50/20 hover:border-orange-300' 
             : 'border-slate-200 bg-white hover:border-blue-300'
      }`}
    >
      {item.imageUrl ? (
        <div className="h-32 w-full overflow-hidden relative">
          <img 
            src={item.imageUrl} 
            alt={item.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-3 text-white text-xs font-medium flex items-center">
            {item.category === 'policy' ? <span className="bg-red-500/80 px-1.5 py-0.5 rounded">政策</span> :
             item.category === 'safety' ? <span className="bg-orange-500/80 px-1.5 py-0.5 rounded">安全</span> :
             item.category === 'tender' ? <span className="bg-green-500/80 px-1.5 py-0.5 rounded">招标</span> :
             item.category === 'hotspot' ? <span className="bg-gradient-to-r from-orange-500 to-red-600 px-1.5 py-0.5 rounded flex items-center"><Flame className="w-3 h-3 mr-0.5 fill-white" />热点</span> :
             <span className="bg-blue-500/80 px-1.5 py-0.5 rounded">动态</span>}
          </div>
        </div>
      ) : (
        <div className={`h-2 bg-gradient-to-r ${item.category === 'hotspot' ? 'from-orange-400 to-red-500' : 'from-slate-200 to-slate-100'}`} />
      )}

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
           <span className="text-xs text-slate-400">{item.date}</span>
           <div className="text-blue-600">
            {item.selected ? <CheckCircle className="w-5 h-5 fill-blue-600 text-white" /> : <Circle className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />}
          </div>
        </div>
        
        <h3 className="text-base font-bold text-slate-800 mb-2 leading-tight">
          {item.category === 'hotspot' && <Flame className="w-4 h-4 text-orange-500 inline mr-1 align-text-bottom" />}
          {item.title}
        </h3>
        
        <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-grow">
          {item.content}
        </p>
        
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center text-xs text-slate-400">
            <FileText className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[120px]" title={item.source}>{item.source}</span>
          </div>
          <div className="flex space-x-2">
            {item.imageUrl && (
              <span className="flex items-center text-xs text-slate-400" title="包含配图">
                <ImageIcon className="w-3 h-3" />
              </span>
            )}
            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center text-xs text-blue-500 hover:text-blue-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                原文
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
