const OpenAI = require('openai');
const logger = require('./logger');

class AIAnalysisService {
  constructor() {
    // Initialize OpenAI client only if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000, // 30 second timeout
        maxRetries: 3
      });
      logger.info('AI Analysis service initialized with OpenAI integration');
    } else {
      this.openai = null;
      logger.warn('OpenAI API key not found or not configured. AI analysis features disabled.');
    }
    
    // Historical impact patterns for reference
    this.impactPatterns = {
      'fed rate change': { impact: 8.5, confidence: 85, sectors: ['financial', 'real estate', 'utilities'] },
      'earnings beat': { impact: 7.2, confidence: 78, sectors: ['technology', 'consumer'] },
      'merger announcement': { impact: 9.1, confidence: 92, sectors: ['target company', 'acquirer'] },
      'fda approval': { impact: 8.8, confidence: 88, sectors: ['pharmaceutical', 'biotech'] },
      'sec investigation': { impact: 6.5, confidence: 75, sectors: ['target company'] }
    };
  }

  /**
   * Analyze news with AI predictions and impact scoring
   * @param {Object} news - News item object
   * @returns {Promise<Object>} Enhanced analysis with predictions
   */
  async analyzeNewsWithPrediction(news) {
    try {
      if (!this.openai) {
        return this.getFallbackPrediction(news);
      }

      const prompt = `
You are an expert financial analyst with 20+ years of experience. Analyze this financial news and provide a comprehensive prediction analysis.

NEWS ITEM:
Title: ${news.title}
Content: ${news.content || news.description || 'No content available'}
Source: ${news.source}
Published: ${news.publishedAt}

Please provide a JSON response with the following structure:
{
  "impactScore": 8.5,
  "confidenceLevel": 85,
  "marketSentiment": "bullish|bearish|neutral",
  "predictedPriceMovement": "+2-5%",
  "timeHorizon": "24-48 hours",
  "affectedSectors": ["technology", "financial"],
  "keyStocks": ["AAPL", "MSFT"],
  "riskLevel": "medium",
  "tradingRecommendation": "buy|sell|hold|watch",
  "reasoning": "Detailed explanation of the analysis",
  "keyFactors": ["Factor 1", "Factor 2"],
  "historicalPrecedent": "Similar events in the past caused...",
  "volatilityExpectation": "high|medium|low",
  "marketWideImpact": "positive|negative|neutral",
  "sectorAnalysis": {
    "technology": "positive",
    "financial": "negative"
  }
}

Guidelines:
- Impact score: 1-10 (10 being most impactful)
- Confidence level: 1-100 (100 being most confident)
- Be specific and actionable in your analysis
- Consider both direct and indirect impacts
- Base recommendations on sound financial reasoning
- Consider current market conditions and volatility
- Identify both opportunities and risks

Respond ONLY with valid JSON, no additional text.
`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Add metadata
      analysis.analysisTimestamp = new Date().toISOString();
      analysis.newsId = news.guid || news.url;
      analysis.model = "gpt-3.5-turbo";
      analysis.source = news.source;
      
      logger.info(`AI analysis completed for news: ${news.title}`);
      return analysis;

    } catch (error) {
      logger.error('Error in AI analysis:', error);
      return this.getFallbackPrediction(news);
    }
  }

  /**
   * Generate short heading for alerts
   * @param {Object} news - News item object
   * @param {Object} analysis - AI analysis object
   * @returns {string} Short heading
   */
  generateShortHeading(news, analysis) {
    const impact = analysis.impactScore >= 8 ? '🚨 CRITICAL' : 
                   analysis.impactScore >= 6 ? '🔥 HIGH IMPACT' : 
                   '📈 MARKET MOVING';
    
    const sentiment = analysis.marketSentiment === 'bullish' ? '📈' : 
                     analysis.marketSentiment === 'bearish' ? '📉' : '➡️';
    
    const category = this.getCategoryEmoji(news.newsCategory);
    
    // Truncate title if too long
    const shortTitle = news.title.length > 60 ? 
      news.title.substring(0, 57) + '...' : news.title;
    
    return `${impact} ${category} ${sentiment} ${shortTitle}`;
  }

  /**
   * Generate detailed alert content
   * @param {Object} news - News item object
   * @param {Object} analysis - AI analysis object
   * @returns {string} Detailed content
   */
  generateDetailedContent(news, analysis) {
    const content = `
${this.generateShortHeading(news, analysis)}

📊 IMPACT ANALYSIS:
• Impact Score: ${analysis.impactScore}/10
• Confidence: ${analysis.confidenceLevel}%
• Market Sentiment: ${analysis.marketSentiment.toUpperCase()}
• Expected Movement: ${analysis.predictedPriceMovement}
• Time Horizon: ${analysis.timeHorizon}

🎯 KEY INSIGHTS:
${analysis.reasoning}

📈 AFFECTED SECTORS:
${analysis.affectedSectors.map(sector => `• ${sector}`).join('\n')}

🏢 KEY STOCKS:
${analysis.keyStocks.map(stock => `• ${stock}`).join('\n')}

💡 TRADING RECOMMENDATION:
${analysis.tradingRecommendation.toUpperCase()} - ${analysis.riskLevel} risk

⚠️ RISK FACTORS:
${analysis.keyFactors.map(factor => `• ${factor}`).join('\n')}

📚 HISTORICAL CONTEXT:
${analysis.historicalPrecedent}

🔗 Read more: ${news.url}

⚠️ Disclaimer: This is for informational purposes only and not financial advice.
`;

    return content;
  }

  /**
   * Get category emoji
   * @param {string} category - News category
   * @returns {string} Emoji
   */
  getCategoryEmoji(category) {
    const emojis = {
      'earnings': '💰',
      'fed': '🏦',
      'ipo': '🚀',
      'm&a': '🤝',
      'corporate': '🏢',
      'economic': '📊',
      'crypto': '₿',
      'energy': '⚡',
      'technology': '💻',
      'general': '📰'
    };
    return emojis[category] || '📰';
  }

  /**
   * Fallback prediction when AI is not available
   * @param {Object} news - News item object
   * @returns {Object} Fallback analysis
   */
  getFallbackPrediction(news) {
    const content = (news.title + ' ' + (news.description || '')).toLowerCase();
    
    // Simple keyword-based analysis
    let impactScore = 5;
    let marketSentiment = 'neutral';
    let affectedSectors = [];
    let keyStocks = [];
    
    // Check for high-impact keywords
    if (content.includes('fed') || content.includes('federal reserve')) {
      impactScore = 8;
      marketSentiment = 'bearish';
      affectedSectors = ['financial', 'real estate', 'utilities'];
    } else if (content.includes('earnings')) {
      impactScore = 7;
      marketSentiment = 'bullish';
      affectedSectors = ['technology', 'consumer'];
    } else if (content.includes('merger') || content.includes('acquisition')) {
      impactScore = 9;
      marketSentiment = 'bullish';
      affectedSectors = ['target company', 'acquirer'];
    } else if (content.includes('crypto') || content.includes('bitcoin')) {
      impactScore = 6;
      marketSentiment = 'bullish';
      affectedSectors = ['cryptocurrency', 'technology'];
    }
    
    // Extract stock tickers
    const stockTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    stockTickers.forEach(ticker => {
      if (content.includes(ticker.toLowerCase())) {
        keyStocks.push(ticker);
      }
    });
    
    return {
      impactScore: impactScore,
      confidenceLevel: 60,
      marketSentiment: marketSentiment,
      predictedPriceMovement: impactScore >= 7 ? '+2-5%' : '+1-3%',
      timeHorizon: '24-48 hours',
      affectedSectors: affectedSectors,
      keyStocks: keyStocks,
      riskLevel: 'medium',
      tradingRecommendation: 'watch',
      reasoning: 'Basic keyword analysis - AI analysis not available',
      keyFactors: ['News mention', 'Market sentiment'],
      historicalPrecedent: 'Based on similar news patterns',
      volatilityExpectation: 'medium',
      marketWideImpact: 'neutral',
      sectorAnalysis: {},
      analysisTimestamp: new Date().toISOString(),
      newsId: news.guid || news.url,
      model: 'fallback',
      source: news.source
    };
  }

  /**
   * Batch analyze multiple news items
   * @param {Array} newsItems - Array of news items
   * @returns {Promise<Array>} Array of analyzed news items
   */
  async batchAnalyze(newsItems) {
    const analyzedItems = [];
    
    for (const news of newsItems) {
      try {
        const analysis = await this.analyzeNewsWithPrediction(news);
        analyzedItems.push({
          ...news,
          aiAnalysis: analysis,
          shortHeading: this.generateShortHeading(news, analysis),
          detailedContent: this.generateDetailedContent(news, analysis)
        });
      } catch (error) {
        logger.error(`Error analyzing news item: ${news.title}`, error);
        // Add fallback analysis
        const fallbackAnalysis = this.getFallbackPrediction(news);
        analyzedItems.push({
          ...news,
          aiAnalysis: fallbackAnalysis,
          shortHeading: this.generateShortHeading(news, fallbackAnalysis),
          detailedContent: this.generateDetailedContent(news, fallbackAnalysis)
        });
      }
    }
    
    return analyzedItems;
  }

  /**
   * Get analysis statistics
   * @param {Array} analyzedItems - Array of analyzed news items
   * @returns {Object} Statistics
   */
  getAnalysisStats(analyzedItems) {
    const stats = {
      total: analyzedItems.length,
      highImpact: analyzedItems.filter(item => item.aiAnalysis.impactScore >= 7).length,
      criticalImpact: analyzedItems.filter(item => item.aiAnalysis.impactScore >= 8).length,
      bullish: analyzedItems.filter(item => item.aiAnalysis.marketSentiment === 'bullish').length,
      bearish: analyzedItems.filter(item => item.aiAnalysis.marketSentiment === 'bearish').length,
      neutral: analyzedItems.filter(item => item.aiAnalysis.marketSentiment === 'neutral').length,
      avgImpactScore: analyzedItems.length > 0 ? 
        analyzedItems.reduce((sum, item) => sum + item.aiAnalysis.impactScore, 0) / analyzedItems.length : 0,
      avgConfidence: analyzedItems.length > 0 ? 
        analyzedItems.reduce((sum, item) => sum + item.aiAnalysis.confidenceLevel, 0) / analyzedItems.length : 0,
      topSectors: {},
      topStocks: {}
    };
    
    // Count sectors
    analyzedItems.forEach(item => {
      item.aiAnalysis.affectedSectors.forEach(sector => {
        stats.topSectors[sector] = (stats.topSectors[sector] || 0) + 1;
      });
    });
    
    // Count stocks
    analyzedItems.forEach(item => {
      item.aiAnalysis.keyStocks.forEach(stock => {
        stats.topStocks[stock] = (stats.topStocks[stock] || 0) + 1;
      });
    });
    
    return stats;
  }
}

module.exports = AIAnalysisService;
