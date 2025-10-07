# 🚂 Deploy AI Stocks Companion Jobs to Railway

Railway is a great alternative to Render for background workers and offers a free tier.

## 🚀 Quick Deployment Steps

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Connect your GitHub account

### 2. Deploy from GitHub
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository: `mayur07/AI-Stocks-Companion-Jobs`
- Railway will automatically detect it's a Node.js project

### 3. Configure Environment Variables
In your Railway project dashboard, go to "Variables" and add:

```
TWILIO_ACCOUNT_SID=AC048f4d082ddef339c9418add00ae3368
TWILIO_AUTH_TOKEN=e72f4480471dadb8e31977bd7a437eb9
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
ALERT_PHONE_NUMBER=whatsapp:+14802082917
NODE_ENV=production
LOG_LEVEL=info
```

### 4. Deploy
- Railway will automatically deploy when you push to GitHub
- Check the logs to see if it's working

## 📱 Testing WhatsApp

Once deployed, you can test by:
1. Going to your Railway project
2. Clicking on "Logs" to see the output
3. The scheduler should start automatically and send WhatsApp messages every 30 minutes

## 🔧 Railway Advantages

- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Easy environment variable management
- ✅ Built-in logging
- ✅ No sleep mode (unlike Render free tier)
- ✅ Better for background workers

## 📊 Monitoring

- Check logs in Railway dashboard
- WhatsApp messages should be sent every 30 minutes
- Look for "✅ WhatsApp message sent successfully!" in logs

## 🆘 Troubleshooting

If WhatsApp fails:
1. Check environment variables are set correctly
2. Verify Twilio credentials are valid
3. Check Railway logs for error messages
4. Ensure phone number format is correct: `whatsapp:+14802082917`
