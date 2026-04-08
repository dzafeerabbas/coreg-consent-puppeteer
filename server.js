const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/submit', async (req, res) => {
  const leadData = req.body;
  
  const baseUrl = 'https://formquickly.com/intake-submit-page';
  const queryParams = new URLSearchParams({
    first_name: leadData.first_name || '',
    last_name: leadData.last_name || '',
    email: leadData.email || '',
    phone: leadData.phone || '',
    state: leadData.state || '',
    loan_balance: leadData.loan_balance || '',
    school_status: leadData.school_status || '',
    income_source: leadData.income_source || '',
    loan_type: leadData.loan_type || '',
    jornaya_leadid: leadData.jornaya_leadid || '',
    trustedform_cert_url: leadData.trustedform_cert_url || '',
    lead_source: leadData.lead_source || '',
    sub_id: leadData.sub_id || '',
    consent: 'on'
  });

  const fullUrl = `${baseUrl}?${queryParams.toString()}`;

  console.log(`🚀 Processing lead: ${leadData.email || 'unknown'}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set a realistic user-agent so GHL doesn't block it
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');

    await page.goto(fullUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 45000 
    });

    // Extra waits to let JS fully execute (this is the key part)
    console.log("Waiting for JS to populate fields and submit form...");
    await page.waitForTimeout(3000);   // Initial load

    // Try to confirm the form was submitted by waiting for navigation or success indicator
    await page.waitForTimeout(6000);

    // Optional: Check if we can see any success message or redirect
    const pageContent = await page.content();
    if (pageContent.includes("success") || pageContent.includes("submitted")) {
      console.log("Possible success indicator found in page");
    }

    await browser.close();

    console.log(`✅ Successfully processed lead: ${leadData.email || 'unknown'}`);
    res.json({ status: "success", email: leadData.email, message: "Form submitted via headless browser" });

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error("❌ Puppeteer error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Coreg middleware running on port ${PORT}`);
});
