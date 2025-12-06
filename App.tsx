import React, { useState, useEffect } from 'react';
import { MOCK_NEWS } from './constants';
import { NewsItem, AppView, GeneratedArticle } from './types';
import NewsCard from './components/NewsCard';
import ArticleGenerator from './components/ArticleGenerator';
import ImageGenerator from './components/ImageGenerator';
import HistoryView from './components/HistoryView';
import ManualImport from './components/ManualImport';
import { fetchRecentNews, fetchHotspotTrends } from './services/geminiService';
import { Layout, PlusCircle, RefreshCw, Layers, Globe, Clock, Flame, Newspaper, ChevronLeft, ChevronRight, Image as ImageIcon, FileInput } from 'lucide-react';

type TabType = 'news' | 'hotspots';

const ITEMS_PER_PAGE = 6;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('news');
  
  // Data States
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [hotspotItems, setHotspotItems] = useState<NewsItem[]>([]);
  
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // History State
  const [history, setHistory] = useState<GeneratedArticle[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<GeneratedArticle | undefined>(undefined);

  const loadData = async (type: TabType = 'news') => {
    setIsLoading(true);
    try {
      if (type === 'news') {
         // Load Industry News
         setNewsItems([]); 
         const liveNews = await fetchRecentNews();
         setNewsItems(liveNews.length > 0 ? liveNews : MOCK_NEWS);
      } else {
         // Load Hotspots
         setHotspotItems([]);
         const hotspots = await fetchHotspotTrends();
         setHotspotItems(hotspots);
      }
      setCurrentPage(1); // Reset to first page on reload
    } catch (error) {
      console.error("Error loading data:", error);
      if (type === 'news') setNewsItems(MOCK_NEWS);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadData('news');
    
    const savedHistory = localStorage.getItem('dougong_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);
  
  // Load hotspots when tab changes if empty
  useEffect(() => {
    if (activeTab === 'hotspots' && hotspotItems.length === 0) {
      loadData('hotspots');
    }
    setCurrentPage(1); // Reset pagination on tab switch
  }, [activeTab]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dougong_history', JSON.stringify(history));
  }, [history]);

  const toggleSelection = (id: string) => {
    // Determine which list contains the item
    if (newsItems.some(item => item.id === id)) {
      setNewsItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
    } else {
      setHotspotItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
    }
  };

  const handleSaveArticle = (article: GeneratedArticle) => {
    setHistory(prev => [article, ...prev]);
  };

  const handleSelectHistoryItem = (article: GeneratedArticle) => {
    setSelectedHistoryItem(article);
    setCurrentView(AppView.GENERATOR);
  };
  
  const handleManualSubmit = (item: NewsItem) => {
    // Add to news items and select it
    setNewsItems(prev => [item, ...prev]);
    // Switch to generator immediately
    setCurrentView(AppView.GENERATOR);
  };

  // Aggregate selected items from both lists
  const selectedNews = newsItems.filter(n => n.selected);
  const selectedHotspots = hotspotItems.filter(n => n.selected);
  const allSelected = [...selectedNews, ...selectedHotspots];
  const selectedCount = allSelected.length;

  // Pagination Logic
  const allCurrentItems = activeTab === 'news' ? newsItems : hotspotItems;
  const totalPages = Math.ceil(allCurrentItems.length / ITEMS_PER_PAGE);
  const currentItemsSlice = allCurrentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  if (currentView === AppView.GENERATOR) {
    return (
      <ArticleGenerator 
        selectedNews={allSelected} 
        initialArticle={selectedHistoryItem}
        onSave={handleSaveArticle}
        onBack={() => {
          setSelectedHistoryItem(undefined); // Clear selection when going back
          setCurrentView(AppView.DASHBOARD);
        }} 
      />
    );
  }
  
  if (currentView === AppView.IMAGE_GENERATOR) {
    return (
      <ImageGenerator 
        selectedNews={allSelected}
        onBack={() => setCurrentView(AppView.DASHBOARD)}
      />
    );
  }

  if (currentView === AppView.HISTORY) {
    return (
      <HistoryView 
        history={history}
        onSelectArticle={handleSelectHistoryItem}
        onBack={() => setCurrentView(AppView.DASHBOARD)}
      />
    );
  }
  
  if (currentView === AppView.MANUAL_IMPORT) {
    return (
        <ManualImport 
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            onSubmit={handleManualSubmit}
        />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(AppView.DASHBOARD)}>
              <div className="flex-shrink-0 flex items-center bg-blue-600 rounded-lg p-2 mr-3">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">斗栱云内容生成器</h1>
                <p className="text-xs text-slate-500">Dougong Cloud Content Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
               <button 
                onClick={() => setCurrentView(AppView.HISTORY)}
                className="text-sm font-medium flex items-center transition-colors text-slate-500 hover:text-blue-600"
              >
                <Clock className="w-4 h-4 mr-1.5" />
                历史记录
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border border-slate-300">
                Ad
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero / Stats Area */}
        <div className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">早安，内容主理人</h2>
            <p className="text-blue-100 max-w-xl">
              为您聚合全网<span className="font-bold text-yellow-300">爆款话题</span>与行业动态。
              AI 将协助您寻找独特切入点，打造<span className="font-bold text-white">10W+</span> 行业爆文。
            </p>
          </div>
          <div className="absolute right-0 top-0 h-full w-64 bg-white/5 skew-x-12 transform translate-x-16"></div>
        </div>

        {/* Tabs & Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          
          {/* Tabs */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center transition-all ${
                activeTab === 'news' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Newspaper className="w-4 h-4 mr-2" />
              行业资讯
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center transition-all ${
                activeTab === 'hotspots' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Flame className="w-4 h-4 mr-2" />
              全网热点
            </button>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto justify-between">
             <button 
              onClick={() => loadData(activeTab)}
              disabled={isLoading}
              className={`p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors ${isLoading ? 'animate-spin' : ''}`}
              title="刷新列表"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-4">
               {selectedCount > 0 && (
                <span className="text-sm text-slate-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                  已选素材：<strong className="text-blue-600">{selectedCount}</strong>
                </span>
               )}
              
              <div className="flex space-x-2">
                 {/* Manual Import Button (New) */}
                 <button
                    onClick={() => setCurrentView(AppView.MANUAL_IMPORT)}
                    className="flex items-center px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-all bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  >
                    <FileInput className="w-5 h-5 mr-2" />
                    手动导入
                  </button>

                 {/* Article Button */}
                 <button
                    onClick={() => setCurrentView(AppView.GENERATOR)}
                    disabled={selectedCount === 0}
                    className={`flex items-center px-4 py-2.5 rounded-lg shadow-sm font-semibold transition-all border ${
                      selectedCount > 0
                        ? 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    生成爆文
                  </button>

                  {/* Image Button */}
                  <button
                    onClick={() => setCurrentView(AppView.IMAGE_GENERATOR)}
                    disabled={selectedCount === 0}
                    className={`flex items-center px-4 py-2.5 rounded-lg shadow-md font-semibold transition-all ${
                      selectedCount > 0
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transform hover:-translate-y-0.5'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    生成配图
                  </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-dashed border-slate-200 min-h-[400px]">
            <Globe className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
            <p className="font-medium text-lg">
              {activeTab === 'news' ? '正在全网搜索最新建工资讯...' : '正在挖掘全网娱乐、社会、科技热点...'}
            </p>
            <p className="text-sm text-slate-400 mt-2">Connecting to Gemini Live Search...</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
              {currentItemsSlice.length > 0 ? currentItemsSlice.map(item => (
                <NewsCard key={item.id} item={item} onToggle={toggleSelection} />
              )) : (
                <div className="col-span-full py-12 text-center text-slate-400">
                  暂无内容，请点击刷新按钮重试。
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {allCurrentItems.length > ITEMS_PER_PAGE && (
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button 
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="text-sm font-medium text-slate-600">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>
                <button 
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            © 2024 斗栱云内容生成器 Powered by Gemini
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
