require('dotenv').config();
const cron = require('node-cron');
const http = require('http');
const logger = require('./services/logger');
const EnhancedNewsAggregator = require('./services/enhancedNewsAggregator');
const RedditService = require('./services/redditService');
const EnhancedAlertService = require('./services/enhancedAlertService');
const AIAnalysisService = require('./services/aiAnalysisService');

class EnhancedJobScheduler {
  constructor() {
    this.newsAggregator = new EnhancedNewsAggregator();
    this.redditService = new RedditService();
    this.alertService = new EnhancedAlertService();
    this.aiAnalysisService = new AIAnalysisService();
    
    this.isRunning = false;
    this.lastRun = null;
    this.runCount = 0;
    this.healthServer = null;
    
    // Statistics tracking
    this.stats = {
      totalNewsProcessed: 0,
      totalRedditProcessed: 0,
      totalAlertsSent: 0,
      totalAIAnalyses: 0,
      startTime: new Date()
    };
  }

  /**
   * Main job execution - checks for news and Reddit posts with AI analysis
   */
  async executeJob() {
    const startTime = new Date();
    this.runCount++;
    
    logger.info(`🚀 Starting enhanced job execution #${this.runCount} at ${startTime.toLocaleString()}`);
    console.log(`\n🚀 ENHANCED JOB EXECUTION #${this.runCount} - ${startTime.toLocaleString()}`);
    console.log('='.repeat(80));

    try {
      // Check for new news with enhanced sources
      logger.info('📰 Checking for new high-impact news from 50+ sources...');
      console.log('📰 Checking for new high-impact news from 50+ sources...');
      
      const newNews = await this.newsAggregator.checkForNewNews();
      logger.info(`📰 Found ${newNews.length} new high-impact news items`);
      console.log(`📰 Found ${newNews.length} new high-impact news items`);

      // Check for new Reddit posts
      logger.info('🔥 Checking for new high-impact Reddit posts...');
      console.log('🔥 Checking for new high-impact Reddit posts...');
      
      const newRedditPosts = await this.redditService.checkForNewPosts();
      logger.info(`🔥 Found ${newRedditPosts.length} new high-impact Reddit posts`);
      console.log(`🔥 Found ${newRedditPosts.length} new high-impact Reddit posts`);

      // Combine all new items
      const allNewItems = [...newNews, ...newRedditPosts];
      
      if (allNewItems.length > 0) {
        logger.info(`🤖 Running AI analysis on ${allNewItems.length} items...`);
        console.log(`🤖 Running AI analysis on ${allNewItems.length} items...`);
        
        // Run AI analysis on all new items
        const analyzedItems = await this.aiAnalysisService.batchAnalyze(allNewItems);
        this.stats.totalAIAnalyses += analyzedItems.length;
        
        logger.info(`📧 Sending multi-channel alerts for ${analyzedItems.length} analyzed items`);
        console.log(`📧 Sending multi-channel alerts for ${analyzedItems.length} analyzed items`);
        
        // Send console alert for immediate visibility
        this.alertService.sendConsoleAlert(analyzedItems);
        
        // Send multi-channel batch alert
        const alertSent = await this.alertService.sendBatchAlert(analyzedItems);
        
        if (alertSent) {
          logger.info('✅ Multi-channel alerts sent successfully');
          console.log('✅ Multi-channel alerts sent successfully');
          this.stats.totalAlertsSent += analyzedItems.length;
        } else {
          logger.info('ℹ️  Alerts sent to console only (channels not configured or throttled)');
          console.log('ℹ️  Alerts sent to console only (channels not configured or throttled)');
        }
        
        // Update statistics
        this.stats.totalNewsProcessed += newNews.length;
        this.stats.totalRedditProcessed += newRedditPosts.length;
        
        // Display AI analysis statistics
        const analysisStats = this.aiAnalysisService.getAnalysisStats(analyzedItems);
        console.log('\n📊 AI ANALYSIS STATISTICS:');
        console.log(`   • Total Items Analyzed: ${analysisStats.total}`);
        console.log(`   • High Impact (7+): ${analysisStats.highImpact}`);
        console.log(`   • Critical Impact (8+): ${analysisStats.criticalImpact}`);
        console.log(`   • Bullish Sentiment: ${analysisStats.bullish}`);
        console.log(`   • Bearish Sentiment: ${analysisStats.bearish}`);
        console.log(`   • Neutral Sentiment: ${analysisStats.neutral}`);
        console.log(`   • Average Impact Score: ${analysisStats.avgImpactScore.toFixed(2)}`);
        console.log(`   • Average Confidence: ${analysisStats.avgConfidence.toFixed(1)}%`);
        
        // Display top sectors and stocks
        if (Object.keys(analysisStats.topSectors).length > 0) {
          const topSectors = Object.entries(analysisStats.topSectors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
          console.log(`   • Top Sectors: ${topSectors.map(([sector, count]) => `${sector}(${count})`).join(', ')}`);
        }
        
        if (Object.keys(analysisStats.topStocks).length > 0) {
          const topStocks = Object.entries(analysisStats.topStocks)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
          console.log(`   • Top Stocks: ${topStocks.map(([stock, count]) => `${stock}(${count})`).join(', ')}`);
        }
        
      } else {
        logger.info('ℹ️  No new high-impact items found - no alerts sent');
        console.log('ℹ️  No new high-impact items found - no alerts sent');
      }

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      
      logger.info(`✅ Enhanced job execution #${this.runCount} completed in ${duration.toFixed(2)} seconds`);
      console.log(`✅ Enhanced job execution #${this.runCount} completed in ${duration.toFixed(2)} seconds`);
      console.log('='.repeat(80));
      
      this.lastRun = endTime;

    } catch (error) {
      logger.error(`❌ Enhanced job execution #${this.runCount} failed:`, error);
      console.log(`❌ Enhanced job execution #${this.runCount} failed: ${error.message}`);
      console.log('='.repeat(80));
    }
  }

  /**
   * Start health check server for Railway
   */
  startHealthServer() {
    const port = process.env.PORT || 3000;
    
    this.healthServer = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/health') {
        const status = this.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          scheduler: status,
          statistics: this.stats
        }));
      } else if (req.url === '/stats') {
        const newsStats = this.newsAggregator.getNewsStats();
        const alertStatus = this.alertService.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          newsStats: newsStats,
          alertStatus: alertStatus,
          schedulerStats: this.stats
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    this.healthServer.listen(port, () => {
      logger.info(`Enhanced health server started on port ${port}`);
      console.log(`🏥 Enhanced health server started on port ${port}`);
    });
  }

  /**
   * Start the enhanced scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Enhanced scheduler is already running');
      console.log('⚠️  Enhanced scheduler is already running');
      return;
    }

    this.isRunning = true;
    
    // Start health server for Railway
    this.startHealthServer();
    
    // Run immediately on start
    logger.info('🚀 Starting AI Stocks Companion Enhanced Jobs Scheduler');
    console.log('🚀 AI STOCKS COMPANION ENHANCED JOBS SCHEDULER STARTED');
    console.log('📅 Schedule: Every 15 minutes');
    console.log('📰 News Sources: 50+ premium financial sources');
    console.log('🤖 AI Analysis: OpenAI GPT-3.5 integration');
    console.log('📧 Email alerts: ' + (process.env.SENDGRID_API_KEY ? 'Enabled' : 'Disabled'));
    console.log('📱 WhatsApp alerts: ' + (process.env.TWILIO_ACCOUNT_SID ? 'Enabled' : 'Disabled'));
    console.log('📱 Telegram alerts: ' + (process.env.TELEGRAM_BOT_TOKEN ? 'Enabled' : 'Disabled'));
    console.log('💬 Discord alerts: ' + (process.env.DISCORD_WEBHOOK_URL ? 'Enabled' : 'Disabled'));
    console.log('💬 Slack alerts: ' + (process.env.SLACK_WEBHOOK_URL ? 'Enabled' : 'Disabled'));
    console.log('🔔 Push notifications: ' + (process.env.PUSH_NOTIFICATION_KEY ? 'Enabled' : 'Disabled'));
    console.log('🔴 Reddit monitoring: ' + (this.redditService.isRedditConfigured() ? 'Enabled' : 'Disabled (credentials not configured)'));
    console.log('='.repeat(80));

    // Execute job immediately
    this.executeJob();

    // Schedule job to run every 15 minutes (more frequent for better coverage)
    cron.schedule('*/15 * * * *', () => {
      this.executeJob();
    });

    // Schedule daily statistics report at 6 PM
    cron.schedule('0 18 * * *', () => {
      this.generateDailyReport();
    });

    logger.info('✅ Enhanced scheduler started - running every 15 minutes');
    console.log('✅ Enhanced scheduler started - running every 15 minutes');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.isRunning = false;
    logger.info('Enhanced scheduler stopped');
    console.log('🛑 Enhanced scheduler stopped');
  }

  /**
   * Generate daily statistics report
   */
  async generateDailyReport() {
    const newsStats = this.newsAggregator.getNewsStats();
    const alertStatus = this.alertService.getStatus();
    
    const report = `
📊 DAILY STATISTICS REPORT - ${new Date().toLocaleString()}
${'='.repeat(60)}
📰 NEWS STATISTICS:
   • Total Sources: ${newsStats.sources}
   • Total Articles: ${newsStats.total}
   • High Impact Articles: ${newsStats.highImpact}
   • Average Impact Score: ${newsStats.avgImpactScore.toFixed(2)}

📊 CATEGORY BREAKDOWN:
   • Earnings: ${newsStats.categories.earnings}
   • Fed/Policy: ${newsStats.categories.fed}
   • IPO: ${newsStats.categories.ipo}
   • M&A: ${newsStats.categories['m&a']}
   • Corporate: ${newsStats.categories.corporate}
   • Economic: ${newsStats.categories.economic}
   • Crypto: ${newsStats.categories.crypto}
   • Energy: ${newsStats.categories.energy}
   • Technology: ${newsStats.categories.technology}
   • General: ${newsStats.categories.general}

🤖 AI ANALYSIS STATISTICS:
   • Total Analyses: ${this.stats.totalAIAnalyses}
   • News Processed: ${this.stats.totalNewsProcessed}
   • Reddit Processed: ${this.stats.totalRedditProcessed}
   • Alerts Sent: ${this.stats.totalAlertsSent}

📧 ALERT CHANNEL STATUS:
   • Email: ${alertStatus.email.configured ? '✅ Configured' : '❌ Not Configured'}
   • WhatsApp: ${alertStatus.whatsapp.configured ? '✅ Configured' : '❌ Not Configured'}
   • Telegram: ${alertStatus.telegram.configured ? '✅ Configured' : '❌ Not Configured'}
   • Discord: ${alertStatus.discord.configured ? '✅ Configured' : '❌ Not Configured'}
   • Slack: ${alertStatus.slack.configured ? '✅ Configured' : '❌ Not Configured'}
   • Push: ${alertStatus.push.configured ? '✅ Configured' : '❌ Not Configured'}

⏰ UPTIME: ${Math.floor((Date.now() - this.stats.startTime.getTime()) / (1000 * 60 * 60))} hours
${'='.repeat(60)}
    `;
    
    console.log(report);
    logger.info('Daily statistics report generated');
  }

  /**
   * Get enhanced scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      runCount: this.runCount,
      nextRun: this.isRunning ? 'Every 15 minutes' : 'Not scheduled',
      emailConfigured: !!process.env.SENDGRID_API_KEY,
      whatsappConfigured: !!process.env.TWILIO_ACCOUNT_SID,
      telegramConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      discordConfigured: !!process.env.DISCORD_WEBHOOK_URL,
      slackConfigured: !!process.env.SLACK_WEBHOOK_URL,
      pushConfigured: !!process.env.PUSH_NOTIFICATION_KEY,
      redditConfigured: this.redditService.isRedditConfigured(),
      aiConfigured: !!process.env.OPENAI_API_KEY,
      alertEmail: process.env.ALERT_EMAIL_ADDRESS || 'Not configured',
      newsSources: this.newsAggregator.newsSources.length,
      statistics: this.stats
    };
  }

  /**
   * Display enhanced status information
   */
  displayStatus() {
    const status = this.getStatus();
    const newsStats = this.newsAggregator.getNewsStats();
    
    console.log('\n📊 ENHANCED SCHEDULER STATUS');
    console.log('='.repeat(60));
    console.log(`Status: ${status.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
    console.log(`Last Run: ${status.lastRun ? status.lastRun.toLocaleString() : 'Never'}`);
    console.log(`Run Count: ${status.runCount}`);
    console.log(`Next Run: ${status.nextRun}`);
    console.log(`News Sources: ${status.newsSources} premium sources`);
    console.log(`AI Analysis: ${status.aiConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Email Alerts: ${status.emailConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`WhatsApp Alerts: ${status.whatsappConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Telegram Alerts: ${status.telegramConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Discord Alerts: ${status.discordConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Slack Alerts: ${status.slackConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Push Notifications: ${status.pushConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Reddit Monitoring: ${status.redditConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Alert Email: ${status.alertEmail}`);
    console.log(`Total Articles: ${newsStats.total}`);
    console.log(`High Impact: ${newsStats.highImpact}`);
    console.log(`AI Analyses: ${this.stats.totalAIAnalyses}`);
    console.log(`Alerts Sent: ${this.stats.totalAlertsSent}`);
    console.log('='.repeat(60));
  }
}

// Create and start the enhanced scheduler
const scheduler = new EnhancedJobScheduler();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

// Start the enhanced scheduler
scheduler.start();

// Display status every 10 minutes
setInterval(() => {
  scheduler.displayStatus();
}, 10 * 60 * 1000);

// Export for testing
module.exports = EnhancedJobScheduler;
