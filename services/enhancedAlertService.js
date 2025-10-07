const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const logger = require('./logger');

class EnhancedAlertService {
  constructor() {
    this.emailTransporter = null;
    this.twilioClient = null;
    this.lastEmailSent = null;
    this.lastWhatsAppSent = null;
    this.lastTelegramSent = null;
    this.lastDiscordSent = null;
    this.lastSlackSent = null;
    this.lastPushSent = null;
    
    this.emailThrottleMinutes = 30; // Send email only every 30 minutes
    this.whatsappThrottleMinutes = 30; // Send WhatsApp only every 30 minutes
    this.telegramThrottleMinutes = 15; // Send Telegram every 15 minutes
    this.discordThrottleMinutes = 10; // Send Discord every 10 minutes
    this.slackThrottleMinutes = 10; // Send Slack every 10 minutes
    this.pushThrottleMinutes = 5; // Send push notifications every 5 minutes
    
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
    const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC048f4d082ddef339c9418add00ae3368';
    const authToken = process.env.TWILIO_AUTH_TOKEN || '6383ee8e7bce637fcc453eec51a71138';
    
    if (accountSid && authToken && authToken !== '[AuthToken]') {
      this.twilioClient = twilio(accountSid, authToken);
      logger.info('Twilio WhatsApp notification service initialized');
    } else {
      logger.warn('Twilio credentials not configured - WhatsApp notifications disabled');
    }

    // Initialize Telegram service
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
      this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
      logger.info('Telegram notification service initialized');
    } else {
      logger.warn('Telegram credentials not configured - Telegram notifications disabled');
    }

    // Initialize Discord service
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
      logger.info('Discord notification service initialized');
    } else {
      logger.warn('Discord webhook not configured - Discord notifications disabled');
    }

    // Initialize Slack service
    if (process.env.SLACK_WEBHOOK_URL) {
      this.slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      logger.info('Slack notification service initialized');
    } else {
      logger.warn('Slack webhook not configured - Slack notifications disabled');
    }

    // Initialize Push notification service
    if (process.env.PUSH_NOTIFICATION_KEY) {
      this.pushNotificationKey = process.env.PUSH_NOTIFICATION_KEY;
      logger.info('Push notification service initialized');
    } else {
      logger.warn('Push notification key not configured - Push notifications disabled');
    }
  }

  // Check if enough time has passed since last email (30-minute throttle)
  canSendEmail() {
    if (!this.lastEmailSent) return true;
    const now = new Date();
    const timeSinceLastEmail = (now - this.lastEmailSent) / (1000 * 60);
    return timeSinceLastEmail >= this.emailThrottleMinutes;
  }

  // Check if enough time has passed since last WhatsApp (30-minute throttle)
  canSendWhatsApp() {
    if (!this.lastWhatsAppSent) return true;
    const now = new Date();
    const timeSinceLastWhatsApp = (now - this.lastWhatsAppSent) / (1000 * 60);
    return timeSinceLastWhatsApp >= this.whatsappThrottleMinutes;
  }

  // Check if enough time has passed since last Telegram (15-minute throttle)
  canSendTelegram() {
    if (!this.lastTelegramSent) return true;
    const now = new Date();
    const timeSinceLastTelegram = (now - this.lastTelegramSent) / (1000 * 60);
    return timeSinceLastTelegram >= this.telegramThrottleMinutes;
  }

  // Check if enough time has passed since last Discord (10-minute throttle)
  canSendDiscord() {
    if (!this.lastDiscordSent) return true;
    const now = new Date();
    const timeSinceLastDiscord = (now - this.lastDiscordSent) / (1000 * 60);
    return timeSinceLastDiscord >= this.discordThrottleMinutes;
  }

  // Check if enough time has passed since last Slack (10-minute throttle)
  canSendSlack() {
    if (!this.lastSlackSent) return true;
    const now = new Date();
    const timeSinceLastSlack = (now - this.lastSlackSent) / (1000 * 60);
    return timeSinceLastSlack >= this.slackThrottleMinutes;
  }

  // Check if enough time has passed since last Push (5-minute throttle)
  canSendPush() {
    if (!this.lastPushSent) return true;
    const now = new Date();
    const timeSinceLastPush = (now - this.lastPushSent) / (1000 * 60);
    return timeSinceLastPush >= this.pushThrottleMinutes;
  }

  /**
   * Send email alert with enhanced formatting
   */
  async sendEmailAlert(newsItems) {
    if (!this.emailTransporter || !this.canSendEmail()) {
      logger.info('Email alert skipped - not configured or throttled');
      return false;
    }

    try {
      const emailAddress = process.env.ALERT_EMAIL_ADDRESS || 'mayur.mathurkar7@gmail.com';
      const subject = `🚨 AI Stocks Alert: ${newsItems.length} High-Impact News Items`;
      
      const htmlContent = this.formatEmailContent(newsItems);
      
      const msg = {
        to: emailAddress,
        from: process.env.SENDGRID_FROM_EMAIL || 'aistockcompanion@gmail.com',
        subject: subject,
        html: htmlContent
      };

      await this.emailTransporter.send(msg);
      this.lastEmailSent = new Date();
      
      logger.info(`Email alert sent successfully to ${emailAddress}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email alert:', error);
      return false;
    }
  }

  /**
   * Send WhatsApp alert with short heading
   */
  async sendWhatsAppAlert(newsItems) {
    if (!this.twilioClient || !this.canSendWhatsApp()) {
      logger.info('WhatsApp alert skipped - not configured or throttled');
      return false;
    }

    try {
      const phoneNumber = process.env.ALERT_PHONE_NUMBER || 'whatsapp:+14802082917';
      
      for (const item of newsItems) {
        const message = item.shortHeading || `🚨 ${item.title}`;
        
        await this.twilioClient.messages.create({
          body: message,
          from: 'whatsapp:+14155238886',
          to: phoneNumber
        });
        
        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.lastWhatsAppSent = new Date();
      logger.info(`WhatsApp alerts sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp alert:', error);
      return false;
    }
  }

  /**
   * Send Telegram alert
   */
  async sendTelegramAlert(newsItems) {
    if (!this.telegramBotToken || !this.telegramChatId || !this.canSendTelegram()) {
      logger.info('Telegram alert skipped - not configured or throttled');
      return false;
    }

    try {
      const axios = require('axios');
      const telegramUrl = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      
      for (const item of newsItems) {
        const message = item.shortHeading || `🚨 ${item.title}`;
        
        await axios.post(telegramUrl, {
          chat_id: this.telegramChatId,
          text: message,
          parse_mode: 'HTML'
        });
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.lastTelegramSent = new Date();
      logger.info('Telegram alerts sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send Telegram alert:', error);
      return false;
    }
  }

  /**
   * Send Discord alert
   */
  async sendDiscordAlert(newsItems) {
    if (!this.discordWebhookUrl || !this.canSendDiscord()) {
      logger.info('Discord alert skipped - not configured or throttled');
      return false;
    }

    try {
      const axios = require('axios');
      
      for (const item of newsItems) {
        const embed = {
          title: item.shortHeading || `🚨 ${item.title}`,
          description: item.description || 'No description available',
          url: item.url,
          color: item.aiAnalysis?.impactScore >= 8 ? 0xff0000 : // Red for critical
                 item.aiAnalysis?.impactScore >= 6 ? 0xff8800 : // Orange for high
                 0x00ff00, // Green for medium
          fields: [
            {
              name: 'Impact Score',
              value: `${item.aiAnalysis?.impactScore || item.impactScore}/10`,
              inline: true
            },
            {
              name: 'Market Sentiment',
              value: item.aiAnalysis?.marketSentiment || 'neutral',
              inline: true
            },
            {
              name: 'Source',
              value: item.source,
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        };
        
        await axios.post(this.discordWebhookUrl, {
          embeds: [embed]
        });
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.lastDiscordSent = new Date();
      logger.info('Discord alerts sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send Discord alert:', error);
      return false;
    }
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(newsItems) {
    if (!this.slackWebhookUrl || !this.canSendSlack()) {
      logger.info('Slack alert skipped - not configured or throttled');
      return false;
    }

    try {
      const axios = require('axios');
      
      for (const item of newsItems) {
        const message = {
          text: item.shortHeading || `🚨 ${item.title}`,
          attachments: [
            {
              color: item.aiAnalysis?.impactScore >= 8 ? 'danger' : // Red for critical
                     item.aiAnalysis?.impactScore >= 6 ? 'warning' : // Yellow for high
                     'good', // Green for medium
              fields: [
                {
                  title: 'Impact Score',
                  value: `${item.aiAnalysis?.impactScore || item.impactScore}/10`,
                  short: true
                },
                {
                  title: 'Market Sentiment',
                  value: item.aiAnalysis?.marketSentiment || 'neutral',
                  short: true
                },
                {
                  title: 'Source',
                  value: item.source,
                  short: true
                }
              ],
              actions: [
                {
                  type: 'button',
                  text: 'Read More',
                  url: item.url
                }
              ]
            }
          ]
        };
        
        await axios.post(this.slackWebhookUrl, message);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.lastSlackSent = new Date();
      logger.info('Slack alerts sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  /**
   * Send push notification
   */
  async sendPushAlert(newsItems) {
    if (!this.pushNotificationKey || !this.canSendPush()) {
      logger.info('Push alert skipped - not configured or throttled');
      return false;
    }

    try {
      const axios = require('axios');
      
      for (const item of newsItems) {
        const notification = {
          to: this.pushNotificationKey,
          title: item.shortHeading || `🚨 ${item.title}`,
          body: item.description || 'High-impact financial news detected',
          data: {
            url: item.url,
            impactScore: item.aiAnalysis?.impactScore || item.impactScore,
            sentiment: item.aiAnalysis?.marketSentiment || 'neutral'
          }
        };
        
        await axios.post('https://exp.host/--/api/v2/push/send', notification);
        
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.lastPushSent = new Date();
      logger.info('Push notifications sent successfully');
      return true;
    } catch (error) {
      logger.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Send multi-channel batch alert
   */
  async sendBatchAlert(newsItems) {
    if (!newsItems || newsItems.length === 0) {
      logger.info('No news items to send alerts for');
      return false;
    }

    logger.info(`Sending batch alert for ${newsItems.length} news items across multiple channels`);
    
    const results = {
      email: false,
      whatsapp: false,
      telegram: false,
      discord: false,
      slack: false,
      push: false
    };

    // Send alerts in parallel for better performance
    const promises = [
      this.sendEmailAlert(newsItems).then(result => { results.email = result; }),
      this.sendWhatsAppAlert(newsItems).then(result => { results.whatsapp = result; }),
      this.sendTelegramAlert(newsItems).then(result => { results.telegram = result; }),
      this.sendDiscordAlert(newsItems).then(result => { results.discord = result; }),
      this.sendSlackAlert(newsItems).then(result => { results.slack = result; }),
      this.sendPushAlert(newsItems).then(result => { results.push = result; })
    ];

    await Promise.allSettled(promises);
    
    const successCount = Object.values(results).filter(Boolean).length;
    logger.info(`Batch alert completed: ${successCount}/6 channels successful`, results);
    
    return successCount > 0;
  }

  /**
   * Format email content with enhanced styling
   */
  formatEmailContent(newsItems) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Stocks Companion Alert</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
            .news-item { background: #f8f9fa; border-left: 4px solid #667eea; margin: 20px 0; padding: 20px; border-radius: 5px; }
            .news-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .news-meta { color: #666; font-size: 14px; margin-bottom: 10px; }
            .impact-score { display: inline-block; padding: 5px 10px; border-radius: 15px; color: white; font-weight: bold; }
            .impact-high { background: #ff4444; }
            .impact-medium { background: #ff8800; }
            .impact-low { background: #00aa00; }
            .ai-analysis { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 AI Stocks Companion Alert</h1>
                <p>${newsItems.length} High-Impact News Items Detected</p>
            </div>
            
            ${newsItems.map(item => `
                <div class="news-item">
                    <div class="news-title">${item.shortHeading || item.title}</div>
                    <div class="news-meta">
                        <strong>Source:</strong> ${item.source} | 
                        <strong>Published:</strong> ${new Date(item.publishedAt).toLocaleString()} |
                        <span class="impact-score ${item.aiAnalysis?.impactScore >= 8 ? 'impact-high' : item.aiAnalysis?.impactScore >= 6 ? 'impact-medium' : 'impact-low'}">
                            Impact: ${item.aiAnalysis?.impactScore || item.impactScore}/10
                        </span>
                    </div>
                    <p>${item.description}</p>
                    ${item.aiAnalysis ? `
                        <div class="ai-analysis">
                            <h4>🤖 AI Analysis:</h4>
                            <p><strong>Market Sentiment:</strong> ${item.aiAnalysis.marketSentiment}</p>
                            <p><strong>Expected Movement:</strong> ${item.aiAnalysis.predictedPriceMovement}</p>
                            <p><strong>Time Horizon:</strong> ${item.aiAnalysis.timeHorizon}</p>
                            <p><strong>Affected Sectors:</strong> ${item.aiAnalysis.affectedSectors.join(', ')}</p>
                            <p><strong>Key Stocks:</strong> ${item.aiAnalysis.keyStocks.join(', ')}</p>
                        </div>
                    ` : ''}
                    <p><a href="${item.url}" target="_blank">Read Full Article →</a></p>
                </div>
            `).join('')}
            
            <div class="footer">
                <p>⚠️ This is for informational purposes only and not financial advice.</p>
                <p>AI Stocks Companion - Powered by Advanced AI Analysis</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return html;
  }

  /**
   * Send console alert for immediate visibility
   */
  sendConsoleAlert(newsItems) {
    console.log('\n' + '='.repeat(80));
    console.log('🚨 AI STOCKS COMPANION ALERT');
    console.log('='.repeat(80));
    console.log(`📊 ${newsItems.length} High-Impact News Items Detected`);
    console.log('='.repeat(80));
    
    newsItems.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.shortHeading || item.title}`);
      console.log(`   📰 Source: ${item.source}`);
      console.log(`   🎯 Impact Score: ${item.aiAnalysis?.impactScore || item.impactScore}/10`);
      console.log(`   📈 Market Sentiment: ${item.aiAnalysis?.marketSentiment || 'neutral'}`);
      console.log(`   🔗 URL: ${item.url}`);
      
      if (item.aiAnalysis) {
        console.log(`   🤖 AI Analysis:`);
        console.log(`      • Expected Movement: ${item.aiAnalysis.predictedPriceMovement}`);
        console.log(`      • Time Horizon: ${item.aiAnalysis.timeHorizon}`);
        console.log(`      • Affected Sectors: ${item.aiAnalysis.affectedSectors.join(', ')}`);
        console.log(`      • Key Stocks: ${item.aiAnalysis.keyStocks.join(', ')}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  This is for informational purposes only and not financial advice.');
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Get alert service status
   */
  getStatus() {
    return {
      email: {
        configured: !!this.emailTransporter,
        lastSent: this.lastEmailSent,
        canSend: this.canSendEmail()
      },
      whatsapp: {
        configured: !!this.twilioClient,
        lastSent: this.lastWhatsAppSent,
        canSend: this.canSendWhatsApp()
      },
      telegram: {
        configured: !!(this.telegramBotToken && this.telegramChatId),
        lastSent: this.lastTelegramSent,
        canSend: this.canSendTelegram()
      },
      discord: {
        configured: !!this.discordWebhookUrl,
        lastSent: this.lastDiscordSent,
        canSend: this.canSendDiscord()
      },
      slack: {
        configured: !!this.slackWebhookUrl,
        lastSent: this.lastSlackSent,
        canSend: this.canSendSlack()
      },
      push: {
        configured: !!this.pushNotificationKey,
        lastSent: this.lastPushSent,
        canSend: this.canSendPush()
      }
    };
  }
}

module.exports = EnhancedAlertService;
