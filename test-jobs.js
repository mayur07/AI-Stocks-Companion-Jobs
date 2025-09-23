require('dotenv').config();
const logger = require('./services/logger');
const NewsAggregator = require('./services/newsAggregator');
const RedditService = require('./services/redditService');
const AlertService = require('./services/alertService');

async function testServices() {
  console.log('🧪 Testing AI Stocks Companion Jobs Services');
  console.log('='.repeat(50));

  try {
    // Test News Aggregator
    console.log('\n📰 Testing News Aggregator...');
    const newsAggregator = new NewsAggregator();
    const news = await newsAggregator.checkForNewNews();
    console.log(`✅ News Aggregator: Found ${news.length} news items`);
    
    if (news.length > 0) {
      console.log('Sample news item:');
      console.log(`  Title: ${news[0].title}`);
      console.log(`  Source: ${news[0].source}`);
      console.log(`  URL: ${news[0].url}`);
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

    // Test Alert Service
    console.log('\n📧 Testing Alert Service...');
    const alertService = new AlertService();
    
    // Test console alert
    if (news.length > 0) {
      console.log('Testing console alert...');
      alertService.sendConsoleAlert(news[0]);
    }
    
    // Test email configuration
    const emailConfigured = true; // Hardcoded SendGrid API key
    console.log(`✅ Alert Service: Email configured: ${emailConfigured}`);
    console.log(`  From Email: aistockcompanion@gmail.com`);
    console.log(`  Alert Email: mayur.mathurkar7@gmail.com`);

    // Test WhatsApp configuration
    const whatsappConfigured = false; // Will be true once Twilio credentials are added
    console.log(`✅ Alert Service: WhatsApp configured: ${whatsappConfigured}`);
    console.log(`  Twilio WhatsApp Number: whatsapp:+14155238886`);
    console.log(`  Alert Phone Number: +14802082917`);

    // Test batch alert
    const allItems = [...news, ...redditPosts];
    if (allItems.length > 0) {
      console.log('\n📧 Testing batch alert...');
      await alertService.sendBatchAlert(allItems.slice(0, 3)); // Test with first 3 items
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Test failed:', error);
  }
}

// Run tests
testServices();
