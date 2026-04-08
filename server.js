const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/submit', async (req, res) => {
  const leadData = req.body;

  const url = `https://formquickly.com/intake-submit-page?` +
    `first_name=${encodeURIComponent(leadData.first_name || '')}&` +
    `last_name=${encodeURIComponent(leadData.last_name || '')}&` +
    `email=${encodeURIComponent(leadData.email || '')}&` +
    `phone=${encodeURIComponent(leadData.phone || '')}&` +
    `state=${encodeURIComponent(leadData.state || '')}&` +
    `loan_balance=${encodeURIComponent(leadData.loan_balance || '')}&` +
    `school_status=${encodeURIComponent(leadData.school_status || '')}&` +
    `income_source=${encodeURIComponent(leadData.income_source || '')}&` +
    `loan_type=${encodeURIComponent(leadData.loan_type || '')}&` +
    `jornaya_leadid=${encodeURIComponent(leadData.jornaya_leadid || '')}&` +
    `trustedform_cert_url=${encodeURIComponent(leadData.trustedform_cert_url || '')}&` +
    `lead_source=${encodeURIComponent(leadData.lead_source || '')}&` +
    `sub_id=${encodeURIComponent(leadData.sub_id || '')}&` +
    `consent=${encodeURIComponent(leadData.consent)}`;

  console.log("Launching browser for:", leadData.email);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for form submission to complete
    await new Promise(resolve => setTimeout(resolve, 8000));

    await browser.close();

    console.log("Success for:", leadData.email);
    res.json({ status: "success", email: leadData.email });

  } catch (err) {
    if (browser) await browser.close();
    console.error("Error:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Coreg middleware running on port', process.env.PORT || 3000);
});
