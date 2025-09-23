const axios = require('axios');
const rssParser = require('rss-parser');
const logger = require('./logger');

class NewsAggregator {
  constructor() {
    this.parser = new rssParser();
    this.newsSources = [
      {
        name: 'MarketWatch',
        url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
        category: 'financial'
      },
      {
        name: 'CNBC Business',
        url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
        category: 'financial'
      },
      {
        name: 'Bloomberg',
        url: 'https://feeds.bloomberg.com/markets/news.rss',
        category: 'financial'
      },
      {
        name: 'Financial Times',
        url: 'https://www.ft.com/rss/home',
        category: 'financial'
      },
      {
        name: 'Wall Street Journal',
        url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
        category: 'financial'
      }
    ];
    this.recentNews = new Map(); // Store recent news to avoid duplicates
  }

  async fetchAllNews() {
    const allNews = [];
    
    for (const source of this.newsSources) {
      try {
        const news = await this.fetchFromSource(source);
        allNews.push(...news);
      } catch (error) {
        logger.error(`Failed to fetch from ${source.name}:`, error);
      }
    }
    
    return this.deduplicateNews(allNews);
  }

  async fetchFromSource(source) {
    const feed = await this.parser.parseURL(source.url);
    
    return feed.items.map(item => ({
      title: item.title,
      content: item.contentSnippet || item.content,
      url: item.link,
      publishedAt: new Date(item.pubDate),
      source: source.name,
      category: source.category,
      guid: item.guid || item.link
    }));
  }

  deduplicateNews(news) {
    const seen = new Set();
    return news.filter(item => {
      const key = item.guid || item.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Filter for high-impact news
  filterHighImpactNews(news) {
    // STRICT: Exclude non-financial content
    const excludeKeywords = [
      'used car', 'car for sale', 'buy a car', 'car buying', 'car dealer',
      'real estate', 'home buying', 'mortgage', 'rental', 'apartment',
      'celebrity', 'entertainment', 'sports', 'movie', 'music',
      'lifestyle', 'travel', 'food', 'recipe', 'cooking',
      'weather', 'climate', 'environment', 'pollution', 'green energy',
      'education', 'school', 'university', 'college', 'student',
      'politics', 'election', 'campaign', 'vote', 'government',
      'social media', 'facebook', 'twitter', 'instagram', 'tiktok',
      'gaming', 'video game', 'esports', 'streaming', 'youtube',
      'market update', 'daily market', 'market wrap', 'market summary',
      'trading day', 'market close', 'opening bell', 'closing bell',
      'market analysis', 'technical analysis', 'chart analysis',
      'market outlook', 'market forecast', 'market prediction'
    ];

    // Filter out non-financial news first
    const financialNews = news.filter(item => {
      const title = item.title.toLowerCase();
      const content = (item.content || '').toLowerCase();
      const text = `${title} ${content}`;
      
      // Exclude if contains non-financial keywords
      return !excludeKeywords.some(keyword => text.includes(keyword));
    });

    // STRICT: Only truly high-impact, market-moving events
    const highImpactKeywords = [
      // Major Corporate Events (M&A, Bankruptcy, Leadership)
      'merger', 'acquisition', 'takeover', 'buyout', 'spin-off', 'ipo', 'going public',
      'bankruptcy', 'chapter 11', 'liquidation', 'restructuring', 'layoffs', 'job cuts',
      'ceo resignation', 'cfo resignation', 'executive departure', 'board resignation',
      
      // Critical Earnings & Financial Results
      'earnings beat', 'earnings miss', 'revenue beat', 'revenue miss', 'guidance raise',
      'guidance cut', 'profit warning', 'outlook downgrade', 'target price cut',
      'misses earnings', 'beats earnings', 'earnings surprise',
      
      // Major Regulatory & Legal Issues
      'sec investigation', 'regulatory action', 'fine', 'penalty', 'settlement',
      'lawsuit', 'class action', 'fraud', 'accounting scandal', 'audit issues',
      'material weakness', 'going concern', 'delisting', 'trading halt',
      
      // Market Crisis Events
      'market crash', 'flash crash', 'circuit breaker', 'bear market', 'recession',
      'economic downturn', 'vix spike', 'panic selling', 'margin call',
      'forced liquidation', 'fire sale', 'distressed assets',
      
      // Federal Reserve & Critical Monetary Policy
      'fed rate cut', 'fed rate hike', 'quantitative easing', 'tapering',
      'federal reserve', 'interest rate', 'monetary policy', 'inflation target',
      
      // Major Economic Indicators (only if significant)
      'gdp growth', 'gdp contraction', 'unemployment', 'jobless claims',
      'consumer confidence', 'manufacturing index', 'services index',
      'retail sales', 'inflation data', 'cpi', 'ppi',
      
      // Critical Geopolitical Events
      'trade war', 'tariffs', 'sanctions', 'brexit', 'china trade', 'eu crisis',
      'oil price', 'crude oil', 'energy crisis', 'supply chain disruption',
      
      // Major Technology Breakthroughs
      'artificial intelligence', 'ai breakthrough', 'quantum computing',
      'autonomous vehicles', 'space exploration', 'renewable energy',
      'electric vehicles', 'tesla', 'nvidia', 'amd', 'intel',
      
      // Healthcare & Pharma Breakthroughs
      'fda approval', 'drug trial', 'vaccine', 'medical breakthrough',
      'pharmaceutical', 'biotech', 'healthcare reform', 'medicare', 'medicaid',
      
      // Banking & Financial Crisis
      'bank failure', 'credit crisis', 'liquidity crisis', 'debt crisis',
      'sovereign debt', 'central bank', 'currency crisis', 'hyperinflation',
      
      // Major Cryptocurrency Events
      'bitcoin', 'ethereum', 'crypto regulation', 'digital currency',
      'blockchain', 'cryptocurrency', 'defi', 'nft', 'central bank digital currency',
      
      // Energy & Commodities Crisis
      'oil price', 'gas price', 'energy crisis', 'renewable energy',
      'solar', 'wind', 'nuclear', 'coal', 'natural gas', 'commodity prices',
      'gold price', 'silver price',
      
      // Major Retail & Consumer Events
      'retail sales', 'consumer spending', 'holiday sales', 'black friday',
      'cyber monday', 'e-commerce', 'amazon', 'walmart', 'target', 'costco',
      
      // Critical Banking & Finance
      'bank', 'banking', 'credit', 'loan', 'mortgage', 'financial services',
      'investment bank', 'hedge fund', 'mutual fund', 'etf', 'index fund',
      
      // Negative Events (High Priority for Alerts)
      'investigation', 'downgrade', 'sell rating', 'strong sell', 'bankruptcy',
      'default', 'delinquency', 'foreclosure', 'layoffs', 'job cuts',
      'restructuring', 'cost cutting', 'revenue decline', 'profit warning',
      'guidance cut', 'outlook downgrade', 'target price cut', 'analyst downgrade',
      'credit downgrade', 'rating cut', 'debt crisis', 'liquidity crisis',
      'cash flow problems', 'accounting scandal', 'fraud', 'sec investigation',
      'regulatory action', 'fine', 'penalty', 'settlement', 'class action',
      'shareholder lawsuit', 'executive departure', 'ceo resignation',
      'cfo resignation', 'board resignation', 'audit issues', 'material weakness',
      'going concern', 'delisting', 'trading halt', 'circuit breaker',
      'flash crash', 'market crash', 'bear market', 'recession', 'economic downturn',
      'slowdown', 'contraction', 'deflation', 'stagflation', 'hyperinflation',
      'currency crisis', 'sovereign debt', 'default risk', 'credit risk',
      'counterparty risk', 'systemic risk', 'market volatility', 'fear index',
      'vix spike', 'panic selling', 'margin call', 'forced liquidation',
      'fire sale', 'distressed assets', 'insider trading', 'market manipulation',
      'pump and dump', 'ponzi scheme',
      
      // Positive Events (High Priority for Alerts)
      'beats earnings', 'revenue beat', 'profit beat', 'guidance raise', 'upgrade',
      'buy rating', 'strong buy', 'target price raise', 'analyst upgrade',
      'credit upgrade', 'rating upgrade', 'positive outlook', 'growth acceleration',
      'market share gain', 'new product launch', 'breakthrough', 'innovation',
      'partnership', 'strategic alliance', 'joint venture', 'expansion',
      'acquisition', 'merger', 'takeover', 'buyout', 'investment', 'funding',
      'ipo', 'going public', 'listing', 'debut', 'launch', 'rollout',
      'fda approval', 'regulatory approval', 'clearance', 'authorization',
      'contract win', 'deal', 'agreement', 'settlement', 'resolution',
      'recovery', 'rebound', 'rally', 'surge', 'jump', 'spike', 'gain',
      'bull market', 'economic growth', 'expansion', 'boom', 'prosperity',
      'record high', 'all-time high', 'new high', 'breakthrough', 'milestone',
      'achievement', 'success', 'victory', 'win', 'triumph', 'breakthrough'
    ];

    // ULTRA-STRICT: Filter for high-impact news with maximum strictness
    const highImpactNews = financialNews.filter(item => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      const title = item.title.toLowerCase();
      
      // Must contain at least one high-impact keyword
      const hasHighImpactKeyword = highImpactKeywords.some(keyword => text.includes(keyword));
      
      // ULTRA-STRICT: Exclude generic market commentary
      const isGenericCommentary = [
        'market update', 'daily market', 'market wrap', 'market summary',
        'trading day', 'market close', 'opening bell', 'closing bell',
        'market analysis', 'technical analysis', 'chart analysis',
        'market outlook', 'market forecast', 'market prediction',
        'market commentary', 'market review', 'market recap',
        'trading session', 'market session', 'trading update'
      ].some(phrase => title.includes(phrase));
      
      // ULTRA-STRICT: Exclude routine economic data unless it's significant
      const isRoutineData = [
        'weekly jobless claims', 'monthly retail sales', 'quarterly gdp',
        'inflation rate', 'unemployment rate', 'consumer price index',
        'ppi', 'cpi', 'gdp', 'employment', 'jobless claims',
        'retail sales', 'consumer confidence', 'manufacturing index'
      ].some(phrase => title.includes(phrase) && !text.includes('surprise') && !text.includes('unexpected') && !text.includes('beat') && !text.includes('miss'));
      
      // ULTRA-STRICT: Exclude company-specific news unless it's major
      const isMinorCompanyNews = [
        'appoints', 'hires', 'promotes', 'announces', 'reports', 'says',
        'expects', 'plans', 'intends', 'considers', 'evaluates',
        'partnership', 'collaboration', 'agreement', 'deal', 'contract',
        'expansion', 'growth', 'investment', 'funding', 'raise'
      ].some(phrase => title.includes(phrase) && !text.includes('ceo') && !text.includes('cfo') && !text.includes('billion') && !text.includes('million'));
      
      // ULTRA-STRICT: Exclude routine earnings unless they're significant
      const isRoutineEarnings = title.includes('earnings') && !text.includes('beat') && !text.includes('miss') && !text.includes('surprise') && !text.includes('guidance');
      
      // ULTRA-STRICT: Exclude generic company news
      const isGenericCompanyNews = [
        'stock price', 'share price', 'trading', 'volume', 'market cap',
        'valuation', 'analyst', 'rating', 'target price', 'price target',
        'dividend', 'split', 'buyback', 'repurchase'
      ].some(phrase => title.includes(phrase) && !text.includes('upgrade') && !text.includes('downgrade') && !text.includes('cut') && !text.includes('raise'));
      
      // ULTRA-STRICT: Exclude opinion pieces and analysis
      const isOpinionPiece = [
        'opinion', 'analysis', 'commentary', 'perspective', 'viewpoint',
        'insight', 'take', 'thoughts', 'outlook', 'forecast',
        'prediction', 'expectation', 'trend', 'pattern'
      ].some(phrase => title.includes(phrase));
      
      // ULTRA-STRICT: Exclude routine market movements
      const isRoutineMarketMovement = [
        'stocks rise', 'stocks fall', 'market gains', 'market losses',
        'dow up', 'dow down', 'nasdaq up', 'nasdaq down',
        's&p up', 's&p down', 'market opens', 'market closes'
      ].some(phrase => title.includes(phrase));
      
      // ULTRA-STRICT: Only allow truly breaking news
      const isBreakingNews = [
        'breaking', 'urgent', 'alert', 'crisis', 'emergency',
        'bankruptcy', 'merger', 'acquisition', 'takeover', 'ipo',
        'fda approval', 'sec investigation', 'lawsuit', 'settlement',
        'rate cut', 'rate hike', 'recession', 'crash', 'rally'
      ].some(phrase => text.includes(phrase));
      
      // ULTRA-STRICT: Must be either breaking news OR have significant impact indicators
      const hasSignificantImpact = [
        'billion', 'million', 'trillion', 'crisis', 'emergency',
        'bankruptcy', 'merger', 'acquisition', 'takeover', 'ipo',
        'fda approval', 'sec investigation', 'lawsuit', 'settlement',
        'rate cut', 'rate hike', 'recession', 'crash', 'rally',
        'beat', 'miss', 'surprise', 'guidance', 'upgrade', 'downgrade'
      ].some(phrase => text.includes(phrase));
      
      return hasHighImpactKeyword && 
             !isGenericCommentary && 
             !isRoutineData && 
             !isMinorCompanyNews && 
             !isRoutineEarnings && 
             !isGenericCompanyNews && 
             !isOpinionPiece && 
             !isRoutineMarketMovement && 
             (isBreakingNews || hasSignificantImpact);
    });

    return highImpactNews;
  }

  // Get recent news
  getRecentNews(limit = 50) {
    return Array.from(this.recentNews.values())
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  // Get high-impact news only
  getHighImpactNews(limit = 20) {
    const allNews = this.getRecentNews(100);
    return this.filterHighImpactNews(allNews).slice(0, limit);
  }

  // Check for new high-impact news
  async checkForNewNews() {
    try {
      logger.info('📊 Starting news fetch process...');
      
      const allNews = await this.fetchAllNews();
      logger.info(`📰 Fetched ${allNews.length} total news items from all sources`);
      
      const highImpactNews = this.filterHighImpactNews(allNews);
      logger.info(`🎯 Filtered to ${highImpactNews.length} high-impact news items`);
      
      // Check for new high-impact news
      const newNews = highImpactNews.filter(item => {
        const key = item.guid || item.url;
        return !this.recentNews.has(key);
      });

      logger.info(`🆕 Found ${newNews.length} new high-impact news items`);

      if (newNews.length > 0) {
        // Store new news to avoid duplicates
        newNews.forEach(item => {
          const key = item.guid || item.url;
          this.recentNews.set(key, item);
        });

        // Clean up old news (keep only last 1000 items)
        if (this.recentNews.size > 1000) {
          const entries = Array.from(this.recentNews.entries());
          this.recentNews.clear();
          entries.slice(-500).forEach(([key, value]) => {
            this.recentNews.set(key, value);
          });
        }
      }

      return newNews;
    } catch (error) {
      logger.error('❌ Error in news monitoring:', error);
      throw error;
    }
  }
}

module.exports = NewsAggregator;
