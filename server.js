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
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36');

    await page.goto(fullUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 45000 
    });

    console.log('Page loaded. Now forcing JS to fill fields and submit...');

    // === CRITICAL PART: Manually run the auto-fill + consent + submit inside the page ===
    await page.evaluate((data) => {
      // Fill all fields
      const setValue = (name, value) => {
        const el = document.querySelector(`input[name="${name}"]`);
        if (el) {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      setValue('first_name', data.first_name);
      setValue('last_name', data.last_name);
      setValue('email', data.email);
      setValue('phone', data.phone);
      setValue('state', data.state);
      setValue('loan_balance', data.loan_balance);
      setValue('school_status', data.school_status);
      setValue('income_source', data.income_source);
      setValue('loan_type', data.loan_type);
      setValue('jornaya_leadid', data.jornaya_leadid);
      setValue('trustedform_cert_url', data.trustedform_url || data.trustedform_cert_url);
      setValue('lead_source', data.source || data.lead_source);
      setValue('sub_id', data.sub_id);

      // Force consent checkbox
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = true;
        checkbox.value = "on";
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        checkbox.dispatchEvent(new Event('input', { bubbles: true }));
        console.log('Consent checkbox forced ON');
      }

      // Auto submit the form
      const form = document.querySelector('form');
      if (form) {
        console.log('Submitting form...');
        form.submit();
      }
    }, leadData);

    // Give GHL time to process the actual form submission
    await sleep(7000);

    await browser.close();

    console.log(`✅ Form submission attempted for: ${leadData.email}`);
    res.json({
      status: "success",
      email: leadData.email,
      message: "Form submitted via headless browser with forced JS"
    });

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('❌ Error:', err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Coreg middleware running on port ${PORT}`);
});
