import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(10000);
 await page.goto('http://127.0.0.1:5193/');
 await page.evaluate(async()=>{const preview=await import('/docs/audits/2026-09-12-capture/pit-menu-preview.tsx');preview.mount()});
 const options=page.getByRole('combobox',{name:'Agree what happens to the captive'}).locator('option');
 await expect(options).toHaveText(['Release — return without payment','Ransom — pay for their return']);
 await expect(page.getByText('Free the Slaves!: Pit Fighters never sell captured opponents to slavers.',{exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Agree what happens to the captive'}).selectOption('ransom');
 await expect(page.getByRole('button',{name:'Propose outcome'})).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 console.log('PASS: actual shared captive form on mobile offers release/ransom, explains Pit Fighter no-sale rule, and preserves ransom validation.');
}finally{await browser.close()}
