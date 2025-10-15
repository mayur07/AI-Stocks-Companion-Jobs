const axios = require('axios');
const rssParser = require('rss-parser');
const logger = require('./logger');

class EnhancedNewsAggregator {
  constructor() {
    this.parser = new rssParser();
    this.recentNews = new Map(); // Store recent news to avoid duplicates
    
    // 50+ Enhanced News Sources
    this.newsSources = [
      // Premium Financial News Sources
      {
        name: 'MarketWatch',
        url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['earnings', 'fed', 'rate', 'inflation', 'gdp', 'unemployment']
      },
      {
        name: 'CNBC Business',
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['breaking', 'alert', 'surge', 'plunge', 'rally', 'crash']
      },
      {
        name: 'Bloomberg Markets',
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['fed', 'treasury', 'bond', 'yield', 'inflation', 'gdp']
      },
      {
        name: 'Wall Street Journal',
        url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['earnings', 'ipo', 'merger', 'acquisition', 'dividend']
      },
      {
        name: 'Financial Times',
        url: 'https://www.ft.com/rss/home',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['central bank', 'monetary policy', 'fiscal', 'trade']
      },
      {
        name: 'Reuters Business',
        url: 'https://feeds.reuters.com/reuters/businessNews',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['earnings', 'fed', 'rate', 'inflation', 'gdp']
      },
      {
        name: 'Yahoo Finance',
        url: 'https://feeds.finance.yahoo.com/rss/2.0/headline',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['stock', 'market', 'trading', 'volume', 'price']
      },
      {
        name: 'Seeking Alpha',
        url: 'https://seekingalpha.com/feed.xml',
        category: 'analysis',
        priority: 'medium',
        impactKeywords: ['analysis', 'outlook', 'forecast', 'target', 'rating']
      },
      {
        name: 'Benzinga',
        url: 'https://www.benzinga.com/feeds/news',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['breaking', 'alert', 'earnings', 'merger', 'acquisition']
      },
      {
        name: 'InvestorPlace',
        url: 'https://investorplace.com/feed/',
        category: 'analysis',
        priority: 'medium',
        impactKeywords: ['stock', 'analysis', 'forecast', 'target', 'rating']
      },
      {
        name: 'Motley Fool',
        url: 'https://www.fool.com/feeds/index.aspx',
        category: 'analysis',
        priority: 'medium',
        impactKeywords: ['stock', 'analysis', 'investment', 'outlook']
      },
      {
        name: 'Zacks Investment Research',
        url: 'https://www.zacks.com/rss/stock_news.php',
        category: 'analysis',
        priority: 'medium',
        impactKeywords: ['earnings', 'analysis', 'rating', 'upgrade', 'downgrade']
      },
      {
        name: 'MarketWatch Breaking',
        url: 'https://feeds.marketwatch.com/marketwatch/marketpulse/',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['breaking', 'alert', 'urgent', 'crisis', 'emergency']
      },
      {
        name: 'CNBC Breaking News',
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100727362',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['breaking', 'alert', 'urgent', 'crisis', 'emergency']
      },
      {
        name: 'CNBC Breaking News Enhanced',
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
        category: 'financial',
        priority: 'critical',
        impactKeywords: ['breaking', 'alert', 'urgent', 'crisis', 'emergency', 'market crash', 'fed', 'earnings', 'merger', 'acquisition']
      },
      {
        name: 'Reuters Breaking',
        url: 'https://feeds.reuters.com/reuters/businessNews',
        category: 'financial',
        priority: 'high',
        impactKeywords: ['breaking', 'alert', 'urgent', 'crisis', 'emergency']
      },
      
      // Sector-Specific Sources
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com/feed/',
        category: 'technology',
        priority: 'medium',
        impactKeywords: ['ipo', 'funding', 'acquisition', 'startup', 'tech']
      },
      {
        name: 'Healthcare Finance',
        url: 'https://www.healthcarefinancenews.com/rss.xml',
        category: 'healthcare',
        priority: 'medium',
        impactKeywords: ['fda', 'approval', 'drug', 'biotech', 'pharma']
      },
      {
        name: 'Energy News',
        url: 'https://www.energynews.com/feed/',
        category: 'energy',
        priority: 'medium',
        impactKeywords: ['oil', 'gas', 'energy', 'renewable', 'solar', 'wind']
      },
      {
        name: 'Crypto News',
        url: 'https://cointelegraph.com/rss',
        category: 'crypto',
        priority: 'medium',
        impactKeywords: ['bitcoin', 'crypto', 'blockchain', 'ethereum', 'defi']
      },
      // Reddit News Sources - Special Processing
      {
        name: 'Reddit Business',
        url: 'https://www.reddit.com/r/business/hot.json',
        category: 'reddit',
        priority: 'high',
        impactKeywords: ['business', 'finance', 'economy', 'market', 'stock', 'investment'],
        isReddit: true,
        subreddit: 'business'
      },
      {
        name: 'Reddit Economics',
        url: 'https://www.reddit.com/r/economics/hot.json',
        category: 'reddit',
        priority: 'high',
        impactKeywords: ['economics', 'economy', 'fed', 'inflation', 'gdp', 'unemployment', 'policy'],
        isReddit: true,
        subreddit: 'economics'
      },
      {
        name: 'Reddit Finance',
        url: 'https://www.reddit.com/r/finance/hot.json',
        category: 'reddit',
        priority: 'high',
        impactKeywords: ['finance', 'banking', 'credit', 'loan', 'mortgage', 'investment', 'trading'],
        isReddit: true,
        subreddit: 'finance'
      },
      {
        name: 'CoinDesk',
        url: 'https://coindesk.com/arc/outboundfeeds/rss/',
        category: 'crypto',
        priority: 'medium',
        impactKeywords: ['bitcoin', 'crypto', 'blockchain', 'ethereum', 'defi']
      },
      {
        name: 'CoinTelegraph',
        url: 'https://cointelegraph.com/rss',
        category: 'crypto',
        priority: 'medium',
        impactKeywords: ['bitcoin', 'crypto', 'blockchain', 'ethereum', 'defi']
      },
      
      // International Financial News
      {
        name: 'BBC Business',
        url: 'http://feeds.bbci.co.uk/news/business/rss.xml',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['earnings', 'market', 'economy', 'business']
      },
      {
        name: 'CNN Business',
        url: 'http://rss.cnn.com/rss/money_latest.rss',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['market', 'economy', 'business', 'stocks']
      },
      {
        name: 'Forbes Business',
        url: 'https://www.forbes.com/business/feed/',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['business', 'market', 'economy', 'stocks']
      },
      {
        name: 'Business Insider',
        url: 'https://feeds.businessinsider.com/custom/all',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['business', 'market', 'economy', 'stocks']
      },
      {
        name: 'Fortune',
        url: 'https://fortune.com/feed/',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['business', 'market', 'economy', 'stocks']
      },
      {
        name: 'Fast Company',
        url: 'https://www.fastcompany.com/feed',
        category: 'business',
        priority: 'low',
        impactKeywords: ['business', 'innovation', 'startup', 'tech']
      },
      {
        name: 'Inc.com',
        url: 'https://www.inc.com/rss.xml',
        category: 'business',
        priority: 'low',
        impactKeywords: ['business', 'startup', 'entrepreneur', 'small business']
      },
      {
        name: 'Entrepreneur',
        url: 'https://www.entrepreneur.com/latest.rss',
        category: 'business',
        priority: 'low',
        impactKeywords: ['business', 'startup', 'entrepreneur', 'small business']
      },
      
      // Regional Financial News
      {
        name: 'Financial Post',
        url: 'https://financialpost.com/feed',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['canada', 'market', 'economy', 'business']
      },
      {
        name: 'Globe and Mail Business',
        url: 'https://www.theglobeandmail.com/business/rss.xml',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['canada', 'market', 'economy', 'business']
      },
      {
        name: 'Australian Financial Review',
        url: 'https://www.afr.com/rss.xml',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['australia', 'market', 'economy', 'business']
      },
      {
        name: 'Financial Times Asia',
        url: 'https://www.ft.com/asia-pacific?format=rss',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['asia', 'market', 'economy', 'business']
      },
      {
        name: 'Nikkei Asia',
        url: 'https://asia.nikkei.com/rss',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['asia', 'japan', 'market', 'economy']
      },
      {
        name: 'South China Morning Post',
        url: 'https://www.scmp.com/rss/91/feed',
        category: 'financial',
        priority: 'medium',
        impactKeywords: ['china', 'asia', 'market', 'economy']
      },
      
      // Specialized Financial News
      {
        name: 'Barrons',
        url: 'https://feeds.a.dj.com/rss/RSSOpinion.xml',
        category: 'analysis',
        priority: 'medium',
        impactKeywords: ['analysis', 'opinion', 'market', 'stocks']
      },
      {
        name: 'Kiplinger',
        url: 'https://www.kiplinger.com/rss',
        category: 'analysis',
        priority: 'low',
        impactKeywords: ['personal finance', 'investment', 'retirement']
      },
      {
        name: 'Money',
        url: 'https://money.com/feed/',
        category: 'analysis',
        priority: 'low',
        impactKeywords: ['personal finance', 'investment', 'money']
      },
      {
        name: 'MarketWatch Personal Finance',
        url: 'https://feeds.marketwatch.com/marketwatch/personal-finance/',
        category: 'analysis',
        priority: 'low',
        impactKeywords: ['personal finance', 'investment', 'retirement']
      },
      {
        name: 'CNBC Personal Finance',
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100646281',
        category: 'analysis',
        priority: 'low',
        impactKeywords: ['personal finance', 'investment', 'retirement']
      },
      
      // Real Estate & Commodities
      {
        name: 'Real Estate News',
        url: 'https://www.realestatenews.com/feed/',
        category: 'real-estate',
        priority: 'low',
        impactKeywords: ['real estate', 'housing', 'mortgage', 'property']
      },
      {
        name: 'Housing Wire',
        url: 'https://www.housingwire.com/feed/',
        category: 'real-estate',
        priority: 'low',
        impactKeywords: ['real estate', 'housing', 'mortgage', 'property']
      },
      {
        name: 'Kitco News',
        url: 'https://www.kitco.com/rss/',
        category: 'commodities',
        priority: 'medium',
        impactKeywords: ['gold', 'silver', 'precious metals', 'commodities']
      },
      {
        name: 'Oil Price',
        url: 'https://oilprice.com/rss/main',
        category: 'energy',
        priority: 'medium',
        impactKeywords: ['oil', 'gas', 'energy', 'crude']
      },
      {
        name: 'Rigzone',
        url: 'https://www.rigzone.com/rss/',
        category: 'energy',
        priority: 'medium',
        impactKeywords: ['oil', 'gas', 'energy', 'drilling']
      },
      
      // Banking & Finance
      {
        name: 'American Banker',
        url: 'https://www.americanbanker.com/rss',
        category: 'banking',
        priority: 'medium',
        impactKeywords: ['banking', 'finance', 'credit', 'loans']
      },
      {
        name: 'Banking Dive',
        url: 'https://www.bankingdive.com/feeds/',
        category: 'banking',
        priority: 'medium',
        impactKeywords: ['banking', 'finance', 'credit', 'loans']
      },
      {
        name: 'Credit Union Times',
        url: 'https://www.cutimes.com/rss',
        category: 'banking',
        priority: 'low',
        impactKeywords: ['credit union', 'banking', 'finance']
      },
      {
        name: 'Payments Source',
        url: 'https://www.paymentssource.com/rss',
        category: 'fintech',
        priority: 'medium',
        impactKeywords: ['payments', 'fintech', 'digital', 'mobile']
      },
      {
        name: 'Finextra',
        url: 'https://www.finextra.com/rss',
        category: 'fintech',
        priority: 'medium',
        impactKeywords: ['fintech', 'payments', 'digital', 'banking']
      },
      
      // Insurance & Risk
      {
        name: 'Insurance Journal',
        url: 'https://www.insurancejournal.com/rss/',
        category: 'insurance',
        priority: 'low',
        impactKeywords: ['insurance', 'risk', 'claims', 'coverage']
      },
      {
        name: 'Risk Management',
        url: 'https://www.riskmanagementmonitor.com/feed/',
        category: 'insurance',
        priority: 'low',
        impactKeywords: ['risk', 'insurance', 'compliance', 'security']
      },
      
      // Government & Regulatory
      {
        name: 'SEC News',
        url: 'https://www.sec.gov/news/rss',
        category: 'regulatory',
        priority: 'high',
        impactKeywords: ['sec', 'regulation', 'enforcement', 'compliance']
      },
      {
        name: 'Federal Reserve News',
        url: 'https://www.federalreserve.gov/feeds/press_all.xml',
        category: 'regulatory',
        priority: 'high',
        impactKeywords: ['fed', 'federal reserve', 'monetary policy', 'interest rates']
      },
      {
        name: 'CFTC News',
        url: 'https://www.cftc.gov/feeds/press',
        category: 'regulatory',
        priority: 'medium',
        impactKeywords: ['cftc', 'commodities', 'futures', 'regulation']
      },
      {
        name: 'FDIC News',
        url: 'https://www.fdic.gov/news/rss/',
        category: 'regulatory',
        priority: 'medium',
        impactKeywords: ['fdic', 'banking', 'deposits', 'regulation']
      },
      
      // Economic Data & Research
      {
        name: 'Bureau of Labor Statistics',
        url: 'https://www.bls.gov/feed/',
        category: 'economic',
        priority: 'high',
        impactKeywords: ['employment', 'unemployment', 'inflation', 'economic data']
      },
      {
        name: 'Bureau of Economic Analysis',
        url: 'https://www.bea.gov/feed/',
        category: 'economic',
        priority: 'high',
        impactKeywords: ['gdp', 'economic growth', 'economic data', 'statistics']
      },
      {
        name: 'Federal Reserve Economic Data',
        url: 'https://fred.stlouisfed.org/rss/',
        category: 'economic',
        priority: 'high',
        impactKeywords: ['economic data', 'statistics', 'fed', 'economy']
      },
      {
        name: 'World Bank News',
        url: 'https://www.worldbank.org/en/news/rss',
        category: 'economic',
        priority: 'medium',
        impactKeywords: ['world bank', 'global economy', 'development', 'economic']
      },
      {
        name: 'IMF News',
        url: 'https://www.imf.org/en/news/rss',
        category: 'economic',
        priority: 'medium',
        impactKeywords: ['imf', 'global economy', 'monetary', 'economic']
      }
    ];
    
    // Enhanced impact keywords with comprehensive coverage for top financial news
    this.impactKeywords = [
      // CRITICAL FINANCIAL EVENTS - TOP PRIORITY
      'takeover', 'take over', 'hostile takeover', 'friendly takeover', 'leveraged buyout', 'lbo',
      'acquisition', 'acquire', 'acquired', 'acquiring', 'acquirer', 'target company',
      'merger', 'merge', 'merged', 'merging', 'merger agreement', 'merger deal',
      'investment', 'invest', 'invested', 'investing', 'investor', 'investment deal',
      'earnings', 'earnings report', 'quarterly earnings', 'annual earnings', 'earnings beat', 'earnings miss',
      'earnings surprise', 'earnings guidance', 'earnings forecast', 'earnings estimate',
      'loss', 'losses', 'net loss', 'quarterly loss', 'annual loss', 'operating loss',
      'revenue', 'revenue growth', 'revenue decline', 'quarterly revenue', 'annual revenue',
      'profit', 'profits', 'net profit', 'quarterly profit', 'annual profit', 'operating profit',
      
      // HIGH IMPACT CORPORATE ACTIONS
      'ipo', 'initial public offering', 'going public', 'public offering', 'secondary offering',
      'dividend', 'dividend increase', 'dividend cut', 'dividend suspension', 'special dividend',
      'stock split', 'reverse split', 'stock buyback', 'share buyback', 'repurchase',
      'spin-off', 'spinoff', 'divestiture', 'asset sale', 'business sale',
      'partnership', 'strategic partnership', 'joint venture', 'alliance', 'collaboration',
      'funding', 'funding round', 'series a', 'series b', 'series c', 'venture capital',
      'private equity', 'hedge fund', 'institutional investor', 'activist investor',
      
      // EXECUTIVE & GOVERNANCE CHANGES
      'ceo', 'chief executive', 'ceo resignation', 'ceo departure', 'ceo appointment',
      'cfo', 'chief financial officer', 'cfo resignation', 'cfo departure', 'cfo appointment',
      'cto', 'chief technology officer', 'cto resignation', 'cto departure', 'cto appointment',
      'board', 'board member', 'board resignation', 'board appointment', 'board shakeup',
      'executive', 'executive departure', 'executive appointment', 'leadership change',
      'management', 'management change', 'management shakeup', 'management restructuring',
      
      // REGULATORY & LEGAL ISSUES
      'sec', 'securities and exchange commission', 'sec investigation', 'sec filing',
      'sec enforcement', 'sec settlement', 'sec fine', 'sec penalty',
      'regulatory', 'regulatory action', 'regulatory approval', 'regulatory investigation',
      'lawsuit', 'class action', 'legal action', 'litigation', 'settlement',
      'fraud', 'accounting fraud', 'financial fraud', 'securities fraud',
      'audit', 'audit issues', 'audit findings', 'audit problems', 'audit failure',
      'material weakness', 'going concern', 'delisting', 'trading halt', 'trading suspension',
      
      // FINANCIAL DISTRESS & RESTRUCTURING
      'bankruptcy', 'chapter 11', 'chapter 7', 'liquidation', 'restructuring',
      'debt restructuring', 'debt refinancing', 'debt default', 'debt crisis',
      'liquidity', 'liquidity crisis', 'liquidity problems', 'cash flow problems',
      'layoffs', 'job cuts', 'workforce reduction', 'headcount reduction',
      'cost cutting', 'expense reduction', 'operational efficiency', 'restructuring plan',
      
      // MARKET MOVEMENTS & VOLATILITY
      'surge', 'plunge', 'rally', 'crash', 'spike', 'drop', 'jump', 'fall',
      'volatility', 'market volatility', 'price volatility', 'trading volume',
      'market crash', 'flash crash', 'circuit breaker', 'bear market', 'bull market',
      'panic selling', 'margin call', 'forced liquidation', 'fire sale',
      'distressed assets', 'distressed sale', 'distressed company',
      
      // ECONOMIC INDICATORS & POLICY
      'fed', 'federal reserve', 'interest rate', 'rate cut', 'rate hike', 'rate decision',
      'inflation', 'deflation', 'stagflation', 'inflation data', 'cpi', 'ppi',
      'gdp', 'gdp growth', 'gdp contraction', 'economic growth', 'economic decline',
      'unemployment', 'jobless claims', 'employment data', 'labor market',
      'central bank', 'monetary policy', 'fiscal policy', 'quantitative easing', 'tapering',
      'trade war', 'tariff', 'tariffs', 'sanctions', 'trade agreement', 'trade deal',
      
      // SECTOR-SPECIFIC HIGH IMPACT
      'fda', 'fda approval', 'fda rejection', 'drug approval', 'drug trial', 'clinical trial',
      'vaccine', 'medical breakthrough', 'pharmaceutical', 'biotech', 'healthcare',
      'oil', 'oil price', 'crude oil', 'energy', 'natural gas', 'renewable energy',
      'bitcoin', 'crypto', 'cryptocurrency', 'blockchain', 'digital currency',
      'artificial intelligence', 'ai', 'machine learning', 'quantum computing',
      'autonomous vehicles', 'electric vehicles', 'tesla', 'space exploration',
      
      // BREAKING NEWS & URGENCY
      'breaking', 'alert', 'urgent', 'immediate', 'crisis', 'emergency', 'developing',
      'just in', 'latest', 'update', 'exclusive', 'sources say', 'according to sources',
      
      // FINANCIAL PERFORMANCE INDICATORS
      'beat', 'miss', 'exceed', 'fall short', 'outperform', 'underperform',
      'guidance', 'forecast', 'outlook', 'projection', 'estimate', 'consensus',
      'upgrade', 'downgrade', 'rating change', 'price target', 'analyst rating',
      'margin', 'gross margin', 'operating margin', 'net margin', 'profit margin',
      'cash', 'cash position', 'cash flow', 'free cash flow', 'operating cash flow',
      'debt', 'debt level', 'debt ratio', 'leverage', 'debt to equity',
      
      // MARKET SENTIMENT & OUTLOOK
      'bullish', 'bearish', 'neutral', 'optimistic', 'pessimistic', 'cautious',
      'recession', 'recovery', 'growth', 'decline', 'expansion', 'contraction',
      'outlook', 'forecast', 'prediction', 'expectation', 'anticipation',
      'risk', 'risk assessment', 'risk management', 'uncertainty', 'volatility',
      
      // SPECIFIC COMPANY ACTIONS
      'amazon', 'apple', 'microsoft', 'google', 'alphabet', 'tesla', 'meta', 'facebook',
      'nvidia', 'netflix', 'amd', 'intel', 'oracle', 'salesforce', 'adobe',
      'jpmorgan', 'bank of america', 'wells fargo', 'goldman sachs', 'morgan stanley',
      'walmart', 'target', 'costco', 'home depot', 'lowes', 'mcdonalds', 'starbucks',
      'exxon', 'chevron', 'conocophillips', 'schlumberger', 'occidental petroleum',
      
      // REDDIT-SPECIFIC HIGH IMPACT KEYWORDS
      'viral', 'trending', 'hot', 'front page', 'top post', 'highly upvoted',
      'breaking news', 'urgent update', 'market alert', 'trading halt',
      'reddit gold', 'awarded', 'gilded', 'platinum', 'silver award',
      'community choice', 'moderator approved', 'verified', 'confirmed',
      'live discussion', 'mega thread', 'sticky post', 'announcement'
    ];
  }

  /**
   * Fetch news from a single source
   */
  async fetchFromSource(source) {
    try {
      logger.info(`Fetching news from ${source.name}`);
      const feed = await this.parser.parseURL(source.url);
      
      // Calculate date 7 days ago for more comprehensive coverage
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      return feed.items
        .map(item => ({
          title: item.title,
          description: item.contentSnippet || item.content || item.summary,
          url: item.link,
          publishedAt: new Date(item.pubDate),
          source: source.name,
          category: source.category,
          priority: source.priority,
          impactScore: 0, // Will be calculated later
          relatedStocks: [], // Will be extracted later
          newsCategory: 'general', // Will be categorized later
          guid: item.guid || item.link
        }))
        .filter(item => {
          // Only include news from the last 7 days
          return item.publishedAt >= sevenDaysAgo;
        });
    } catch (error) {
      logger.error(`Failed to fetch from ${source.name}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch all news from all sources
   */
  async fetchAllNews() {
    const allNews = [];
    
    logger.info(`Starting enhanced news fetch from ${this.newsSources.length} sources`);
    
    // Fetch from all sources in parallel
    const fetchPromises = this.newsSources.map(source => this.fetchFromSource(source));
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      } else {
        logger.error(`Failed to fetch from ${this.newsSources[index].name}:`, result.reason);
      }
    });

    // Process and enhance each article
    const enhancedNews = allNews.map(article => {
      // Calculate impact score
      article.impactScore = this.calculateImpactScore(article);
      
      // Extract stock tickers
      article.relatedStocks = this.extractStockTickers(article);
      
      // Categorize news
      article.newsCategory = this.categorizeNews(article);
      
      return article;
    });

    // Sort by impact score and publication date
    enhancedNews.sort((a, b) => {
      if (b.impactScore !== a.impactScore) {
        return b.impactScore - a.impactScore;
      }
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    logger.info(`Fetched and processed ${enhancedNews.length} news articles from ${this.newsSources.length} sources`);
    return enhancedNews;
  }

  /**
   * Calculate impact score for a news article
   */
  calculateImpactScore(article) {
    let score = 0;
    const title = article.title.toLowerCase();
    const description = (article.description || '').toLowerCase();
    const content = title + ' ' + description;

    // Check for high-impact keywords
    this.impactKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        score += keyword.includes('fed') || keyword.includes('earnings') ? 3 : 2;
      }
    });

    // Check for stock tickers
    const stockTickers = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'JNJ', 'PG', 'KO', 'PEP',
      'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'ARKK', 'TQQQ', 'SQQQ'
    ];
    
    stockTickers.forEach(ticker => {
      if (content.includes(ticker.toLowerCase())) {
        score += 2;
      }
    });

    // Check for urgency indicators
    const urgencyWords = ['breaking', 'urgent', 'alert', 'immediate', 'now', 'today'];
    urgencyWords.forEach(word => {
      if (content.includes(word)) {
        score += 3;
      }
    });

    // Check for market movement indicators
    const movementWords = ['surge', 'plunge', 'rally', 'crash', 'spike', 'drop', 'jump', 'fall'];
    movementWords.forEach(word => {
      if (content.includes(word)) {
        score += 2;
      }
    });

    // Check for numbers (percentages, dollar amounts)
    const numberPattern = /(\d+\.?\d*%|\$\d+\.?\d*[bmk]?)/gi;
    const numbers = content.match(numberPattern);
    if (numbers && numbers.length > 0) {
      score += 1;
    }

    // Source priority bonus
    if (article.priority === 'high') {
      score += 1;
    }

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Extract stock tickers from article content
   */
  extractStockTickers(article) {
    const content = (article.title + ' ' + (article.description || '')).toUpperCase();
    const foundTickers = [];
    
    const stockTickers = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'JNJ', 'PG', 'KO', 'PEP',
      'SPY', 'QQQ', 'IWM', 'VTI', 'VOO', 'ARKK', 'TQQQ', 'SQQQ'
    ];
    
    stockTickers.forEach(ticker => {
      if (content.includes(ticker)) {
        foundTickers.push(ticker);
      }
    });

    return foundTickers;
  }

  /**
   * Categorize news article
   */
  categorizeNews(article) {
    const content = (article.title + ' ' + (article.description || '')).toLowerCase();
    
    if (content.includes('earnings') || content.includes('quarterly') || content.includes('revenue')) {
      return 'earnings';
    } else if (content.includes('fed') || content.includes('federal reserve') || content.includes('interest rate')) {
      return 'fed';
    } else if (content.includes('ipo') || content.includes('initial public offering')) {
      return 'ipo';
    } else if (content.includes('merger') || content.includes('acquisition') || content.includes('deal')) {
      return 'm&a';
    } else if (content.includes('dividend') || content.includes('buyback') || content.includes('split')) {
      return 'corporate';
    } else if (content.includes('inflation') || content.includes('gdp') || content.includes('unemployment')) {
      return 'economic';
    } else if (content.includes('crypto') || content.includes('bitcoin') || content.includes('blockchain')) {
      return 'crypto';
    } else if (content.includes('oil') || content.includes('energy') || content.includes('gas')) {
      return 'energy';
    } else if (content.includes('tech') || content.includes('ai') || content.includes('software')) {
      return 'technology';
    } else {
      return 'general';
    }
  }

  /**
   * Check for new high-impact news
   */
  async checkForNewNews() {
    try {
      const allNews = await this.fetchAllNews();
      
      // Filter for high-impact news (score >= 5)
      const highImpactNews = allNews.filter(article => article.impactScore >= 5);
      
      // Check for new news (not in recent cache)
      const newNews = highImpactNews.filter(article => {
        const key = article.guid || article.url;
        if (this.recentNews.has(key)) {
          return false;
        }
        this.recentNews.set(key, article);
        return true;
      });

      // Clean up old entries from cache (keep last 1000)
      if (this.recentNews.size > 1000) {
        const entries = Array.from(this.recentNews.entries());
        this.recentNews.clear();
        entries.slice(-500).forEach(([key, value]) => {
          this.recentNews.set(key, value);
        });
      }

      logger.info(`Found ${newNews.length} new high-impact news items out of ${allNews.length} total articles`);
      return newNews;
    } catch (error) {
      logger.error('Error checking for new news:', error);
      return [];
    }
  }

  /**
   * Get recent news for display
   */
  getRecentNews(limit = 20) {
    const allNews = Array.from(this.recentNews.values());
    return allNews
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  /**
   * Get news statistics
   */
  getNewsStats() {
    const allNews = Array.from(this.recentNews.values());
    
    return {
      total: allNews.length,
      highImpact: allNews.filter(n => n.impactScore >= 7).length,
      sources: this.newsSources.length,
      categories: {
        earnings: allNews.filter(n => n.newsCategory === 'earnings').length,
        fed: allNews.filter(n => n.newsCategory === 'fed').length,
        ipo: allNews.filter(n => n.newsCategory === 'ipo').length,
        'm&a': allNews.filter(n => n.newsCategory === 'm&a').length,
        corporate: allNews.filter(n => n.newsCategory === 'corporate').length,
        economic: allNews.filter(n => n.newsCategory === 'economic').length,
        crypto: allNews.filter(n => n.newsCategory === 'crypto').length,
        energy: allNews.filter(n => n.newsCategory === 'energy').length,
        technology: allNews.filter(n => n.newsCategory === 'technology').length,
        general: allNews.filter(n => n.newsCategory === 'general').length
      },
      avgImpactScore: allNews.length > 0 ? 
        allNews.reduce((sum, article) => sum + article.impactScore, 0) / allNews.length : 0
    };
  }
}

module.exports = EnhancedNewsAggregator;
