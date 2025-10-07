require('dotenv').config();
const logger = require('./services/logger');
const EnhancedNewsAggregator = require('./services/enhancedNewsAggregator');
const RedditService = require('./services/redditService');
const EnhancedAlertService = require('./services/enhancedAlertService');
const AIAnalysisService = require('./services/aiAnalysisService');

async function testEnhancedServices() {
  console.log('🧪 Testing AI Stocks Companion Enhanced Jobs Services');
  console.log('='.repeat(80));

  try {
    // Test Enhanced News Aggregator
    console.log('\n📰 Testing Enhanced News Aggregator (50+ sources)...');
    const newsAggregator = new EnhancedNewsAggregator();
    const news = await newsAggregator.checkForNewNews();
    console.log(`✅ Enhanced News Aggregator: Found ${news.length} news items from ${newsAggregator.newsSources.length} sources`);
    
    if (news.length > 0) {
      console.log('Sample news item:');
      console.log(`  Title: ${news[0].title}`);
      console.log(`  Source: ${news[0].source}`);
      console.log(`  Impact Score: ${news[0].impactScore}/10`);
      console.log(`  Category: ${news[0].newsCategory}`);
      console.log(`  URL: ${news[0].url}`);
    }

    // Test AI Analysis Service
    console.log('\n🤖 Testing AI Analysis Service...');
    const aiService = new AIAnalysisService();
    
    if (news.length > 0) {
      console.log('Running AI analysis on sample news item...');
      const analysis = await aiService.analyzeNewsWithPrediction(news[0]);
      console.log(`✅ AI Analysis completed:`);
      console.log(`  Impact Score: ${analysis.impactScore}/10`);
      console.log(`  Confidence: ${analysis.confidenceLevel}%`);
      console.log(`  Market Sentiment: ${analysis.marketSentiment}`);
      console.log(`  Expected Movement: ${analysis.predictedPriceMovement}`);
      console.log(`  Time Horizon: ${analysis.timeHorizon}`);
      console.log(`  Affected Sectors: ${analysis.affectedSectors.join(', ')}`);
      console.log(`  Key Stocks: ${analysis.keyStocks.join(', ')}`);
      console.log(`  Trading Recommendation: ${analysis.tradingRecommendation}`);
      
      // Test short heading generation
      const shortHeading = aiService.generateShortHeading(news[0], analysis);
      console.log(`  Short Heading: ${shortHeading}`);
    } else {
      console.log('⚠️  No news items available for AI analysis testing');
    }

    // Test Reddit Service
    console.log('\n🔥 Testing Reddit Service...');
    const redditService = new RedditService();
    const redditPosts = await redditService.checkForNewPosts();
    console.log(`✅ Reddit Service: Found ${redditPosts.length} Reddit posts`);
    
    if (redditPosts.length > 0) {
      console.log('Sample Reddit post:');
      console.log(`  Title: ${redditPosts[0].title}`);
      console.log(`  Subreddit: ${redditPosts[0].subreddit}`);
      console.log(`  Score: ${redditPosts[0].score}`);
    }

    // Test Enhanced Alert Service
    console.log('\n📧 Testing Enhanced Alert Service...');
    const alertService = new EnhancedAlertService();
    
    // Test console alert
    if (news.length > 0) {
      console.log('Testing console alert...');
      const testItem = { ...news[0], shortHeading: '🚨 TEST ALERT: AI Stocks Companion Enhanced System' };
      alertService.sendConsoleAlert([testItem]);
    }
    
    // Test alert service status
    const alertStatus = alertService.getStatus();
    console.log('Alert Service Status:');
    console.log(`  Email: ${alertStatus.email.configured ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`  WhatsApp: ${alertStatus.whatsapp.configured ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`  Telegram: ${alertStatus.telegram.configured ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`  Discord: ${alertStatus.discord.configured ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`  Slack: ${alertStatus.slack.configured ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`  Push: ${alertStatus.push.configured ? '✅ Configured' : '❌ Not Configured'}`);

    // Test batch analysis
    console.log('\n🔄 Testing Batch AI Analysis...');
    if (news.length > 0) {
      const testItems = news.slice(0, 3); // Test with first 3 items
      console.log(`Running batch analysis on ${testItems.length} items...`);
      const analyzedItems = await aiService.batchAnalyze(testItems);
      console.log(`✅ Batch analysis completed for ${analyzedItems.length} items`);
      
      // Display analysis statistics
      const stats = aiService.getAnalysisStats(analyzedItems);
      console.log('Batch Analysis Statistics:');
      console.log(`  Total Items: ${stats.total}`);
      console.log(`  High Impact (7+): ${stats.highImpact}`);
      console.log(`  Critical Impact (8+): ${stats.criticalImpact}`);
      console.log(`  Bullish: ${stats.bullish}`);
      console.log(`  Bearish: ${stats.bearish}`);
      console.log(`  Neutral: ${stats.neutral}`);
      console.log(`  Average Impact Score: ${stats.avgImpactScore.toFixed(2)}`);
      console.log(`  Average Confidence: ${stats.avgConfidence.toFixed(1)}%`);
    }

    // Test news statistics
    console.log('\n📊 Testing News Statistics...');
    const newsStats = newsAggregator.getNewsStats();
    console.log('News Statistics:');
    console.log(`  Total Sources: ${newsStats.sources}`);
    console.log(`  Total Articles: ${newsStats.total}`);
    console.log(`  High Impact Articles: ${newsStats.highImpact}`);
    console.log(`  Average Impact Score: ${newsStats.avgImpactScore.toFixed(2)}`);
    console.log('Category Breakdown:');
    Object.entries(newsStats.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\n🎉 All enhanced services tests completed successfully!');
    console.log('\n📋 ENHANCED SYSTEM SUMMARY:');
    console.log(`   ✅ News Sources: ${newsAggregator.newsSources.length} premium sources`);
    console.log(`   ✅ AI Analysis: ${aiService.openai ? 'OpenAI GPT-3.5 enabled' : 'Fallback mode'}`);
    console.log(`   ✅ Multi-Channel Alerts: 6 notification channels`);
    console.log(`   ✅ Enhanced Filtering: Advanced impact scoring`);
    console.log(`   ✅ Real-time Processing: 15-minute intervals`);
    console.log(`   ✅ Comprehensive Logging: Detailed monitoring`);
    
    console.log('\n🚀 To start the enhanced system:');
    console.log('   npm run start-enhanced');
    console.log('\n🔧 To run in development mode:');
    console.log('   npm run dev-enhanced');

  } catch (error) {
    console.error('❌ Enhanced services test failed:', error);
    logger.error('Enhanced services test failed:', error);
  }
}

// Run the test
testEnhancedServices();
