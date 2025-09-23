# AI Stocks Companion Jobs

A separate background job system that monitors financial news and Reddit posts every 30 minutes and sends alerts when high-impact stories are detected.

## Features

- 📰 **News Monitoring**: Monitors RSS feeds from major financial news sources
- 🔥 **Reddit Monitoring**: Tracks high-engagement posts from financial subreddits
- 🎯 **High-Impact Filtering**: Uses advanced filtering to identify truly market-moving news
- 📧 **Email Alerts**: Sends formatted email alerts via SendGrid
- 🖥️ **Console Alerts**: Displays alerts in console for immediate visibility
- ⏰ **30-Minute Schedule**: Runs automatically every 30 minutes
- 🚫 **Duplicate Prevention**: Avoids sending duplicate alerts
- 📊 **Comprehensive Logging**: Detailed logging for monitoring and debugging

## Quick Start

### 1. Install Dependencies

```bash
cd jobs
npm install
```

### 2. Configure Environment

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Email Configuration (Required for email alerts)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=your_email@domain.com
ALERT_EMAIL_ADDRESS=your_alert_email@domain.com

# Reddit API Configuration (Optional - for Reddit monitoring)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USERNAME=your_reddit_username
REDDIT_PASSWORD=your_reddit_password
```

### 3. Run the Jobs

#### Start the Scheduler (Recommended)
```bash
npm start
```

#### Run Individual Tests
```bash
# Test all services
npm test

# Test news monitoring only
npm run news-only

# Test Reddit monitoring only
npm run reddit-only
```

## Configuration

### WhatsApp Setup (Twilio) - Recommended

1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token from the Twilio Console
3. Set up WhatsApp Sandbox:
   - Go to Console > Develop > Messaging > Try it out > Send a WhatsApp message
   - Follow the instructions to connect your WhatsApp number
   - Use the sandbox number: `+14155238886`
4. Add your credentials to the `.env` file:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ALERT_PHONE_NUMBER=whatsapp:+your_phone_number
   ```

### Email Setup (SendGrid) - Optional

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key
3. Set up domain authentication (recommended)
4. Add your API key to the `.env` file

### Reddit API Setup (Optional)

1. Go to [reddit.com/prefs/apps](https://reddit.com/prefs/apps)
2. Create a new app (script type)
3. Note your client ID and secret
4. Add credentials to the `.env` file

## How It Works

### News Monitoring
- Fetches RSS feeds from major financial news sources:
  - MarketWatch
  - CNBC Business
  - Bloomberg
  - Financial Times
  - Wall Street Journal
- Filters for high-impact news using advanced keyword matching
- Excludes routine market commentary and low-impact stories

### Reddit Monitoring
- Monitors financial subreddits:
  - r/wallstreetbets
  - r/stocks
  - r/investing
  - r/SecurityAnalysis
  - r/StockMarket
- Filters for high-engagement posts (score > 100 or comments > 50)
- Identifies posts with market-moving keywords

### Alert System
- **Email Throttling**: Sends emails maximum once every 30 minutes
- **Batch Alerts**: Combines multiple news items into single email
- **Console Alerts**: Always displays alerts in console for immediate visibility
- **Duplicate Prevention**: Tracks sent items to avoid duplicates

## High-Impact News Criteria

The system uses strict filtering to identify truly market-moving news:

### Included Keywords
- Major corporate events (M&A, bankruptcy, leadership changes)
- Critical earnings results (beats/misses, guidance changes)
- Regulatory actions (SEC investigations, fines, settlements)
- Market crisis events (crashes, circuit breakers, recessions)
- Federal Reserve policy changes
- Major economic indicators (with significance filters)
- Geopolitical events (trade wars, sanctions)
- Technology breakthroughs
- Healthcare/pharma developments
- Banking/financial crises
- Cryptocurrency major events

### Excluded Content
- Routine market commentary
- Generic company announcements
- Opinion pieces and analysis
- Low-impact economic data
- Non-financial content

## Monitoring and Logs

### Log Files
- `logs/combined.log` - All log entries
- `logs/error.log` - Error entries only

### Console Output
The scheduler provides real-time status updates:
- Job execution times
- Number of news items found
- Email send status
- Error notifications

### Status Display
Every 5 minutes, the system displays:
- Current status (running/stopped)
- Last run time
- Total run count
- Configuration status

## Scripts

- `npm start` - Start the main scheduler
- `npm run dev` - Start with nodemon for development
- `npm test` - Test all services
- `npm run news-only` - Test news monitoring only
- `npm run reddit-only` - Test Reddit monitoring only

## Troubleshooting

### Common Issues

1. **No email alerts being sent**
   - Check SendGrid API key configuration
   - Verify email addresses are correct
   - Check email throttling (30-minute limit)

2. **Reddit monitoring not working**
   - Verify Reddit API credentials
   - Check if Reddit API is accessible
   - System will fall back to mock data if Reddit is unavailable

3. **No news being detected**
   - Check internet connectivity
   - Verify RSS feed URLs are accessible
   - Review filtering criteria (may be too strict)

4. **High memory usage**
   - System automatically cleans up old data
   - Restart if memory usage becomes excessive

### Debug Mode

Set `NODE_ENV=development` in your `.env` file for more detailed logging.

## Production Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start scheduler.js --name "ai-stocks-jobs"
pm2 startup
pm2 save
```

### Using systemd
Create a service file at `/etc/systemd/system/ai-stocks-jobs.service`:

```ini
[Unit]
Description=AI Stocks Companion Jobs
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/jobs
ExecStart=/usr/bin/node scheduler.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable ai-stocks-jobs
sudo systemctl start ai-stocks-jobs
```

## Security Notes

- Keep your `.env` file secure and never commit it to version control
- Use environment variables in production
- Regularly rotate API keys
- Monitor log files for suspicious activity

## Support

For issues or questions:
1. Check the logs in the `logs/` directory
2. Run the test script to verify configuration
3. Review the troubleshooting section above

## License

MIT License - see LICENSE file for details.
