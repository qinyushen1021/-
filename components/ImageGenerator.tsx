import React, { useState } from 'react';
import { NewsItem, ImageGenerationConfig, ImageStyle, AspectRatio } from '../types';
import { generateMarketingImage } from '../services/geminiService';
import { ArrowLeft, Sparkles, Image as ImageIcon, Download, Share2, Loader2, RefreshCw, BarChart3, Camera, PenTool, Box } from 'lucide-react';

interface ImageGeneratorProps {
  selectedNews: NewsItem[];
  onBack: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ selectedNews, onBack }) => {
  const [config, setConfig] = useState<ImageGenerationConfig>({
    style: 'infographic',
    aspectRatio: '16:9'
  });
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (selectedNews.length === 0) {
        setError("请先至少选择一条资讯素材");
        return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Pass undefined for articleContext as this is the standalone mode based on news only
      const base64Image = await generateMarketingImage(selectedNews, config, undefined);
      setGeneratedImage(base64Image);
    } catch (err: any) {
      setError(err.message || "生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `dougong-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
              智能配图生成器
            </h2>
            <p className="text-xs text-slate-500">
               已选择 {selectedNews.length} 条素材进行可视化转换
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Configuration */}
        <div className="w-1/3 bg-white border-r border-slate-200 flex flex-col p-6 overflow-y-auto">
           
           {/* Section 1: Style Selection */}
           <div className="mb-8">
             <label className="block text-sm font-bold text-slate-800 mb-3">视觉风格</label>
             <div className="grid grid-cols-2 gap-3">
               <button 
                 onClick={() => setConfig({...config, style: 'infographic'})}
                 className={`p-3 rounded-lg border-2 text-left transition-all flex flex-col items-center justify-center h-24 ${config.style === 'infographic' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}
               >
                 <BarChart3 className="w-6 h-6 mb-2" />
                 <span className="text-xs font-medium">数据可视化</span>
               </button>

               <button 
                 onClick={() => setConfig({...config, style: 'photorealistic'})}
                 className={`p-3 rounded-lg border-2 text-left transition-all flex flex-col items-center justify-center h-24 ${config.style === 'photorealistic' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}
               >
                 <Camera className="w-6 h-6 mb-2" />
                 <span className="text-xs font-medium">写实摄影</span>
               </button>

               <button 
                 onClick={() => setConfig({...config, style: 'illustration'})}
                 className={`p-3 rounded-lg border-2 text-left transition-all flex flex-col items-center justify-center h-24 ${config.style === 'illustration' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}
               >
                 <PenTool className="w-6 h-6 mb-2" />
                 <span className="text-xs font-medium">扁平插画</span>
               </button>

               <button 
                 onClick={() => setConfig({...config, style: '3d-render'})}
                 className={`p-3 rounded-lg border-2 text-left transition-all flex flex-col items-center justify-center h-24 ${config.style === '3d-render' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}
               >
                 <Box className="w-6 h-6 mb-2" />
                 <span className="text-xs font-medium">3D 渲染</span>
               </button>
             </div>
             <p className="text-xs text-slate-400 mt-2">
               {config.style === 'infographic' && "生成具有科技感的数据图表或仪表盘概念图，适合展示行业趋势。"}
               {config.style === 'photorealistic' && "生成如电影质感的真实工地或建筑场景，适合情感共鸣类文章。"}
               {config.style === 'illustration' && "生成干净清爽的矢量插画，适合政策解读或轻松话题。"}
               {config.style === '3d-render' && "生成精美的抽象3D模型图，适合展示高端技术或材料。"}
             </p>
           </div>

           {/* Section 2: Aspect Ratio */}
           <div className="mb-8">
             <label className="block text-sm font-bold text-slate-800 mb-3">图片比例</label>
             <div className="flex space-x-2">
                {['16:9', '1:1', '9:16', '3:4'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig({...config, aspectRatio: ratio as AspectRatio})}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      config.aspectRatio === ratio 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
             </div>
             <p className="text-xs text-slate-400 mt-2">
               推荐：公众号封面(16:9)，朋友圈/小红书(3:4 或 1:1)。
             </p>
           </div>

           {/* Generate Button */}
           <div className="mt-auto">
             <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI 正在绘图中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>开始生成配图</span>
                  </>
                )}
              </button>
           </div>
        </div>

        {/* Right Panel: Preview Area */}
        <div className="w-2/3 bg-slate-100 p-8 flex flex-col items-center justify-center overflow-y-auto">
           {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-lg w-full">
              {error}
            </div>
           )}

           {!generatedImage && !isGenerating ? (
              <div className="text-center text-slate-400 opacity-60">
                 <ImageIcon className="w-20 h-20 mx-auto mb-4" />
                 <p className="text-xl font-medium">预览区域</p>
                 <p className="text-sm mt-2">点击生成后，AI 将为您创作独一无二的视觉大片</p>
              </div>
           ) : isGenerating ? (
              <div className="text-center">
                 <div className="w-64 h-64 bg-white rounded-lg shadow-inner flex items-center justify-center mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" />
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin z-10" />
                 </div>
                 <p className="text-slate-600 font-medium">正在构建视觉元素...</p>
                 <p className="text-xs text-slate-400 mt-1">大约需要 10-15 秒</p>
              </div>
           ) : (
              <div className="flex flex-col items-center max-w-full">
                 <div className="bg-white p-2 rounded-xl shadow-xl border border-slate-200 mb-6">
                    <img 
                      src={generatedImage!} 
                      alt="Generated" 
                      className="max-h-[60vh] max-w-full rounded-lg object-contain"
                    />
                 </div>
                 
                 <div className="flex space-x-4">
                    <button 
                      onClick={downloadImage}
                      className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 flex items-center shadow-md transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      下载原图
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="px-6 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center shadow-sm transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新生成
                    </button>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;