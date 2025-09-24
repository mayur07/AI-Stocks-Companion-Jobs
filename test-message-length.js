const AlertService = require('./services/alertService');

console.log('🧪 Testing WhatsApp Message Length...\n');

const alertService = new AlertService();

// Create sample news items
const sampleNews = [
  {
    title: "Breaking: Federal Reserve announces major interest rate decision affecting global markets and investor sentiment across multiple sectors",
    source: "Reuters",
    url: "https://example.com/news1",
    publishedAt: new Date(),
    isReddit: false
  },
  {
    title: "Tech stocks surge as AI companies report record quarterly earnings beating analyst expectations",
    source: "Bloomberg",
    url: "https://example.com/news2", 
    publishedAt: new Date(),
    isReddit: false
  },
  {
    title: "Oil prices spike following geopolitical tensions in key production regions",
    source: "CNBC",
    url: "https://example.com/news3",
    publishedAt: new Date(),
    isReddit: false
  },
  {
    title: "Crypto market shows strong recovery as institutional adoption increases significantly",
    source: "CoinDesk",
    url: "https://example.com/news4",
    publishedAt: new Date(),
    isReddit: false
  },
  {
    title: "Healthcare sector faces regulatory challenges as new policies impact pharmaceutical companies",
    source: "Wall Street Journal",
    url: "https://example.com/news5",
    publishedAt: new Date(),
    isReddit: false
  }
];

// Test the message formatting
const message = alertService.formatWhatsAppMessage(sampleNews);

console.log('📊 Message Analysis:');
console.log(`Character Count: ${message.length}`);
console.log(`WhatsApp Limit: 1600`);
console.log(`Status: ${message.length <= 1600 ? '✅ UNDER LIMIT' : '❌ OVER LIMIT'}`);
console.log(`Remaining: ${1600 - message.length} characters`);

console.log('\n📱 Formatted Message:');
console.log('='.repeat(50));
console.log(message);
console.log('='.repeat(50));

if (message.length <= 1600) {
  console.log('\n✅ SUCCESS: Message is within WhatsApp limits!');
} else {
  console.log('\n❌ ERROR: Message exceeds WhatsApp limits!');
  console.log('Need to make it shorter by', message.length - 1600, 'characters');
}
