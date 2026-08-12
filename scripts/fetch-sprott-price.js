// Sprott Money(북미, USD) 2026 1oz 캐나다 메이플리프 판매가를 가져와서,
// fawazahmed0/currency-api로 USD→KRW 환율을 곱한 원화 환산가를 계산해
// data/sprott-compare.json에 저장한다.
// 봇 차단 없이 단순 fetch로 접근 가능함을 확인했으므로 headless 브라우저 불필요.

const SPROTT_URL = 'https://www.sprottmoney.com/2026-1-oz-gold-maple-leaf-coin-royal-canadian-mint';
// fawazahmed0/currency-api: 키 불필요, CORS 오픈, jsDelivr CDN 서빙, 매일 갱신
const RATE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
const RATE_URL_FALLBACK = 'https://latest.currency-api.pages.dev/v1/currencies/usd.json';

async function fetchSprottPriceUsd() {
  const res = await fetch(SPROTT_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });
  if (!res.ok) throw new Error(`Sprott Money 페이지 응답 오류 (${res.status})`);
  const html = await res.text();

  // og:price 계열 메타태그에서 가격 파싱 (가장 안정적인 구조화 데이터)
  const priceMatch = html.match(/property="product:price:amount"\s+content="([\d.]+)"/)
    || html.match(/name="product:price:amount"\s+content="([\d.]+)"/);
  const currencyMatch = html.match(/property="product:price:currency"\s+content="([A-Z]+)"/)
    || html.match(/name="product:price:currency"\s+content="([A-Z]+)"/);

  if (!priceMatch) throw new Error('Sprott Money 페이지에서 가격 메타태그를 찾지 못함 (페이지 구조 변경 가능성)');

  const priceUsd = parseFloat(priceMatch[1]);
  const currency = currencyMatch ? currencyMatch[1] : 'USD';
  if (currency !== 'USD') throw new Error(`예상치 못한 통화 단위: ${currency}`);

  return priceUsd;
}

async function fetchUsdToKrwRate() {
  let res;
  try {
    res = await fetch(RATE_URL);
    if (!res.ok) throw new Error(`primary status ${res.status}`);
  } catch (e) {
    console.log(`기본 환율 API 실패(${e.message}), fallback 시도`);
    res = await fetch(RATE_URL_FALLBACK);
  }
  if (!res.ok) throw new Error(`환율 API 응답 오류 (${res.status})`);
  const json = await res.json();
  const krw = json.usd?.krw;
  if (!krw) throw new Error('환율 응답에서 KRW 값을 찾지 못함');
  return krw;
}

(async () => {
  const result = {
    generatedAt: new Date().toISOString(),
    source: {
      price: SPROTT_URL,
      rate: 'fawazahmed0/currency-api (USD base)',
    },
    success: false,
  };

  try {
    const priceUsd = await fetchSprottPriceUsd();
    const usdToKrw = await fetchUsdToKrwRate();
    const priceKrw = Math.round(priceUsd * usdToKrw);

    result.success = true;
    result.priceUsd = priceUsd;
    result.usdToKrw = usdToKrw;
    result.priceKrw = priceKrw;

    console.log(`✅ Sprott Money 가격: $${priceUsd} USD`);
    console.log(`✅ USD→KRW 환율: ${usdToKrw}`);
    console.log(`✅ 원화 환산가: ₩${priceKrw.toLocaleString()}`);
  } catch (e) {
    result.error = e.message;
    console.error(`❌ 실패: ${e.message}`);
  }

  const fs = require('fs');
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/sprott-compare.json', JSON.stringify(result, null, 2));
  console.log('\n결과 저장: data/sprott-compare.json');

  if (!result.success) process.exit(1);
})();
