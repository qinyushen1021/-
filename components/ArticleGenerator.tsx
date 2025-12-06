import React, { useState, useRef, useEffect } from 'react';
import { NewsItem, GenerationConfig, GeneratedArticle, ImageGenerationConfig, ImageStyle, AspectRatio } from '../types';
import { TONE_OPTIONS } from '../constants';
import { generateArticle, refineArticle, generateMarketingImage } from '../services/geminiService';
import { Sparkles, Copy, ArrowLeft, Loader2, Send, Edit3, Eye, FileCheck, RefreshCw, Link as LinkIcon, Image as ImageIcon, Settings, BookOpen, Check, BarChart3, Camera, PenTool, Box, Download, Plus, Smartphone, LayoutTemplate } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArticleGeneratorProps {
  selectedNews?: NewsItem[];
  initialArticle?: GeneratedArticle; // For viewing/editing history
  onBack: () => void;
  onSave?: (article: GeneratedArticle) => void;
}

// Enhanced Professional WeChat Inline Styles
const wechatStyles = {
  h1: { 
    fontSize: '22px', 
    fontWeight: 'bold', 
    margin: '24px 0 20px', 
    color: '#333', 
    lineHeight: '1.4',
    textAlign: 'center' as const
  },
  h2: { 
    fontSize: '18px', 
    fontWeight: 'bold', 
    margin: '36px 0 18px', 
    color: '#2c3e50', 
    borderLeft: '4px solid #1a73e8', 
    paddingLeft: '14px', 
    lineHeight: '1.4',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: '0.5px'
  },
  h3: { 
    fontSize: '16px', 
    fontWeight: 'bold', 
    margin: '24px 0 12px', 
    color: '#34495e',
    display: 'flex',
    alignItems: 'center'
  },
  p: { 
    fontSize: '15px', 
    margin: '0 0 20px', 
    lineHeight: '1.8', // Slightly increased for better readability
    color: '#3f3f3f', 
    textAlign: 'justify' as const,
    letterSpacing: '0.5px'
  },
  ul: { 
    margin: '0 0 20px 10px', 
    paddingLeft: '1em', 
    color: '#3f3f3f' 
  },
  li: { 
    margin: '10px 0', 
    fontSize: '15px', 
    lineHeight: '1.8' 
  },
  strong: { 
    fontWeight: 'bold', 
    color: '#1a73e8' 
  },
  blockquote: { 
    margin: '28px 0', 
    padding: '20px 24px', 
    backgroundColor: '#f8f9fa', 
    borderLeft: '4px solid #b0bec5', 
    color: '#546e7a', 
    fontSize: '15px', 
    borderRadius: '6px',
    fontStyle: 'italic',
    lineHeight: '1.6'
  },
  img: { 
    display: 'block', 
    maxWidth: '100%', 
    height: 'auto',
    borderRadius: '8px', 
    margin: '24px auto', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
};

type LeftPanelTab = 'config' | 'sources' | 'image';
type GeneratorStep = 'config' | 'generating' | 'selection' | 'editor';

const ArticleGenerator: React.FC<ArticleGeneratorProps> = ({ selectedNews = [], initialArticle, onBack, onSave }) => {
  const [config, setConfig] = useState<GenerationConfig>({
    tone: 'professional', // Default to professional
    focus: '',
  });
  
  const [step, setStep] = useState<GeneratorStep>('config');
  const [leftTab, setLeftTab] = useState<LeftPanelTab>('config');

  // Generation Data
  const [candidateTitles, setCandidateTitles] = useState<string[]>([]);
  const [tempContent, setTempContent] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>(''); // For selection preview
  
  // Editor Data
  const [generatedContent, setGeneratedContent] = useState<string>(''); // Final content with title
  const [manualContent, setManualContent] = useState<string>(''); // For editing
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refinement & Edit State
  const [refineInstruction, setRefineInstruction] = useState('');
  const [editMode, setEditMode] = useState<'preview' | 'edit'>('preview');

  // Image Generation State (New)
  const [imageConfig, setImageConfig] = useState<ImageGenerationConfig>({
    style: 'infographic',
    aspectRatio: '16:9'
  });
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Scroll to bottom of chat/refine panel
  const refinePanelRef = useRef<HTMLDivElement>(null);

  // Initialize with history content if available
  useEffect(() => {
    if (initialArticle) {
      setGeneratedContent(initialArticle.content);
      setManualContent(initialArticle.content);
      setStep('editor');
    }
  }, [initialArticle]);

  // Sync manual content with generated content when generated content updates
  useEffect(() => {
    if (step === 'editor') {
        setManualContent(generatedContent);
    }
  }, [generatedContent, step]);
  
  // Set initial preview title
  useEffect(() => {
    if (candidateTitles.length > 0) {
        setPreviewTitle(candidateTitles[0]);
    }
  }, [candidateTitles]);

  const generateDisplayId = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
    return `NO.${dateStr}-${timeStr}`;
  };

  const handleGenerate = async () => {
    if (selectedNews.length === 0) return;
    
    setIsGenerating(true);
    setError(null);
    setStep('generating');
    
    try {
      // API now returns { titles: string[], content: string }
      const result = await generateArticle(selectedNews, config);
      setCandidateTitles(result.titles);
      setTempContent(result.content);
      setStep('selection');
    } catch (err: any) {
      setError(err.message || '生成出错');
      setStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectTitle = (title: string) => {
    // Combine title and content
    const finalContent = `# ${title}\n\n${tempContent}`;
    setGeneratedContent(finalContent);
    setManualContent(finalContent);
    setStep('editor');
    setLeftTab('image'); // Switch to image tab encouraging image gen

    // Auto-save the record with standardized ID
    if (onSave) {
      onSave({
        id: Date.now().toString(),
        displayId: generateDisplayId(),
        title: title,
        content: finalContent,
        timestamp: Date.now(),
      });
    }
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim()) return;
    setIsRefining(true);
    try {
      // Use the content from the manual edit buffer as the base for refinement
      const newContent = await refineArticle(manualContent, refineInstruction);
      setGeneratedContent(newContent);
      setManualContent(newContent); // Update edit buffer
      setRefineInstruction('');
    } catch (err: any) {
      setError(err.message || '修改出错');
    } finally {
      setIsRefining(false);
    }
  };
  
  const handleGenerateImage = async () => {
    if (!generatedContent) return;
    setIsGeneratingImage(true);
    setError(null);
    
    try {
      // Pass the current article content as context
      const img = await generateMarketingImage(selectedNews, imageConfig, generatedContent);
      setGeneratedImage(img);
    } catch (err: any) {
      setError(err.message || '配图生成出错');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const insertImageToArticle = () => {
    if (!generatedImage) return;
    // Insert at the top of the content (after title if possible, or just very top)
    // Find the first newline to insert after title
    const lines = manualContent.split('\n');
    let insertIndex = 0;
    if (lines[0].startsWith('# ')) {
        insertIndex = 1;
    }
    
    // Markdown image syntax
    const imageMarkdown = `\n![封面配图](${generatedImage})\n`;
    
    // Insert
    const newLines = [
        ...lines.slice(0, insertIndex),
        imageMarkdown,
        ...lines.slice(insertIndex)
    ];
    
    const newContent = newLines.join('\n');
    setManualContent(newContent);
    setGeneratedContent(newContent); // Update main content
    alert("配图已插入到文章头部！");
  };
  
  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `article-cover-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualContent(e.target.value);
  };

  const copyWeChatFormat = () => {
    const node = document.getElementById('wechat-preview-content');
    if (node) {
      const range = document.createRange();
      range.selectNode(node);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
        alert('已复制！可直接粘贴到微信公众号后台（样式已保留）');
      }
    }
  };

  const MarkdownComponents = {
    h1: ({node, ...props}: any) => <h1 style={wechatStyles.h1} {...props} />,
    h2: ({node, ...props}: any) => <h2 style={wechatStyles.h2} {...props} />,
    h3: ({node, ...props}: any) => <h3 style={wechatStyles.h3} {...props} />,
    p: ({node, ...props}: any) => <p style={wechatStyles.p} {...props} />,
    ul: ({node, ...props}: any) => <ul style={wechatStyles.ul} {...props} />,
    li: ({node, ...props}: any) => <li style={wechatStyles.li} {...props} />,
    strong: ({node, ...props}: any) => <strong style={wechatStyles.strong} {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote style={wechatStyles.blockquote} {...props} />,
    img: ({node, ...props}: any) => <img style={wechatStyles.img} {...props} />,
  };

  // --- RENDER HELPERS ---

  const renderConfigStep = () => (
    <div className="p-6 flex flex-col h-full animate-fadeIn">
      <div className="space-y-6 flex-1">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">文章语调</label>
          <div className="space-y-2">
            {TONE_OPTIONS.map((opt) => (
              <label 
                key={opt.value}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                  config.tone === opt.value 
                    ? 'border-purple-600 bg-purple-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="tone"
                  className="hidden"
                  checked={config.tone === opt.value}
                  onChange={() => setConfig({ ...config, tone: opt.value as any })}
                />
                <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${
                  config.tone === opt.value ? 'border-purple-600' : 'border-slate-300'
                }`}>
                  {config.tone === opt.value && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                </div>
                <span className="text-sm text-slate-700 font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <span className="font-bold">💡 提示：</span> AI 将扮演资深主编，摒弃“各位老板好”等口语，输出专业深度文章。
          </p>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-5 h-5" />
        <span>生成爆文</span>
      </button>
    </div>
  );
  
  const renderImageTab = () => (
      <div className="p-4 h-full flex flex-col overflow-y-auto">
        <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-1 text-purple-600"/> 配图风格
            </h3>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setImageConfig({...imageConfig, style: 'infographic'})} className={`p-2 text-xs border rounded-md ${imageConfig.style === 'infographic' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-slate-50'}`}>数据可视化</button>
                <button onClick={() => setImageConfig({...imageConfig, style: 'photorealistic'})} className={`p-2 text-xs border rounded-md ${imageConfig.style === 'photorealistic' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-slate-50'}`}>写实摄影</button>
                <button onClick={() => setImageConfig({...imageConfig, style: 'illustration'})} className={`p-2 text-xs border rounded-md ${imageConfig.style === 'illustration' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-slate-50'}`}>扁平插画</button>
                <button onClick={() => setImageConfig({...imageConfig, style: '3d-render'})} className={`p-2 text-xs border rounded-md ${imageConfig.style === '3d-render' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-slate-50'}`}>3D 渲染</button>
            </div>
            <p className="text-xs text-slate-400 mt-2">注：AI 将深度分析文章内容，生成强关联的专属配图，而非通用素材。</p>
        </div>
        
        <div className="mb-6">
             <h3 className="text-sm font-bold text-slate-800 mb-3">图片比例</h3>
             <div className="flex space-x-2">
                {['16:9', '1:1', '9:16'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setImageConfig({...imageConfig, aspectRatio: ratio as AspectRatio})}
                    className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                      imageConfig.aspectRatio === ratio 
                        ? 'bg-slate-800 text-white border-slate-800' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
             </div>
        </div>
        
        <button
            onClick={handleGenerateImage}
            disabled={isGeneratingImage}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-bold rounded-lg shadow hover:opacity-90 flex items-center justify-center transition-all disabled:opacity-70"
        >
            {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Sparkles className="w-4 h-4 mr-2"/>}
            {generatedImage ? '重新生成' : 'AI生成配图'}
        </button>
        
        {generatedImage && (
            <div className="mt-6 flex flex-col flex-1">
                <div className="bg-slate-100 rounded-lg p-2 border border-slate-200 mb-3 relative group">
                    <img src={generatedImage} className="w-full h-auto rounded shadow-sm" alt="Generated" />
                </div>
                <div className="flex space-x-2 mt-auto">
                    <button onClick={insertImageToArticle} className="flex-1 py-2 bg-slate-800 text-white text-xs rounded hover:bg-slate-900 flex items-center justify-center">
                        <Plus className="w-3 h-3 mr-1"/> 插入文章
                    </button>
                    <button onClick={downloadImage} className="py-2 px-3 bg-white border border-slate-300 text-slate-700 text-xs rounded hover:bg-slate-50 flex items-center justify-center">
                        <Download className="w-3 h-3"/>
                    </button>
                </div>
            </div>
        )}
      </div>
  );

  const renderRefineChat = () => (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="flex-1 p-4 overflow-y-auto" ref={refinePanelRef}>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-purple-100 text-purple-800 text-sm p-3 rounded-lg rounded-tl-none max-w-[90%]">
              文章已生成！
              <br/>您可以在“配图”栏中生成封面图，或在下方输入指令修改文章。
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 bg-white">
          <div className="relative">
            <textarea
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            placeholder="输入修改指令..."
            className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 pr-12 resize-none"
            rows={3}
            disabled={isRefining}
            />
            <button 
            onClick={handleRefine}
            disabled={!refineInstruction.trim() || isRefining}
            className="absolute bottom-2 right-2 p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isRefining ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <button 
          onClick={() => {
            if(confirm('确定要重新生成吗？当前修改将丢失。')) {
              setStep('config');
              setLeftTab('config');
              setGeneratedContent(''); 
              setManualContent('');
            }
          }}
          className="mt-3 text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center w-full"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> 重新开始
          </button>
      </div>
    </div>
  );

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
              <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
              {initialArticle ? '文章查看与优化' : 'AI 爆文生成器'}
            </h2>
            <p className="text-xs text-slate-500">
              {initialArticle 
                ? <span className="font-mono bg-slate-100 px-2 rounded">{initialArticle.displayId || '历史存档'}</span>
                : `已选择 ${selectedNews.length} 条资讯素材`
              }
            </p>
          </div>
        </div>
        
        {/* Top Actions when content exists */}
        {step === 'editor' && (
           <div className="flex space-x-3">
             <div className="flex bg-slate-100 p-1 rounded-lg">
               <button 
                 onClick={() => setEditMode('preview')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${editMode === 'preview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 <Eye className="w-4 h-4 mr-1.5" />
                 预览
               </button>
               <button 
                 onClick={() => setEditMode('edit')}
                 className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center transition-all ${editMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 <Edit3 className="w-4 h-4 mr-1.5" />
                 编辑
               </button>
             </div>
             
             <button 
              onClick={copyWeChatFormat}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm flex items-center space-x-2 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>复制到公众号</span>
            </button>
           </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Tabs + Config/Sources */}
        <div className={`${step === 'selection' ? 'w-1/4' : 'w-1/3'} bg-white border-r border-slate-200 flex flex-col z-0 transition-all duration-300`}>
          
          {/* Tab Switcher - Only hide in selection step to keep focus on titles */}
          {step !== 'selection' && (
            <div className="flex border-b border-slate-200">
                <button 
                onClick={() => setLeftTab('config')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center transition-colors ${leftTab === 'config' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                <Settings className="w-4 h-4 mr-2" />
                生成设置
                </button>
                <button 
                onClick={() => setLeftTab('sources')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center transition-colors ${leftTab === 'sources' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                <BookOpen className="w-4 h-4 mr-2" />
                引用素材 ({selectedNews.length})
                </button>
                {step === 'editor' && (
                    <button 
                    onClick={() => setLeftTab('image')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center transition-colors ${leftTab === 'image' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    配图
                    </button>
                )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {step === 'selection' ? (
                // SELECTION VIEW LEFT SIDE
                <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-600 mb-4 px-2">请选择最佳标题：</h3>
                    <div className="space-y-3">
                        {candidateTitles.map((title, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPreviewTitle(title)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                    previewTitle === title 
                                    ? 'border-purple-600 bg-purple-50 shadow-sm' 
                                    : 'border-slate-100 bg-white hover:border-purple-200 hover:shadow-sm'
                                }`}
                            >
                                <span className={`text-sm font-bold ${previewTitle === title ? 'text-purple-800' : 'text-slate-700'}`}>{title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : leftTab === 'image' ? renderImageTab() :
             leftTab === 'config' ? (
              step === 'editor' ? renderRefineChat() :
              renderConfigStep()
            ) : (
              // SOURCES LIST VIEW
              <div className="p-4 space-y-4">
                {selectedNews.length === 0 ? (
                   <p className="text-center text-slate-400 text-sm py-8">未选择任何素材</p>
                ) : (
                  selectedNews.map((item, idx) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50 hover:bg-white hover:shadow-sm transition-all">
                       <div className="flex justify-between items-start">
                         <span className="text-xs font-bold text-blue-600 mb-1">素材 {idx + 1}</span>
                         {item.url && (
                           <a href={item.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">
                             <LinkIcon className="w-3 h-3" />
                           </a>
                         )}
                       </div>
                       <h4 className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">{item.title}</h4>
                       
                       {item.imageUrl ? (
                         <div className="relative group">
                           <img src={item.imageUrl} alt="source" className="w-full h-32 object-cover rounded-md border border-slate-200" />
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                             <button 
                               onClick={() => window.open(item.imageUrl, '_blank')}
                               className="text-white text-xs bg-white/20 px-2 py-1 rounded backdrop-blur-sm flex items-center hover:bg-white/30"
                             >
                               <ImageIcon className="w-3 h-3 mr-1" /> 查看原图
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="h-20 bg-slate-100 rounded-md flex items-center justify-center text-slate-300 text-xs">
                           无配图
                         </div>
                       )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Content Area */}
        <div className={`${step === 'selection' ? 'w-3/4' : 'w-2/3'} bg-slate-100 p-8 overflow-y-auto flex flex-col items-center transition-all duration-300`}>
          {error && (
            <div className="w-full mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* VIEW: INITIAL EMPTY STATE */}
          {step === 'config' && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
              <FileCheck className="w-16 h-16 mb-4" />
              <p className="text-lg">请点击左侧按钮生成文章</p>
            </div>
          )}

          {/* VIEW: GENERATING LOADER */}
          {step === 'generating' && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">AI 正在深度创作中...</p>
              <p className="text-sm text-slate-400 mt-2">关联热点 · 寻找隐喻 · 植入痛点</p>
            </div>
          )}

          {/* VIEW: SELECTION PREVIEW (SPLIT VIEW) */}
          {step === 'selection' && (
            <div className="w-full h-full flex flex-col max-w-[900px]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                        <LayoutTemplate className="w-5 h-5 text-purple-600 mr-2"/>
                        效果预览
                    </h3>
                    <button
                        onClick={() => handleSelectTitle(previewTitle)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        确认使用此标题
                    </button>
                </div>
                
                <div className="bg-white shadow-xl rounded-xl flex-1 overflow-hidden border border-slate-200">
                    <div className="h-full overflow-y-auto p-12 custom-scrollbar bg-white">
                        {/* Simulating WeChat Style */}
                        <h1 style={wechatStyles.h1}>{previewTitle}</h1>
                        <ReactMarkdown components={MarkdownComponents}>
                            {tempContent}
                        </ReactMarkdown>
                    </div>
                </div>
                
                <button 
                 onClick={() => setStep('config')}
                 className="mt-4 text-slate-500 hover:text-slate-700 text-sm self-center"
                >
                不满意？返回重新生成
                </button>
            </div>
          )}

          {/* VIEW: EDITOR / PREVIEW */}
          {step === 'editor' && (
            <div className="w-full max-w-[900px] h-full flex flex-col">
              {/* Paper Container */}
              <div className="bg-white shadow-xl rounded-xl flex-1 overflow-hidden flex flex-col min-h-[600px] border border-slate-200">
                {editMode === 'preview' ? (
                  // PREVIEW MODE (Rendered HTML)
                  <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <div id="wechat-preview-content">
                       <ReactMarkdown components={MarkdownComponents}>
                        {manualContent}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  // EDIT MODE (Textarea)
                  <textarea 
                    className="flex-1 w-full h-full p-12 resize-none focus:outline-none font-mono text-sm text-slate-700 leading-relaxed bg-slate-50"
                    value={manualContent}
                    onChange={handleManualChange}
                    placeholder="在此处直接修改文章内容..."
                  />
                )}
              </div>
              
              <p className="text-center text-xs text-slate-400 mt-4">
                {editMode === 'preview' 
                  ? '当前为“公众号免排版模式”，点击上方“复制”即可直接粘贴发布。' 
                  : '您正在直接编辑 Markdown 源码，切换回“预览”查看最终效果。'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleGenerator;