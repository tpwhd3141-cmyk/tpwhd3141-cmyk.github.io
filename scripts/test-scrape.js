// 1차 테스트용 스크립트: truney.com / wowpass.kr 접속 가능 여부 + 페이지 텍스트 일부 확인
// 목적: headless 브라우저로 접속 시 봇 차단을 우회할 수 있는지, wowpass 환율 숫자가
// 렌더링되는지 확인. 성공하면 이후 정확한 CSS 선택자를 찾아 2차 스크립트로 다듬는다.
const { chromium } = require('playwright');

const TRUNEY_URL = 'https://www.truney.com/en/shop/product/pr-10017-2026-1-oz-canada-maple-leaf-9999-gold-bu-coin-10729';
const WOWPASS_URL = 'https://www.wowpass.kr/exchange-rate';

function extractCurrencyLikeLines(text) {
  // NT$, ₩, 콤마 포함 숫자 등 통화로 보이는 줄만 추출 (전체 덤프는 너무 길어서)
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.length < 80)
    .filter(l => /NT\$|TWD|₩|원|[0-9]{2,3}(,[0-9]{3})+/.test(l));
}

async function testSite(browser, name, url) {
  console.log(`\n===== ${name} 테스트 시작: ${url} =====`);
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`HTTP 상태: ${response ? response.status() : '(no response)'}`);
    await page.waitForTimeout(3000); // 클라이언트 렌더링 대기

    const title = await page.title();
    console.log(`페이지 타이틀: ${title}`);

    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log(`본문 길이: ${bodyText.length}자`);

    // 봇 차단/캡차 의심 키워드 체크
    const blockedKeywords = ['captcha', 'CAPTCHA', 'Access denied', 'blocked', 'Cloudflare', 'Just a moment', 'robot'];
    const suspected = blockedKeywords.filter(k => bodyText.includes(k));
    if (suspected.length) {
      console.log(`⚠️ 차단 의심 키워드 발견: ${suspected.join(', ')}`);
    }

    const currencyLines = extractCurrencyLikeLines(bodyText);
    console.log(`통화로 보이는 텍스트 줄 (최대 15개):`);
    currencyLines.slice(0, 15).forEach(l => console.log(`  - ${l}`));

    // 스크린샷도 남겨서 시각적으로 확인 가능하게
    const shotPath = `scripts/test-output-${name}.png`;
    await page.screenshot({ path: shotPath, fullPage: true });
    console.log(`스크린샷 저장: ${shotPath}`);

    return { name, success: true, status: response ? response.status() : null, suspected };
  } catch (e) {
    console.log(`❌ 실패: ${e.message}`);
    return { name, success: false, error: e.message };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  results.push(await testSite(browser, 'truney', TRUNEY_URL));
  results.push(await testSite(browser, 'wowpass', WOWPASS_URL));
  await browser.close();

  console.log('\n===== 최종 요약 =====');
  console.log(JSON.stringify(results, null, 2));
})();
