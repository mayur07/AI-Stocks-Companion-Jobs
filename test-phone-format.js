const AlertService = require('./services/alertService');

console.log('🧪 Testing Phone Number Format...\n');

const alertService = new AlertService();

// Test different phone number formats
const testNumbers = [
  '+14802082917',           // Without whatsapp: prefix
  'whatsapp:+14802082917',  // With whatsapp: prefix
  '14802082917',            // Without + and whatsapp:
  'whatsapp:14802082917'    // With whatsapp: but no +
];

console.log('📱 Testing phone number formats:');
testNumbers.forEach((phoneNumber, index) => {
  console.log(`${index + 1}. Input: "${phoneNumber}"`);
  
  // Simulate the fix logic
  const whatsappNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
  console.log(`   Output: "${whatsappNumber}"`);
  
  // Check if it's valid (should start with whatsapp: and have +)
  const isValid = whatsappNumber.startsWith('whatsapp:') && whatsappNumber.includes('+');
  console.log(`   Valid: ${isValid ? '✅' : '❌'}`);
  console.log('');
});

console.log('🎯 Expected format: whatsapp:+14802082917');
console.log('📋 Environment variable should be: ALERT_PHONE_NUMBER=whatsapp:+14802082917');
