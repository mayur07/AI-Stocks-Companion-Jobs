const Snoowrap = require('snoowrap');
const logger = require('./logger');

class RedditService {
  constructor() {
    this.redditClient = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.recentPosts = new Map(); // Store recent posts to avoid duplicates
    this.initializeClient();
  }

  /**
   * Initialize Reddit client with credentials
   */
  initializeClient() {
    try {
      if (this.isRedditConfigured()) {
        this.redditClient = new Snoowrap({
          userAgent: process.env.REDDIT_USER_AGENT || 'AI-Stocks-Companion-Jobs/1.0.0',
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
          username: process.env.REDDIT_USERNAME,
          password: process.env.REDDIT_PASSWORD
        });
        logger.info('Reddit client initialized successfully');
      } else {
        logger.warn('Reddit credentials not configured, Reddit features will be disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize Reddit client:', error.message);
      this.redditClient = null;
    }
  }

  /**
   * Check if Reddit is properly configured
   * @returns {boolean} True if Reddit is configured
   */
  isRedditConfigured() {
    return process.env.REDDIT_CLIENT_ID &&
           process.env.REDDIT_CLIENT_SECRET &&
           process.env.REDDIT_USERNAME &&
           process.env.REDDIT_PASSWORD;
  }

  /**
   * Get posts from multiple financial subreddits
   * @param {Array} subreddits - Array of subreddit names
   * @param {Object} options - Options
   * @returns {Promise<Array>} Array of posts from all subreddits
   */
  async getFinancialPosts(subreddits = ['wallstreetbets', 'stocks', 'investing', 'SecurityAnalysis', 'StockMarket'], options = {}) {
    const { limit = 10 } = options;
    const allPosts = [];

    for (const subreddit of subreddits) {
      try {
        const posts = await this.getSubredditPosts(subreddit, { limit, sort: 'hot' });
        allPosts.push(...posts);
      } catch (error) {
        logger.error(`Error fetching posts from r/${subreddit}:`, error);
      }
    }

    // Sort by score and return top posts
    return allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * subreddits.length);
  }

  /**
   * Get Reddit posts from a subreddit
   * @param {string} subreddit - Subreddit name
   * @param {Object} options - Options (limit, sort, time)
   * @returns {Promise<Array>} Array of posts
   */
  async getSubredditPosts(subreddit, options = {}) {
    const { limit = 25, sort = 'hot', time = 'day' } = options;
    const cacheKey = `reddit_posts_${subreddit}_${limit}_${sort}_${time}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        logger.info(`Returning cached Reddit posts for r/${subreddit}`);
        return cached.data;
      }
    }

    if (!this.redditClient) {
      logger.warn('Reddit client not initialized, returning mock data');
      return this.getMockPosts(subreddit, limit);
    }

    try {
      const subredditObj = this.redditClient.getSubreddit(subreddit);
      let posts;

      switch (sort) {
        case 'hot':
          posts = await subredditObj.getHot({ limit });
          break;
        case 'new':
          posts = await subredditObj.getNew({ limit });
          break;
        case 'top':
          posts = await subredditObj.getTop({ limit, time });
          break;
        case 'rising':
          posts = await subredditObj.getRising({ limit });
          break;
        default:
          posts = await subredditObj.getHot({ limit });
      }

      const formattedPosts = posts.map(post => this.formatPost(post));
      
      // Cache the result
      this.cache.set(cacheKey, { data: formattedPosts, timestamp: Date.now() });
      
      logger.info(`Successfully fetched ${formattedPosts.length} posts from r/${subreddit}`);
      return formattedPosts;

    } catch (error) {
      logger.error(`Error fetching posts from r/${subreddit}:`, error.message);
      return this.getMockPosts(subreddit, limit);
    }
  }

  /**
   * Check for new high-impact Reddit posts
   * @returns {Promise<Array>} Array of new high-impact posts
   */
  async checkForNewPosts() {
    try {
      logger.info('🔍 Checking for new Reddit posts...');
      
      const posts = await this.getFinancialPosts(['wallstreetbets', 'stocks', 'investing'], { limit: 20 });
      
      // Filter for high-impact posts
      const highImpactPosts = this.filterHighImpactPosts(posts);
      logger.info(`🎯 Found ${highImpactPosts.length} high-impact Reddit posts`);
      
      // Check for new posts
      const newPosts = highImpactPosts.filter(post => {
        const key = post.id;
        return !this.recentPosts.has(key);
      });

      logger.info(`🆕 Found ${newPosts.length} new high-impact Reddit posts`);

      if (newPosts.length > 0) {
        // Store new posts to avoid duplicates
        newPosts.forEach(post => {
          this.recentPosts.set(post.id, post);
        });

        // Clean up old posts (keep only last 1000 items)
        if (this.recentPosts.size > 1000) {
          const entries = Array.from(this.recentPosts.entries());
          this.recentPosts.clear();
          entries.slice(-500).forEach(([key, value]) => {
            this.recentPosts.set(key, value);
          });
        }
      }

      return newPosts;
    } catch (error) {
      logger.error('❌ Error in Reddit monitoring:', error);
      throw error;
    }
  }

  /**
   * Filter for high-impact Reddit posts
   * @param {Array} posts - Array of posts
   * @returns {Array} Filtered high-impact posts
   */
  filterHighImpactPosts(posts) {
    const highImpactKeywords = [
      // Major Corporate Events
      'merger', 'acquisition', 'takeover', 'buyout', 'ipo', 'going public',
      'bankruptcy', 'chapter 11', 'layoffs', 'job cuts', 'restructuring',
      'ceo resignation', 'cfo resignation', 'executive departure',
      
      // Critical Earnings & Financial Results
      'earnings beat', 'earnings miss', 'revenue beat', 'revenue miss',
      'guidance raise', 'guidance cut', 'profit warning', 'outlook downgrade',
      'target price cut', 'misses earnings', 'beats earnings', 'earnings surprise',
      
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
      
      // Major Economic Indicators
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
      'pharmaceutical', 'biotech', 'healthcare reform',
      
      // Banking & Financial Crisis
      'bank failure', 'credit crisis', 'liquidity crisis', 'debt crisis',
      'sovereign debt', 'central bank', 'currency crisis', 'hyperinflation',
      
      // Major Cryptocurrency Events
      'bitcoin', 'ethereum', 'crypto regulation', 'digital currency',
      'blockchain', 'cryptocurrency', 'defi', 'nft',
      
      // Energy & Commodities Crisis
      'oil price', 'gas price', 'energy crisis', 'renewable energy',
      'solar', 'wind', 'nuclear', 'coal', 'natural gas', 'commodity prices',
      'gold price', 'silver price',
      
      // Major Retail & Consumer Events
      'retail sales', 'consumer spending', 'holiday sales', 'black friday',
      'cyber monday', 'e-commerce', 'amazon', 'walmart', 'target', 'costco',
      
      // High engagement indicators
      'yolo', 'fomo', 'diamond hands', 'paper hands', 'to the moon',
      'rocket', 'moon', 'tendies', 'stocks only go up', 'buy the dip',
      'sell the news', 'buy the rumor', 'pump and dump', 'short squeeze'
    ];

    return posts.filter(post => {
      const text = `${post.title} ${post.content || ''}`.toLowerCase();
      
      // Must have high engagement (score > 100 or comments > 50)
      const hasHighEngagement = post.score > 100 || post.comments > 50;
      
      // Must contain high-impact keywords
      const hasHighImpactKeyword = highImpactKeywords.some(keyword => text.includes(keyword));
      
      // Exclude low-quality posts
      const isLowQuality = post.title.length < 10 || 
                          post.title.includes('[removed]') || 
                          post.title.includes('[deleted]') ||
                          post.author === '[deleted]';
      
      return hasHighEngagement && hasHighImpactKeyword && !isLowQuality;
    });
  }

  /**
   * Format Reddit post
   * @param {Object} post - Raw Reddit post
   * @returns {Object} Formatted post
   */
  formatPost(post) {
    return {
      id: post.id,
      title: post.title,
      author: post.author.name,
      subreddit: post.subreddit.display_name,
      upvotes: post.ups,
      downvotes: post.downs,
      score: post.score,
      comments: post.num_comments,
      created: new Date(post.created_utc * 1000).toISOString(),
      url: post.url,
      permalink: `https://reddit.com${post.permalink}`,
      content: post.selftext || '',
      domain: post.domain,
      isVideo: post.is_video,
      thumbnail: post.thumbnail,
      flair: post.link_flair_text || 'Discussion',
      isReddit: true,
      source: `r/${post.subreddit.display_name}`
    };
  }

  /**
   * Get mock posts for fallback
   * @param {string} subreddit - Subreddit name
   * @param {number} limit - Number of posts
   * @returns {Array} Mock posts
   */
  getMockPosts(subreddit, limit) {
    const mockPosts = [
      {
        id: 'mock-1',
        title: 'Market Analysis: Tech Stocks Show Strong Performance - $AAPL $MSFT $GOOGL',
        author: 'mockuser1',
        subreddit: subreddit,
        upvotes: 150,
        downvotes: 10,
        score: 140,
        comments: 45,
        created: new Date().toISOString(),
        url: 'https://example.com',
        permalink: '/r/' + subreddit + '/mock-1',
        content: 'Mock post content about market analysis...',
        domain: 'example.com',
        isVideo: false,
        thumbnail: null,
        flair: 'DD',
        isReddit: true,
        source: `r/${subreddit}`
      },
      {
        id: 'mock-2',
        title: 'Discussion: $TSLA Earnings Beat Expectations - What\'s Next?',
        author: 'mockuser2',
        subreddit: subreddit,
        upvotes: 200,
        downvotes: 15,
        score: 185,
        comments: 67,
        created: new Date().toISOString(),
        url: 'https://example.com',
        permalink: '/r/' + subreddit + '/mock-2',
        content: 'Mock post about Tesla earnings...',
        domain: 'example.com',
        isVideo: false,
        thumbnail: null,
        flair: 'Earnings',
        isReddit: true,
        source: `r/${subreddit}`
      }
    ];

    return mockPosts.slice(0, limit);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Reddit cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = RedditService;
