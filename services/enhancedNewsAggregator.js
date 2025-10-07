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
    
    // Enhanced impact keywords
    this.impactKeywords = [
      // High Impact Keywords
      'earnings', 'fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'unemployment',
      'ipo', 'merger', 'acquisition', 'dividend', 'stock split', 'buyback',
      'breaking', 'alert', 'surge', 'plunge', 'rally', 'crash', 'volatility',
      'central bank', 'monetary policy', 'fiscal policy', 'trade war', 'tariff',
      'oil price', 'gold price', 'bitcoin', 'crypto', 'dollar', 'yen', 'euro',
      'recession', 'recovery', 'growth', 'decline', 'outlook', 'forecast',
      // Additional High Impact Keywords
      'bankruptcy', 'chapter 11', 'liquidation', 'restructuring', 'layoffs', 'job cuts',
      'ceo resignation', 'cfo resignation', 'executive departure', 'board resignation',
      'sec investigation', 'regulatory action', 'fine', 'penalty', 'settlement',
      'lawsuit', 'class action', 'fraud', 'accounting scandal', 'audit issues',
      'material weakness', 'going concern', 'delisting', 'trading halt',
      'market crash', 'flash crash', 'circuit breaker', 'bear market',
      'economic downturn', 'vix spike', 'panic selling', 'margin call',
      'forced liquidation', 'fire sale', 'distressed assets',
      'quantitative easing', 'tapering', 'inflation target',
      'gdp growth', 'gdp contraction', 'jobless claims',
      'consumer confidence', 'manufacturing index', 'services index',
      'retail sales', 'inflation data', 'cpi', 'ppi',
      'trade war', 'tariffs', 'sanctions', 'brexit', 'china trade', 'eu crisis',
      'supply chain disruption', 'artificial intelligence', 'ai breakthrough',
      'quantum computing', 'autonomous vehicles', 'space exploration',
      'renewable energy', 'electric vehicles', 'tesla', 'nvidia', 'amd', 'intel',
      'fda approval', 'drug trial', 'vaccine', 'medical breakthrough',
      'pharmaceutical', 'biotech', 'healthcare reform', 'medicare', 'medicaid',
      'bank failure', 'credit crisis', 'liquidity crisis', 'debt crisis',
      'sovereign debt', 'central bank', 'currency crisis', 'hyperinflation',
      'crypto regulation', 'digital currency', 'blockchain', 'defi', 'nft',
      'central bank digital currency', 'energy crisis', 'solar', 'wind', 'nuclear',
      'coal', 'natural gas', 'commodity prices', 'gold price', 'silver price',
      'holiday sales', 'black friday', 'cyber monday', 'e-commerce',
      'amazon', 'walmart', 'target', 'costco', 'banking', 'credit', 'loan',
      'mortgage', 'financial services', 'investment bank', 'hedge fund',
      'mutual fund', 'etf', 'index fund'
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
