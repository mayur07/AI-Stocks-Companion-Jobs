const twilio = require('twilio');

// Test Twilio credentials
const accountSid = 'AC048f4d082ddef339c9418add00ae3368';
const authToken = '6383ee8e7bce637fcc453eec51a71138'; // Replace with your actual auth token

console.log('🔍 Testing Twilio Credentials...');
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken ? '***' + authToken.slice(-4) : 'NOT SET');

const client = twilio(accountSid, authToken);

// Test sending a simple WhatsApp message
async function testWhatsApp() {
  try {
    console.log('\n📱 Testing WhatsApp message...');
    
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      body: '🧪 Test message from AI Stocks Companion Jobs - ' + new Date().toLocaleString(),
      to: 'whatsapp:+14802082917'
    });

    console.log('✅ WhatsApp message sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    
  } catch (error) {
    console.error('❌ WhatsApp test failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('More Info:', error.moreInfo);
    
    if (error.code === 20003) {
      console.log('\n💡 This is an authentication error. Check your:');
      console.log('1. Account SID is correct');
      console.log('2. Auth Token is correct and not expired');
      console.log('3. Account is active and not suspended');
    }
  }
}

// Test with content template (your preferred method)
async function testWhatsAppWithTemplate() {
  try {
    console.log('\n📱 Testing WhatsApp with content template...');
    
    const message = await client.messages.create({
      from: 'whatsapp:+14155238886',
      contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      contentVariables: '{"1":"' + new Date().toLocaleDateString() + '","2":"' + new Date().toLocaleTimeString() + '"}',
      to: 'whatsapp:+14802082917'
    });

    console.log('✅ WhatsApp template message sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    
  } catch (error) {
    console.error('❌ WhatsApp template test failed:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('More Info:', error.moreInfo);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Twilio credential tests...\n');
  
  await testWhatsApp();
  await testWhatsAppWithTemplate();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
