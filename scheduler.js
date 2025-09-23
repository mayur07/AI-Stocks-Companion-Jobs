require('dotenv').config();
const cron = require('node-cron');
const http = require('http');
const logger = require('./services/logger');
const NewsAggregator = require('./services/newsAggregator');
const RedditService = require('./services/redditService');
const AlertService = require('./services/alertService');

class JobScheduler {
  constructor() {
    this.newsAggregator = new NewsAggregator();
    this.redditService = new RedditService();
    this.alertService = new AlertService();
    this.isRunning = false;
    this.lastRun = null;
    this.runCount = 0;
    this.healthServer = null;
  }

  /**
   * Main job execution - checks for news and Reddit posts
   */
  async executeJob() {
    const startTime = new Date();
    this.runCount++;
    
    logger.info(`🚀 Starting job execution #${this.runCount} at ${startTime.toLocaleString()}`);
    console.log(`\n🚀 JOB EXECUTION #${this.runCount} - ${startTime.toLocaleString()}`);
    console.log('='.repeat(60));

    try {
      // Check for new news
      logger.info('📰 Checking for new high-impact news...');
      console.log('📰 Checking for new high-impact news...');
      
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
        logger.info(`📧 Sending alert for ${allNewItems.length} new items`);
        console.log(`📧 Sending alert for ${allNewItems.length} new items`);
        
        // Send batch alert
        const emailSent = await this.alertService.sendBatchAlert(allNewItems);
        
        if (emailSent) {
          logger.info('✅ Alert sent successfully');
          console.log('✅ Alert sent successfully');
        } else {
          logger.info('ℹ️  Alert sent to console only (email not configured or throttled)');
          console.log('ℹ️  Alert sent to console only (email not configured or throttled)');
        }
      } else {
        logger.info('ℹ️  No new high-impact items found - no alert sent');
        console.log('ℹ️  No new high-impact items found - no alert sent');
      }

      const endTime = new Date();
      const duration = (endTime - startTime) / 1000;
      
      logger.info(`✅ Job execution #${this.runCount} completed in ${duration.toFixed(2)} seconds`);
      console.log(`✅ Job execution #${this.runCount} completed in ${duration.toFixed(2)} seconds`);
      console.log('='.repeat(60));
      
      this.lastRun = endTime;

    } catch (error) {
      logger.error(`❌ Job execution #${this.runCount} failed:`, error);
      console.log(`❌ Job execution #${this.runCount} failed: ${error.message}`);
      console.log('='.repeat(60));
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
          scheduler: status
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    this.healthServer.listen(port, () => {
      logger.info(`Health server started on port ${port}`);
      console.log(`🏥 Health server started on port ${port}`);
    });
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      console.log('⚠️  Scheduler is already running');
      return;
    }

    this.isRunning = true;
    
    // Start health server for Railway
    this.startHealthServer();
    
    // Run immediately on start
    logger.info('🚀 Starting AI Stocks Companion Jobs Scheduler');
    console.log('🚀 AI STOCKS COMPANION JOBS SCHEDULER STARTED');
    console.log('📅 Schedule: Every 30 minutes');
    console.log('📧 Email alerts: ' + (process.env.SENDGRID_API_KEY ? 'Enabled' : 'Disabled'));
    console.log('🔴 Reddit monitoring: ' + (this.redditService.isRedditConfigured() ? 'Enabled' : 'Disabled (credentials not configured)'));
    console.log('📰 News monitoring: Enabled');
    console.log('='.repeat(60));

    // Execute job immediately
    this.executeJob();

    // Schedule job to run every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.executeJob();
    });

    logger.info('✅ Scheduler started - running every 30 minutes');
    console.log('✅ Scheduler started - running every 30 minutes');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.isRunning = false;
    logger.info('Scheduler stopped');
    console.log('🛑 Scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      runCount: this.runCount,
      nextRun: this.isRunning ? 'Every 30 minutes' : 'Not scheduled',
      emailConfigured: !!process.env.SENDGRID_API_KEY,
      redditConfigured: this.redditService.isRedditConfigured(),
      alertEmail: process.env.ALERT_EMAIL_ADDRESS || 'Not configured'
    };
  }

  /**
   * Display status information
   */
  displayStatus() {
    const status = this.getStatus();
    
    console.log('\n📊 SCHEDULER STATUS');
    console.log('='.repeat(40));
    console.log(`Status: ${status.isRunning ? '🟢 Running' : '🔴 Stopped'}`);
    console.log(`Last Run: ${status.lastRun ? status.lastRun.toLocaleString() : 'Never'}`);
    console.log(`Run Count: ${status.runCount}`);
    console.log(`Next Run: ${status.nextRun}`);
    console.log(`Email Alerts: ${status.emailConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Reddit Monitoring: ${status.redditConfigured ? '🟢 Enabled' : '🔴 Disabled'}`);
    console.log(`Alert Email: ${status.alertEmail}`);
    console.log('='.repeat(40));
  }
}

// Create and start the scheduler
const scheduler = new JobScheduler();

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

// Start the scheduler
scheduler.start();

// Display status every 5 minutes
setInterval(() => {
  scheduler.displayStatus();
}, 5 * 60 * 1000);

// Export for testing
module.exports = JobScheduler;
