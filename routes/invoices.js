var express = require('express');
var url = require('url');
var router = express.Router();
const puppeteer = require('puppeteer');

router.get('/:invoice', async function(req, res, next) {
    
    const invoice = req.params.invoice;
    console.log(invoice);
    const browser = await puppeteer.launch({
        args: [
            // Required for Docker version of Puppeteer
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // This will write shared memory files into /tmp instead of /dev/shm,
            // because Docker’s default for /dev/shm is 64MB
            '--disable-dev-shm-usage'
          ]
    });
    let pages = await browser.pages();
    const page = await browser.newPage();
    browser.on('targetcreated', async () => {
        try {
            console.log('New Tab Created');
            let uri;
            pages = await browser.pages();
            console.log('pages', pages.length);
            pages.forEach(page => {
                console.log(page.url());
            })
            const paypalWindow = pages[pages.length - 1];
            // await paypalWindow.waitForTimeout(3000);
            const cnt = await paypalWindow.content();
            uri = paypalWindow.url();
            await paypalWindow.waitForSelector('.button.secondary', {timeout: 1000 * 60});
            await paypalWindow.click('.button.secondary');
            // await paypalWindow.waitForTimeout(3000);
            // await paypalWindow.waitForSelector('#countrySelector', {timeout: 1000 * 60});
            // await paypalWindow.select('#countrySelector', 'CA');
            // await paypalWindow.waitForTimeout(3000);
            uri = paypalWindow.url();
            console.log(uri);
            const parsedUrl = url.parse(uri, true);
            const finalUri = `https://www.paypal.com/webapps/xoonboarding?token=${parsedUrl.query.token}&useraction=commit&country.x=CA&locale.x=en_US#/checkout/guest`;
            res.redirect(finalUri);
        } catch (e) {
            res.json({error: e.message});
        }
        await browser.close();
        
    })
    try {
        await page.goto('https://www.paypal.com/invoice/payerView/details/'+invoice);
        await page.waitForSelector('#payInvoiceInPopup');
        await page.click('#payInvoiceInPopup');
    } catch (e) {
        res.json({error: e});
    }
    
    
});

module.exports = router;