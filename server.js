const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    trustedform_url: leadData.trustedform_url || leadData.trustedform_cert_url || '',
    source: leadData.source || leadData.lead_source || '',
    sub_id: leadData.sub_id || '',
    consent: 'on'
  });

  const fullUrl = `${baseUrl}?${queryParams.toString()}`;

  console.log(`🚀 Processing: ${leadData.email || 'unknown'}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');

    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('✅ Page loaded. Forcing fill + submit...');

    await page.evaluate((data) => {
      // Fill fields
      const setField = (name, value) => {
        const el = document.querySelector(`input[name="${name}"]`);
        if (el) {
          el.value = value || '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      setField('first_name', data.first_name);
      setField('last_name', data.last_name);
      setField('email', data.email);
      setField('phone', data.phone);
      setField('state', data.state);
      setField('loan_balance', data.loan_balance);
      setField('school_status', data.school_status);
      setField('income_source', data.income_source);
      setField('loan_type', data.loan_type);
      setField('jornaya_leadid', data.jornaya_leadid);
      setField('trustedform_cert_url', data.trustedform_url || data.trustedform_cert_url);
      setField('lead_source', data.source || data.lead_source);
      setField('sub_id', data.sub_id);

      // Force consent
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = true;
        checkbox.value = "on";
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        checkbox.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('[Page] Consent checkbox forced ON');
      }

      // Click the actual Submit button (more reliable than form.submit())
      const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], .btn-submit, button.green');
      if (submitBtn) {
        console.log('[Page] Clicking Submit button...');
        submitBtn.click();
      } else {
        const form = document.querySelector('form');
        if (form) {
          console.log('[Page] Falling back to form.submit()');
          form.submit();
        }
      }
    }, leadData);

    // Give plenty of time for the actual network submission to GHL
    console.log('Waiting for GHL to process submission...');
    await sleep(12000);   // 12 seconds

    await browser.close();

    console.log(`✅ Attempt completed for: ${leadData.email}`);
    res.json({ status: "success", email: leadData.email, message: "Submit attempted with button click" });

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('❌ Error:', err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Middleware running on port ${PORT}`));
