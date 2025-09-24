const RedditService = require('./services/redditService');

console.log('🔍 Testing Reddit Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('REDDIT_CLIENT_ID:', process.env.REDDIT_CLIENT_ID ? '✅ Set' : '❌ Not set');
console.log('REDDIT_CLIENT_SECRET:', process.env.REDDIT_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
console.log('REDDIT_USERNAME:', process.env.REDDIT_USERNAME ? '✅ Set' : '❌ Not set');
console.log('REDDIT_PASSWORD:', process.env.REDDIT_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('REDDIT_USER_AGENT:', process.env.REDDIT_USER_AGENT || 'AI-Stocks-Companion-Jobs/1.0.0');

console.log('\n🚀 Initializing Reddit Service...');
const redditService = new RedditService();

console.log('\n📊 Reddit Service Status:');
console.log('Is Configured:', redditService.isRedditConfigured() ? '✅ Yes' : '❌ No');

if (redditService.isRedditConfigured()) {
  console.log('\n🧪 Testing Reddit API...');
  
  // Test fetching posts from a financial subreddit
  redditService.getFinancialPosts(['stocks', 'investing'], { limit: 3 })
    .then(posts => {
      console.log('✅ Reddit API working!');
      console.log(`📰 Found ${posts.length} posts:`);
      posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   Source: ${post.source} | Score: ${post.score}`);
      });
    })
    .catch(error => {
      console.error('❌ Reddit API test failed:');
      console.error('Error:', error.message);
      
      if (error.message.includes('401')) {
        console.log('\n💡 This is likely an authentication error. Check:');
        console.log('1. Client ID and Client Secret are correct');
        console.log('2. Username and password are correct');
        console.log('3. Reddit account is not suspended');
      }
    });
} else {
  console.log('\n❌ Reddit not configured. To enable Reddit monitoring:');
  console.log('1. Go to https://www.reddit.com/prefs/apps');
  console.log('2. Create a new app (script type)');
  console.log('3. Get your Client ID and Client Secret');
  console.log('4. Set these environment variables:');
  console.log('   - REDDIT_CLIENT_ID');
  console.log('   - REDDIT_CLIENT_SECRET');
  console.log('   - REDDIT_USERNAME');
  console.log('   - REDDIT_PASSWORD');
  console.log('5. Run this test again');
}
