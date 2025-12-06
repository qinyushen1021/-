import { NewsItem } from './types';

// Helper to get a date string relative to today
const getRelativeDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export const MOCK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: '住建部重磅：自11月起，严查施工现场“关键岗位”履职，违者降级！',
    source: '住房和城乡建设部',
    date: getRelativeDate(20), // Approx 3 weeks ago
    category: 'policy',
    selected: false,
    content: '住建部发布最新专项行动通知，重点打击“挂证”及人证不符。对于项目经理、总监长期不在岗的项目，一经查实，企业面临资质暂扣甚至降级风险。全国已有多家特级、一级企业被通报。',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: '2',
    title: '钢材价格两周暴涨15%，中小施工企业面临成本倒挂危机',
    source: '我的钢铁网',
    date: getRelativeDate(5),
    category: 'industry',
    selected: false,
    content: '受宏观政策刺激及冬季环保限产双重影响，螺纹钢价格突破近5个月新高。多家施工单位反映，原合同价格已无法覆盖成本，建议企业尽快启动价格调差机制或提前锁定库存。',
    imageUrl: 'https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?q=80&w=2064&auto=format&fit=crop'
  },
  {
    id: '3',
    title: '国务院督查组：年底前必须清偿拖欠中小企业账款',
    source: '国务院办公厅',
    date: getRelativeDate(45), // 1.5 months ago
    category: 'policy',
    selected: false,
    content: '国务院开展专项督查，要求各地政府及国企在年底前清偿无分歧欠款。对于恶意拖欠工程款的单位，将纳入失信惩戒名单。这对于资金链紧张的施工企业是重大利好。',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: '4',
    title: '多省出台建筑工人实名制管理新细则，工资专户监管再升级',
    source: '人社部',
    date: getRelativeDate(10),
    category: 'safety',
    selected: false,
    content: '新规要求工资发放必须通过专用账户，且与考勤数据严格匹配。数据实时上传至省级平台，由于考勤数据缺失导致的工资纠纷，企业将承担举证责任，败诉风险极大。',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: '5',
    title: '数字化转型补贴申报开启：建企上云最高补贴50万',
    source: '工信部中小企业局',
    date: getRelativeDate(80), // ~2.5 months ago
    category: 'industry',
    selected: false,
    content: '针对建筑行业“小散弱”特点，工信部推出数字化赋能专项。购买使用工程项目管理SaaS软件（如斗栱云等）的企业，可凭发票申请当年投入30%-50%的财政补贴，名额有限。',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
  },
  {
    id: '6',
    title: '安全事故通报：因脚手架坍塌，某项目经理被追究刑责',
    source: '国家应急管理部',
    date: getRelativeDate(3),
    category: 'safety',
    selected: false,
    content: '近期某地发生一起较大安全事故。调查显示，现场安全员形同虚设，隐患排查记录造假。涉事项目经理因涉嫌重大责任事故罪被刑拘。再次敲响安全生产警钟。',
    imageUrl: 'https://images.unsplash.com/photo-1590496793929-3647c60a29d6?q=80&w=2070&auto=format&fit=crop'
  }
];

export const TONE_OPTIONS = [
  { value: 'urgent', label: '紧急预警 (制造焦虑/强调风险)' },
  { value: 'emotional', label: '行业共鸣 (替建企发声/吐槽)' },
  { value: 'professional', label: '深度干货 (政策解读/利好)' },
];
