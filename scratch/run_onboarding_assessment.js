const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\DELL-G3 15-3500\\.gemini\\antigravity-ide\\brain\\6bc3dd09-6fd3-4326-b423-ffcb333066b9';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log('Launching Chrome from:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await delay(2000);

    // Capture initial onboarding screen
    await page.screenshot({ path: path.join(artifactDir, 'step_1_onboarding.png') });
    console.log('Screenshot saved: step_1_onboarding.png');

    console.log('Filling out Step 1 of Onboarding...');
    await page.type('input[placeholder="Jane Doe"]', 'Test Lead');
    await page.type('input[type="email"]', 'lead@test.com');
    await page.type('input[placeholder="Acme Technologies"]', 'Test Enterprises');

    // Select Role
    await page.select('select', 'Founder / Co-Founder');

    // Phone
    await page.type('input[type="tel"]', '9876543210');

    // Click Continue
    console.log('Clicking Continue...');
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const continueBtn = btns.find(b => b.textContent.includes('Continue'));
      if (continueBtn) continueBtn.click();
    });
    await delay(1500);

    console.log('Filling out Step 2 of Onboarding...');
    await page.type('input[placeholder="e.g. MedSync AI"]', 'AlphaSaaS Portal');

    // Select Sector, Business Type, Geography
    const selects = await page.$$('select');
    // selects[0] is Sector
    await page.evaluate((el) => { el.value = 'Information Technology / SaaS'; el.dispatchEvent(new Event('change')); }, selects[0]);
    // selects[1] is Business Type
    await page.evaluate((el) => { el.value = 'SaaS / Platform'; el.dispatchEvent(new Event('change')); }, selects[1]);
    // selects[2] is Target Geography
    await page.evaluate((el) => { el.value = 'PI'; el.dispatchEvent(new Event('change')); }, selects[2]);

    // Click first stage chip ("Idea Stage")
    await page.evaluate(() => {
      const chips = [...document.querySelectorAll('span')].filter(el => el.textContent.includes('Idea Stage'));
      if (chips.length > 0) chips[0].click();
    });

    // Describe the problem (min 20 chars)
    await page.type('textarea', 'Hospitals face significant delays in patient check-in times due to manual front-desk processes.');

    // Consent checkbox
    await page.click('input[type="checkbox"]');

    // Screenshot of filled step 2
    await page.screenshot({ path: path.join(artifactDir, 'step_2_filled.png') });
    console.log('Screenshot saved: step_2_filled.png');

    // Click Begin assessment
    console.log('Clicking Begin assessment...');
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const beginBtn = btns.find(b => b.textContent.includes('Begin assessment'));
      if (beginBtn) beginBtn.click();
    });
    await delay(3000);

    console.log('Locating iframe...');
    const iframeElement = await page.waitForSelector('iframe');
    const frame = await iframeElement.contentFrame();
    if (!frame) throw new Error('Could not access iframe content frame');

    // Screenshot of assessment start
    await page.screenshot({ path: path.join(artifactDir, 'step_3_assessment_start.png') });
    console.log('Screenshot saved: step_3_assessment_start.png');

    // Loop through assessment sections (1 to 8)
    for (let stepIdx = 1; stepIdx <= 8; stepIdx++) {
      console.log(`Answering questions in Section ${stepIdx}...`);

      // Select fields
      await frame.evaluate(() => {
        const selects = [...document.querySelectorAll('.ai-sel')];
        selects.forEach(sel => {
          if (!sel.value && sel.options.length > 1) {
            sel.value = sel.options[1].value;
            sel.dispatchEvent(new Event('change'));
          }
        });
      });

      // Pills
      await frame.evaluate(() => {
        const groups = [...document.querySelectorAll('.ai-pills')];
        groups.forEach(grp => {
          if (!grp.querySelector('.pill.on')) {
            const pill = grp.querySelector('.pill');
            if (pill) pill.click();
          }
        });
      });

      // Checkboxes
      await frame.evaluate(() => {
        const chks = [...document.querySelectorAll('.ai-chk')];
        chks.forEach(chk => {
          if (!chk.checked) {
            chk.checked = true;
            chk.dispatchEvent(new Event('change'));
          }
        });
      });

      // Text fields
      await frame.evaluate(() => {
        const txts = [...document.querySelectorAll('.ai-txt')];
        txts.forEach(txt => {
          if (!txt.value) {
            txt.value = '1000';
            txt.dispatchEvent(new Event('input'));
          }
        });
      });

      // Take a screenshot of the step
      await page.screenshot({ path: path.join(artifactDir, `assessment_step_${stepIdx}.png`) });

      // Click Next
      console.log(`Clicking Next for Section ${stepIdx}...`);
      await frame.click('#nextBtn');
      await delay(1000);
    }

    // After step 8, clicking Next triggers buildDashboard() which shows a loader
    console.log('Waiting for AI generation/loading screen to finish (12s)...');
    await delay(15000); // Wait for Gemini analysis to generate and render teaser

    // Check paywall visibility
    await page.screenshot({ path: path.join(artifactDir, 'step_4_paywall_visible.png') });
    console.log('Screenshot saved: step_4_paywall_visible.png');

    // Check if the Request Full Report Access button is visible and click it
    console.log('Clicking "Request Full Report Access" button inside iframe...');
    await frame.waitForSelector('#_btn_request_access');
    await frame.click('#_btn_request_access');
    await delay(800);

    // Screenshot of email input box visible
    await page.screenshot({ path: path.join(artifactDir, 'step_5_email_input_visible.png') });
    console.log('Screenshot saved: step_5_email_input_visible.png');

    // Input email and click Send
    console.log('Entering email and unlocking...');
    await frame.waitForSelector('#_unlock_email');
    await frame.type('#_unlock_email', 'unlock-user@test.com');

    // Screenshot before send
    await page.screenshot({ path: path.join(artifactDir, 'step_6_email_entered.png') });

    await frame.click('#_unlock_send');
    console.log('Waiting for report to unlock and render (8s)...');
    await delay(8000);

    // Screenshot of final unlocked detailed report
    await page.screenshot({ path: path.join(artifactDir, 'step_7_detailed_report_unlocked.png') });
    console.log('Screenshot saved: step_7_detailed_report_unlocked.png');

  } catch (err) {
    console.error('Automation script failed:', err);
    // Take failure screenshot
    await page.screenshot({ path: path.join(artifactDir, 'failure_state.png') });
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

run();
