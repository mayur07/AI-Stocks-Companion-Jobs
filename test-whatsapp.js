require('dotenv').config();
const twilio = require('twilio');
const logger = require('./services/logger');

// Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const YOUR_PHONE_NUMBER = process.env.ALERT_PHONE_NUMBER || '+14802082917';

async function testWhatsApp() {
  console.log('🧪 Testing WhatsApp Configuration');
  console.log('='.repeat(50));

  // Check if credentials are configured
  if (TWILIO_ACCOUNT_SID === 'your_twilio_account_sid_here' || TWILIO_AUTH_TOKEN === 'your_twilio_auth_token_here') {
    console.log('❌ Twilio credentials not configured!');
    console.log('\n📝 To configure WhatsApp:');
    console.log('1. Go to https://console.twilio.com/');
    console.log('2. Get your Account SID and Auth Token');
    console.log('3. Replace the values in jobs/services/alertService.js:');
    console.log('   - TWILIO_ACCOUNT_SID = "your_actual_sid"');
    console.log('   - TWILIO_AUTH_TOKEN = "your_actual_token"');
    console.log('4. Replace YOUR_PHONE_NUMBER with your WhatsApp number');
    console.log('5. Set up WhatsApp Sandbox:');
    console.log('   - Go to Console > Develop > Messaging > Try it out > Send a WhatsApp message');
    console.log('   - Follow instructions to connect your WhatsApp to +14155238886');
    return;
  }

  if (YOUR_PHONE_NUMBER === '+1234567890') {
    console.log('❌ Phone number not configured!');
    console.log('\n📝 To configure your phone number:');
    console.log('1. Replace YOUR_PHONE_NUMBER in this file with your WhatsApp number');
    console.log('2. Format: +1234567890 (include country code)');
    return;
  }

  try {
    console.log('🔧 Initializing Twilio client...');
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    console.log('📱 Sending test WhatsApp message...');
    console.log(`   From: whatsapp:+14155238886`);
    console.log(`   To: whatsapp:${YOUR_PHONE_NUMBER}`);
    
    const message = `🚨 *AI Stocks Companion Test* 🚨

This is a test message from your AI Stocks Companion Jobs system!

✅ WhatsApp integration is working correctly.
📊 You will receive alerts every 30 minutes when high-impact financial news is detected.

⚠️ *Disclaimer:* This is for informational purposes only and not financial advice.`;

    const result = await client.messages.create({
      body: message,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${YOUR_PHONE_NUMBER}`
    });

    console.log('✅ WhatsApp test message sent successfully!');
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log('\n🎉 Your WhatsApp alerts are now configured!');
    console.log('📱 You should receive the test message on your WhatsApp shortly.');

  } catch (error) {
    console.log('❌ WhatsApp test failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.code === 21211) {
      console.log('\n💡 This error usually means:');
      console.log('   - Your WhatsApp number is not connected to the Twilio sandbox');
      console.log('   - Go to Twilio Console > WhatsApp > Sandbox');
      console.log('   - Send the join code to +14155238886 from your WhatsApp');
    } else if (error.code === 20003) {
      console.log('\n💡 This error usually means:');
      console.log('   - Invalid Twilio credentials');
      console.log('   - Check your Account SID and Auth Token');
    }
  }
}

// Run the test
testWhatsApp();
