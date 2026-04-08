const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

app.post('/submit', async (req, res) => {
  const leadData = req.body;
  
  const url = `https://formquickly.com/intake-submit-page?` + 
    `first_name=${encodeURIComponent(leadData.first_name)}&` +
    `last_name=${encodeURIComponent(leadData.last_name)}&` +
    `email=${encodeURIComponent(leadData.email)}&` +
    `phone=${encodeURIComponent(leadData.phone)}&` +
    `state=${encodeURIComponent(leadData.state)}&` +
    `loan_balance=${encodeURIComponent(leadData.loan_balance)}&` +
    `school_status=${encodeURIComponent(leadData.school_status)}&` +
    `income_source=${encodeURIComponent(leadData.income_source)}&` +
    `loan_type=${encodeURIComponent(leadData.loan_type)}&` +
    `jornaya_leadid=${encodeURIComponent(leadData.jornaya_leadid)}&` +
    `trustedform_cert_url=${encodeURIComponent(leadData.trustedform_cert_url)}&` +
    `lead_source=${encodeURIComponent(leadData.lead_source)}&` +
    `sub_id=${encodeURIComponent(leadData.sub_id)}&` +
    `consent=${encodeURIComponent(leadData.consent)}`;

  console.log("Launching browser for:", leadData.email);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  // Wait for form submission to complete
  await page.waitForTimeout(8000);
  
  await browser.close();

  res.json({ status: "success", email: leadData.email });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Coreg middleware running');
});
