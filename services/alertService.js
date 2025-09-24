const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const logger = require('./logger');

class AlertService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.lastEmailSent = null;
    this.lastWhatsAppSent = null;
    this.emailThrottleMinutes = 30; // Send email only every 30 minutes
    this.whatsappThrottleMinutes = 30; // Send WhatsApp only every 30 minutes
    this.initializeServices();
  }

  initializeServices() {
    // Initialize SendGrid Email service
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.emailTransporter = sgMail;
      logger.info('SendGrid email notification service initialized');
    } else {
      logger.warn('SendGrid API key not found - email notifications disabled');
    }

    // Initialize Twilio WhatsApp service
    // Temporarily using hardcoded credentials for testing
    const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC048f4d082ddef339c9418add00ae3368';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '6383ee8e7bce637fcc453eec51a71138'; // Replace with actual token
    
    if (accountSid && authToken && authToken !== '[AuthToken]') {
      this.twilioClient = twilio(accountSid, authToken);
      logger.info('Twilio WhatsApp notification service initialized');
      console.log('✅ Twilio client initialized with Account SID:', accountSid);
    } else {
      logger.warn('Twilio credentials not configured - WhatsApp notifications disabled');
      console.log('❌ Twilio not configured - Account SID:', accountSid, 'Auth Token:', authToken ? 'SET' : 'NOT SET');
    }
  }

  // Check if enough time has passed since last email (30-minute throttle)
  canSendEmail() {
    if (!this.lastEmailSent) {
      return true; // First email can be sent immediately
    }

    const now = new Date();
    const timeSinceLastEmail = (now - this.lastEmailSent) / (1000 * 60); // minutes

    if (timeSinceLastEmail >= this.emailThrottleMinutes) {
      return true;
    }

    const remainingMinutes = Math.ceil(this.emailThrottleMinutes - timeSinceLastEmail);
    logger.info(`Email throttled. Next email can be sent in ${remainingMinutes} minutes.`);
    return false;
  }

  // Check if enough time has passed since last WhatsApp (30-minute throttle)
  canSendWhatsApp() {
    if (!this.lastWhatsAppSent) {
      return true; // First WhatsApp can be sent immediately
    }

    const now = new Date();
    const timeSinceLastWhatsApp = (now - this.lastWhatsAppSent) / (1000 * 60); // minutes

    if (timeSinceLastWhatsApp >= this.whatsappThrottleMinutes) {
      return true;
    }

    const remainingMinutes = Math.ceil(this.whatsappThrottleMinutes - timeSinceLastWhatsApp);
    logger.info(`WhatsApp throttled. Next WhatsApp can be sent in ${remainingMinutes} minutes.`);
    return false;
  }

  // Simple console notification (for immediate testing)
  sendConsoleAlert(news) {
    console.log('\n🚨 BREAKING NEWS ALERT 🚨');
    console.log('='.repeat(50));
    console.log(`📰 ${news.title}`);
    console.log(`🏢 Source: ${news.source}`);
    console.log(`⏰ Time: ${news.publishedAt ? news.publishedAt.toLocaleString() : new Date().toLocaleString()}`);
    console.log(`🔗 URL: ${news.url}`);
    console.log('='.repeat(50));
    console.log('💡 This news might impact stocks! Check it out!\n');
  }

  // Send email alert with 30-minute throttling using SendGrid
  async sendEmailAlert(emailAddress, subject, htmlContent) {
    if (!this.emailTransporter) {
      logger.warn('SendGrid not configured, skipping email alert');
      console.log('❌ SendGrid not configured - skipping email alert');
      return false;
    }

    // Check if we can send email (30-minute throttle)
    if (!this.canSendEmail()) {
      logger.info('Email throttled - skipping alert');
      console.log('⏰ Email throttled - skipping alert (30-minute cooldown)');
      return false;
    }

    try {
      logger.info(`📧 Attempting to send email to ${emailAddress}`);
      console.log(`📧 SENDING EMAIL - ${new Date().toLocaleString()}`);
      console.log(`📧 To: ${emailAddress}`);
      console.log(`📧 Subject: ${subject}`);

      const msg = {
        to: emailAddress,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourdomain.com',
        subject: subject,
        html: htmlContent,
      };

      await this.emailTransporter.send(msg);

      this.lastEmailSent = new Date();
      logger.info(`✅ SendGrid email alert sent to ${emailAddress} (throttled every ${this.emailThrottleMinutes} minutes)`);
      console.log(`✅ EMAIL SENT SUCCESSFULLY - ${new Date().toLocaleString()}`);
      console.log(`✅ Next email can be sent in ${this.emailThrottleMinutes} minutes`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to send SendGrid email alert:', error);
      console.log(`❌ EMAIL SEND FAILED - ${new Date().toLocaleString()}`);
      console.log(`❌ Error: ${error.message}`);
      return false;
    }
  }

  // Send WhatsApp alert with 30-minute throttling using Twilio
  async sendWhatsAppAlert(phoneNumber, message) {
    if (!this.twilioClient) {
      logger.warn('Twilio not configured, skipping WhatsApp alert');
      console.log('❌ Twilio not configured - skipping WhatsApp alert');
      return false;
    }

    // Check if we can send WhatsApp (30-minute throttle)
    if (!this.canSendWhatsApp()) {
      logger.info('WhatsApp throttled - skipping alert');
      console.log('⏰ WhatsApp throttled - skipping alert (30-minute cooldown)');
      return false;
    }

    try {
      logger.info(`📱 Attempting to send WhatsApp to ${phoneNumber}`);
      console.log(`📱 SENDING WHATSAPP - ${new Date().toLocaleString()}`);
      console.log(`📱 To: ${phoneNumber}`);
      console.log(`📱 Message: ${message.substring(0, 100)}...`);

      // Ensure phone number has correct format
      const whatsappNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
      const fromNumber = 'whatsapp:+14155238886'; // Twilio WhatsApp Sandbox number

      const messageResult = await this.twilioClient.messages.create({
        body: message,
        from: fromNumber,
        to: whatsappNumber
      });

      this.lastWhatsAppSent = new Date();
      logger.info(`✅ WhatsApp alert sent to ${phoneNumber} (throttled every ${this.whatsappThrottleMinutes} minutes)`);
      console.log(`✅ WHATSAPP SENT SUCCESSFULLY - ${new Date().toLocaleString()}`);
      console.log(`✅ Message SID: ${messageResult.sid}`);
      console.log(`✅ Next WhatsApp can be sent in ${this.whatsappThrottleMinutes} minutes`);
      return true;
    } catch (error) {
      logger.error('❌ Failed to send WhatsApp alert:', error);
      console.log(`❌ WHATSAPP SEND FAILED - ${new Date().toLocaleString()}`);
      console.log(`❌ Error: ${error.message}`);
      return false;
    }
  }

  // Format batch email alert for news and Reddit posts
  formatBatchEmailAlert(newsItems) {
    const totalNews = newsItems.length;
    const currentTime = new Date().toLocaleString();

    // Separate Reddit posts from regular news
    const redditPosts = newsItems.filter(item => item.isReddit);
    const regularNews = newsItems.filter(item => !item.isReddit);

    const redditCount = redditPosts.length;
    const newsCount = regularNews.length;

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 BREAKING NEWS ALERT</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${totalNews} High-Impact Financial Stories</p>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">${currentTime}</p>
      </div>
      
      <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="color: #333; margin-top: 0;">📊 Market Summary</h3>
          <p><strong>Total Stories:</strong> ${totalNews} (${newsCount} News + ${redditCount} Reddit)</p>
          <p><strong>Detection Time:</strong> ${currentTime}</p>
          <p><strong>Sources:</strong> ${[...new Set(newsItems.map(item => item.source))].join(', ')}</p>
        </div>

        ${regularNews.length > 0 ? `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">📰 High-Impact News Stories</h3>
          ${regularNews.map((news, index) => `
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #007bff;">
              <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">${index + 1}. ${news.title}</h4>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">
                <strong>Source:</strong> ${news.source} | 
                <strong>Time:</strong> ${news.publishedAt ? news.publishedAt.toLocaleString() : 'Unknown'}
              </p>
              <div style="margin: 10px 0;">
                <a href="${news.url}" style="background: #007bff; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; font-size: 14px;">Read Article</a>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${redditPosts.length > 0 ? `
        <div style="background: #ff6b6b; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="color: white; margin-top: 0;">🔥 Reddit Hot Discussions</h3>
          ${redditPosts.map((post, index) => `
            <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #ff6b6b;">
              <h4 style="color: #333; margin: 0 0 10px 0; font-size: 16px;">${index + 1}. ${post.title}</h4>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">
                <strong>Source:</strong> ${post.source} | 
                <strong>Flair:</strong> ${post.flair} | 
                <strong>Score:</strong> ${post.score} | 
                <strong>Comments:</strong> ${post.comments}
              </p>
              ${post.content ? `<p style="color: #555; font-size: 13px; margin: 10px 0; font-style: italic;">${post.content.substring(0, 200)}...</p>` : ''}
              <div style="margin: 10px 0;">
                <a href="${post.url}" style="background: #ff6b6b; color: white; padding: 8px 16px; text-decoration: none; border-radius: 3px; font-size: 14px;">View Discussion</a>
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ⚠️ <strong>Disclaimer:</strong> This is for informational purposes only and not financial advice. 
            Always do your own research before making investment decisions.
          </p>
        </div>
      </div>
    </div>`;
  }

  // Format WhatsApp message for news items (concise version under 1600 chars)
  formatWhatsAppMessage(newsItems) {
    const totalNews = newsItems.length;
    const currentTime = new Date().toLocaleString();

    // Separate Reddit posts from regular news
    const redditPosts = newsItems.filter(item => item.isReddit);
    const regularNews = newsItems.filter(item => !item.isReddit);

    const redditCount = redditPosts.length;
    const newsCount = regularNews.length;

    let message = `🚨 *MARKET ALERT* 🚨\n`;
    message += `📊 ${totalNews} Stories | ⏰ ${currentTime}\n\n`;

    if (regularNews.length > 0) {
      message += `📰 *Top News (${newsCount}):*\n`;
      regularNews.slice(0, 2).forEach((news, index) => {
        // Truncate title if too long
        const title = news.title.length > 70 ? news.title.substring(0, 70) + '...' : news.title;
        message += `${index + 1}. ${title}\n`;
        message += `   ${news.source}\n\n`;
      });

      if (regularNews.length > 2) {
        message += `+${regularNews.length - 2} more news\n\n`;
      }
    }

    if (redditPosts.length > 0) {
      message += `🔥 *Reddit Hot (${redditCount}):*\n`;
      redditPosts.slice(0, 1).forEach((post, index) => {
        // Truncate title if too long
        const title = post.title.length > 70 ? post.title.substring(0, 70) + '...' : post.title;
        message += `${index + 1}. ${title}\n`;
        message += `   r/${post.source} (${post.score}↑)\n\n`;
      });

      if (redditPosts.length > 1) {
        message += `+${redditPosts.length - 1} more Reddit\n\n`;
      }
    }

    message += `⚠️ Not financial advice. Do your own research.`;

    // Ensure message is under 1600 characters
    if (message.length > 1600) {
      message = message.substring(0, 1590) + '\n⚠️ (truncated)';
    }

    return message;
  }

  // Send batch alert for multiple news items
  async sendBatchAlert(newsItems, emailAddress = null, phoneNumber = null) {
    if (!newsItems || newsItems.length === 0) {
      logger.info('No news items to send alert for');
      return false;
    }

    const emailToUse = emailAddress || process.env.ALERT_EMAIL_ADDRESS;
    const phoneToUse = phoneNumber || process.env.ALERT_PHONE_NUMBER;

    if (!emailToUse && !phoneToUse) {
      logger.warn('No email address or phone number configured for alerts');
      console.log('❌ No email address or phone number configured - sending console alert only');

      // Send console alerts for each item
      newsItems.forEach(item => this.sendConsoleAlert(item));
      return false;
    }

    // Always send console alert
    console.log(`\n🚨 BATCH ALERT: ${newsItems.length} High-Impact Stories 🚨`);
    console.log('='.repeat(60));
    newsItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   Source: ${item.source} | Time: ${item.publishedAt ? item.publishedAt.toLocaleString() : 'Unknown'}`);
    });
    console.log('='.repeat(60));

    let emailSent = false;
    let whatsappSent = false;

    // Send email if configured
    if (this.emailTransporter && emailToUse) {
      const subject = `🚨 ${newsItems.length} High-Impact Financial Stories - ${new Date().toLocaleDateString()}`;
      const htmlContent = this.formatBatchEmailAlert(newsItems);
      emailSent = await this.sendEmailAlert(emailToUse, subject, htmlContent);
    }

    // Send WhatsApp if configured
    if (this.twilioClient && phoneToUse) {
      const whatsappMessage = this.formatWhatsAppMessage(newsItems);
      whatsappSent = await this.sendWhatsAppAlert(phoneToUse, whatsappMessage);
    }

    return emailSent || whatsappSent;
  }
}

module.exports = AlertService;
