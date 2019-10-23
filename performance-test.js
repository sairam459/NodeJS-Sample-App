global.URL = require('url').URL;
const lighthouse = require('lighthouse');
const config = require('lighthouse/lighthouse-core/config/lr-desktop-config.js');
const puppeteer = require('puppeteer');
const reportGenerator = require('lighthouse/lighthouse-core/report/report-generator');
const {URL} = require('url');
const fs= require('fs');
const getBaseURL=(environment)=>{
    switch(environment){
        case 'dev':
            return "https://orangescape.dev.zingworks.com/";
        case 'tst':
            return "https://orangescape.dev.zingworks.com/";
        case 'stg':
            return "https://orangescape.dev.zingworks.com/";
        default:
            return "https://orangescape.dev.zingworks.com/"    
    }
    
}

(async()=>{
    const loginURL = `${getBaseURL(process.env.cluster)}view/login`;
    const opts = {
        chromeFlags: ['--headless','--ignore-certificate-errors','--disable-gpu','--disable-mobile-emulation'],
        logLevel: 'info',
        output: 'json',
        disableDeviceEmulation: true,
        defaultViewport: {
            width: 1200,
            height: 900
        },
    };
    
    const browser = await puppeteer.launch({headless:true,ignoreHTTPSErrors: true,args: ['--no-sandbox', '--disable-setuid-sandbox']})
    const page = (await browser.pages())[0];
    await page.setViewport({ width: 1200, height: 900});
    await page.goto(loginURL, {waitUntil: 'networkidle2'});
    await page.type('[name="username"]', 'sairam.charan@orangescape.com');
    await page.type('[name="password"]', 'Welcome@01');
    await page.evaluate(() => {
        document.querySelector('[name="signIn"]').click();
    });
    const report = await lighthouse(`${getBaseURL(process.env.cluster)}view/home`, {...opts,port:(new URL(browser.wsEndpoint())).port}, config).then(results => {
        return results;
    });
    const result = reportGenerator.generateReport(report.lhr, 'json');
    const json= JSON.parse(result);
    // const html = reportGenerator.generateReport(report.lhr, 'html');
    const html=`<h1>Performance: </h1><h2>${json.categories.performance.score*100}%</h2><br>
    <h1>Accessibility: </h1><h2>${json.categories.accessibility.score*100}%</h2><br>
    <h1>Best practices: </h1><h2>${json.categories['best-practices'].score*100}%</h2><br>
    <h1>PWA Score: </h1><h2>${json.categories.pwa.score*100}%</h2>`
    await browser.disconnect();
    
    
    // if(json.categories.performance.score<0.6){
    //     // process.env.PERFORMANCE_RESULT=false;
    // } else{
    //     // process.env.PERFORMANCE_RESULT=true;
    // }
    // browser.close();
    // console.log(`from node before setting ${process.env.ui_performance_result}`);
    // console.log(`***Performance of the Application -- ${json.categories.performance.score*100}%****`)
    // process.env['ui_performance_result']=`${json.categories.performance.score*100}%`
    // shell.env["ui_performance_result"] = `${json.categories.performance.score*100}%`;
    // shell.exec(`export $ui_performance_result="${json.categories.performance.score*100}%"`)
    // console.log(`from node after setting ${process.env.ui_performance_result}`);


    fs.writeFile('ui_report.html', html, (err) => {
        if (err) {
            console.error(err);
        }
    });

    fs.writeFile('ui_report.json', JSON.stringify(json,undefined,2), (err) => {
        browser.close();
        if (err) {
            console.error(err);
        }
    });
   
})();





