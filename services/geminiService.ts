import { GoogleGenAI } from "@google/genai";
import { NewsItem, GenerationConfig, ImageGenerationConfig } from "../types";

// Helper to get a date string X months ago
const getPastDate = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
};

export const fetchRecentNews = async (): Promise<NewsItem[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found, skipping live search.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sinceDate = getPastDate(5);
  
  // Increased request to 18 items to support pagination
  const prompt = `
    请利用 Google 搜索工具，搜集【中国建筑行业】最近 5 个月内（${sinceDate} 至今）的**高热度**资讯。
    
    请尽可能多地提供资讯（目标 **15-20条**），以便用户筛选。
    
    筛选标准（必须符合微信“爆文”潜质）：
    1. **政策突变**：住建部、人社部、安监局新规（资质、安全、工资、环保）。
    2. **市场波动**：原材料（钢材、水泥）价格、人工成本、运费。
    3. **行业红利**：数字化补贴、税收优惠、资质改革、国债项目。
    4. **大事件**：知名建企动态、重大安全事故通报。
    
    请严格按照以下 JSON 格式返回结果（不要包含 Markdown 代码块标记，只返回纯 JSON 字符串）：
    
    [
      {
        "title": "简练且吸引眼球的新闻标题",
        "source": "来源机构或媒体",
        "date": "YYYY-MM-DD",
        "category": "policy" | "industry" | "tender" | "safety",
        "content": "核心内容摘要，包含具体数字或政策要点，100字以内。",
        "url": "原文链接（如果有）",
        "imageUrl": "新闻相关的图片链接（尽量提供，优先提取OG Image或文章配图，如果没有则留空）"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const items = JSON.parse(jsonString);
      
      return items.map((item: any, index: number) => ({
        id: `live-news-${Date.now()}-${index}`,
        title: item.title || '无标题资讯',
        source: item.source || '网络新闻',
        date: item.date || new Date().toISOString().split('T')[0],
        category: validateCategory(item.category),
        content: item.content || '',
        url: item.url,
        imageUrl: item.imageUrl,
        selected: false
      }));

    } catch (parseError) {
      console.error("Failed to parse news JSON from Gemini response:", text);
      return [];
    }
  } catch (error) {
    console.error("Gemini Search API Error:", error);
    return [];
  }
};

export const fetchHotspotTrends = async (): Promise<NewsItem[]> => {
  if (!process.env.API_KEY) {
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const sinceDate = getPastDate(1); 
  
  // Broader scope: "All Internet Hotspots"
  const prompt = `
    请利用 Google 搜索工具，搜集目前全网（微博、抖音、知乎、头条）**最火爆、讨论度最高**的超级热点话题（${sinceDate} 至今）。
    
    **关键要求**：
    1. **不限领域**：可以是娱乐八卦、社会新闻、科技突破、网络流行梗、体育赛事、职场吐槽等任何领域。只要热度够高！
    2. **目标数量**：请提供 **12-18条** 高热度话题。
    3. 在返回的 contents 字段中，除了描述热点本身，请简短备注一句话：**这个热点可以如何强行关联到“建筑施工企业/包工头/项目经理”的痛点？**（例如：某明星离婚分财产 -> 联想到项目部拆伙分账难）。
    
    请严格按照以下 JSON 格式返回结果（只返回纯 JSON 字符串）：
    
    [
      {
        "title": "热点标题 (例如：'全网都在刷的XXX到底是什么？')",
        "source": "全网热搜/微信热点",
        "date": "YYYY-MM-DD",
        "category": "hotspot",
        "content": "热点描述 + 建筑行业关联脑洞",
        "url": "相关链接",
        "imageUrl": "图片链接"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const items = JSON.parse(jsonString);
      return items.map((item: any, index: number) => ({
        id: `live-hot-${Date.now()}-${index}`,
        title: item.title || '热点话题',
        source: item.source || '全网热搜',
        date: item.date || new Date().toISOString().split('T')[0],
        category: 'hotspot',
        content: item.content || '',
        url: item.url,
        imageUrl: item.imageUrl,
        selected: false
      }));
    } catch (parseError) {
      console.error("Failed to parse hotspot JSON", text);
      return [];
    }
  } catch (error) {
    console.error("Gemini Hotspot Search API Error:", error);
    return [];
  }
};

const validateCategory = (cat: string): string => {
  const valid = ['policy', 'industry', 'tender', 'safety', 'hotspot'];
  return valid.includes(cat) ? cat : 'industry';
};

export interface ArticleGenerationResult {
  titles: string[];
  content: string;
}

export const generateArticle = async (newsItems: NewsItem[], config: GenerationConfig): Promise<ArticleGenerationResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found in environment variables");
  }

  // Construct news content string, explicitly including image URLs for the model
  const newsContent = newsItems.map((item, index) => 
    `[素材${index + 1}] [${item.category === 'hotspot' ? '全网热点' : '行业资讯'}]
     标题：${item.title}
     内容：${item.content}
     ${item.imageUrl ? `图片链接：${item.imageUrl}` : ''}`
  ).join('\n\n');

  let toneDesc = '专业客观，深入浅出';
  if (config.tone === 'urgent') toneDesc = '紧迫感强，强调风险和时效，制造适当焦虑';
  if (config.tone === 'emotional') toneDesc = '情绪饱满，引发行业共鸣，替建筑人发声';

  const finalPrompt = `
你是一位拥有20年经验的**建筑行业智库专家**兼**资深财经主编**，擅长撰写深度、专业且具有高度传播性的行业分析文章。
你的读者群体是：**中国中小施工企业的老板、项目经理**。

请基于以下【资讯素材】，撰写一篇**专业、深度、高素养**的微信公众号文章。

【资讯素材】：
${newsContent}

【撰写核心要求】：

1.  **文风必须正式、高雅、有素养**：
    *   **严禁**使用“各位老板好”、“大家好”、“小编”、“亲们”等低幼化、江湖气或客服式的开场白。
    *   **严禁**使用“综上所述”、“总而言之”等机械连接词。
    *   开篇必须直接切入行业痛点、宏观背景或政策本质，展现出**俯瞰行业**的视角。
    *   语气要像一位**深沉的观察者**或**睿智的参谋**，理性冷峻中带着对行业的关切。

2.  **神级关联 (针对全网热点)**：
    *   如果素材中包含全网热点，请务必找到**清奇的角度**将其与建筑行业关联起来。这种关联要显得“意料之外，情理之中”。

3.  **内容深度**：
    *   分析要一针见血。不要仅仅复述新闻，要分析**新闻背后的利益博弈**。
    *   引用数据要精准，解读政策要切中企业利益要害（成本、罚款、资质、利润）。
    *   **图片智能植入**：请通过 \`![图片说明](图片链接)\` 语法自然插入素材中的图片。

4.  **文章结构**：
    *   **导语**：抛出核心冲突或重磅利好，3秒内抓住眼球。
    *   **正文**：分3-4个小标题，逻辑递进。
    *   **植入**：在探讨解决方案（如降本、合规）时，**极其隐晦且自然**地提及“斗栱云”作为行业数字化标杆案例。**禁止生硬硬广**。

5.  **排版规范**：
    *   小标题加粗。
    *   重点金句加粗。
    *   段落简短（不超过3-4行）。

【返回格式要求】
请**严格**按照以下 JSON 格式返回结果（不要包含 Markdown 代码块标记，只返回纯 JSON 字符串）：
{
  "titles": [
    "标题1：必须极具张力，20字以内", 
    "标题2：换一个角度，制造焦虑或惊喜", 
    "标题3：更接地气，引发老板共鸣"
  ],
  "content": "文章正文的Markdown内容（**不要**包含一级标题 # Title，从导语开始写）"
}
`;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
    });
    
    const text = response.text || "";
    // Clean potential markdown fencing
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const result = JSON.parse(jsonStr);
      return {
        titles: result.titles || ["自动生成标题"],
        content: result.content || text
      };
    } catch (e) {
      console.error("Failed to parse article JSON", e);
      // Fallback if model fails to output JSON
      return {
        titles: ["生成失败，请手动拟定"],
        content: text
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI生成服务暂时不可用，请检查网络或API Key。");
  }
};

export const refineArticle = async (currentContent: string, instruction: string): Promise<string> => {
   if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const prompt = `
    你是一位专业的文章主编。以下是一篇已生成的文章。
    用户提出了具体的修改意见，请按照意见重写文章或修改特定段落。

    【当前文章内容】：
    ${currentContent}

    【用户修改指令】：
    ${instruction}

    请注意：
    1. 保持微信公众号的排版风格（Markdown）。
    2. 文风保持高雅、专业，不要出现“好的，已为您修改”等对话内容，直接输出修改后的文章正文。
    3. 只要输出修改后的全文。
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || currentContent;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("AI 修改服务暂时不可用");
  }
}

/**
 * Step 1: Generate a text prompt for the image based on news or article content
 */
const createDetailedImagePrompt = async (newsItems: NewsItem[], config: ImageGenerationConfig, articleContext?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Use article context if available, otherwise use news titles
    let contextInput = "";
    if (articleContext) {
      // Truncate to avoid excessive tokens, focusing on the beginning (hook) and main body
      contextInput = `Viral Article Content: ${articleContext.substring(0, 3000)}`;
    } else {
      contextInput = `News Headlines: ${newsItems.map(n => n.title).join("; ")}`;
    }
    
    let styleInstruction = "";
    switch(config.style) {
        case 'infographic':
            styleInstruction = "A high-end, futuristic 3D isometric infographic or data visualization dashboard floating in the air. Professional blue and orange color scheme suitable for construction industry. Clean lines, charts, and graph elements representing growth or structure. No text.";
            break;
        case 'photorealistic':
            styleInstruction = "A cinematic, award-winning photorealistic shot of a modern construction site at golden hour. High detail, dramatic lighting, 8k resolution, depth of field. Professional engineering atmosphere. The image MUST strictly depict the scene described in the context.";
            break;
        case 'illustration':
            styleInstruction = "A clean, modern flat vector illustration suitable for corporate tech blog. Minimalist style, construction elements mixed with digital technology symbols (clouds, data streams). Soft blue and white palette.";
            break;
        case '3d-render':
            styleInstruction = "A 3D blender render of abstract construction materials (steel, concrete, glass) arranging themselves into a harmonious structure. Studio lighting, soft shadows, premium material textures.";
            break;
    }

    const prompt = `
      Create a detailed English prompt for an AI image generator.
      
      CRITICAL REQUIREMENT:
      The image must NOT be a generic construction site. 
      It MUST visually interpret the *specific metaphor*, *data point*, or *core conflict* in the following text:
      "${contextInput}"
      
      For example:
      - If text mentions "cost squeeze", show a vice grip compressing a building or coins.
      - If text mentions "safety alert", show a dramatic caution tape or storm clouds over a site.
      - If text mentions "digital transformation", show blueprints turning into glowing digital lines.
      
      The artistic style must be: ${styleInstruction}.
      
      Output ONLY the English prompt string, nothing else.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text || "Construction industry concept art, professional style";
};

/**
 * Step 2: Generate the actual image using the prompt
 */
export const generateMarketingImage = async (newsItems: NewsItem[], config: ImageGenerationConfig, articleContext?: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 1. Get the optimized prompt text
    const imagePrompt = await createDetailedImagePrompt(newsItems, config, articleContext);
    console.log("Generated Image Prompt:", imagePrompt);

    // 2. Call Image Generation Model
    try {
         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: imagePrompt }
                ]
            },
            config: {
                imageConfig: {
                    aspectRatio: config.aspectRatio,
                }
            }
         });

         // Extract image from response
         if (response.candidates?.[0]?.content?.parts) {
             for (const part of response.candidates[0].content.parts) {
                 if (part.inlineData && part.inlineData.data) {
                     return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                 }
             }
         }
         
         throw new Error("No image data received in response");

    } catch (e: any) {
        console.error("Image Gen Error:", e);
        throw new Error("图片生成失败，请稍后重试。");
    }
};