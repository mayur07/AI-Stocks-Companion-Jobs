# Deploy AI Stocks Companion Jobs to Render

This guide will help you deploy the AI Stocks Companion Jobs system to Render as a background worker service.

## 🚀 Quick Deployment Steps

### 1. **Prepare Your Repository**
- Make sure all your Twilio credentials are hardcoded in the files
- Commit and push your changes to GitHub

### 2. **Create Render Account**
- Go to [render.com](https://render.com)
- Sign up or log in with your GitHub account

### 3. **Deploy the Jobs Service**

#### Option A: Using Render Dashboard
1. Click **"New +"** → **"Background Worker"**
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `ai-stocks-jobs`
   - **Root Directory**: `jobs`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if you need more resources)

#### Option B: Using render.yaml (Recommended)
1. The `render.yaml` file is already configured
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will automatically detect and use the `render.yaml` configuration

### 4. **Environment Variables**
Since we're using hardcoded values, no environment variables are needed. However, if you want to use environment variables instead:

```env
NODE_ENV=production
LOG_LEVEL=info
```

### 5. **Deploy**
- Click **"Create Background Worker"**
- Render will build and deploy your service
- The service will start automatically

## 📊 Monitoring Your Deployment

### **Logs**
- Go to your service dashboard on Render
- Click **"Logs"** to see real-time output
- You'll see news monitoring activity every 30 minutes

### **Status**
- **Green**: Service is running
- **Red**: Service has stopped (check logs for errors)
- **Yellow**: Service is starting up

### **Metrics**
- Monitor CPU and memory usage
- Check for any errors or crashes

## 🔧 Configuration

### **Free Plan Limitations**
- Service sleeps after 15 minutes of inactivity
- May take a few seconds to wake up
- Limited to 750 hours/month

### **Paid Plan Benefits**
- Always running (no sleep)
- Better performance
- More resources

## 🚨 Troubleshooting

### **Common Issues**

1. **Service keeps stopping**
   - Check logs for errors
   - Verify Twilio credentials are correct
   - Ensure all dependencies are installed

2. **No alerts being sent**
   - Check Twilio WhatsApp sandbox setup
   - Verify phone number format (+1234567890)
   - Check SendGrid email configuration

3. **Build failures**
   - Ensure all dependencies are in package.json
   - Check Node.js version compatibility

### **Logs to Check**
```bash
# In Render dashboard, look for:
- "News monitoring started"
- "Twilio WhatsApp notification service initialized"
- "SendGrid email notification service initialized"
- "Job execution #X completed"
```

## 📱 Testing Your Deployment

1. **Check the logs** for successful startup
2. **Wait 30 minutes** for the first news check
3. **Verify you receive alerts** on WhatsApp and email
4. **Monitor the service** for any issues

## 🔄 Updates and Maintenance

### **Updating the Service**
1. Make changes to your code
2. Commit and push to GitHub
3. Render will automatically redeploy

### **Scaling**
- Free plan: 1 instance
- Paid plans: Multiple instances available

## 📞 Support

If you encounter issues:
1. Check the Render documentation
2. Review the service logs
3. Verify your Twilio and SendGrid configurations

---

## 🎉 Success!

Once deployed, your AI Stocks Companion Jobs will:
- ✅ Run continuously in the cloud
- ✅ Monitor financial news every 30 minutes
- ✅ Send WhatsApp and email alerts
- ✅ Handle errors gracefully
- ✅ Log all activity for monitoring

Your financial news monitoring system is now running in the cloud! 🚀
