/* ===================================================
   GoldHouse — script.js
   1. 모바일 네비게이션
   2. 헤더 스크롤 효과
   3. 실시간 시세 (metals.live 무료 API)
   4. 상품 데이터 & 가격 자동 계산
   5. 상품 필터
   6. 차트 탭 전환 (TradingView)
   7. 문의 폼
=================================================== */

/* ===== 1. 모바일 네비게이션 ===== */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const navOverlay = document.getElementById('navOverlay');

function openNav() {
  hamburger.classList.add('open');
  nav.classList.add('open');
  navOverlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeNav() {
  hamburger.classList.remove('open');
  nav.classList.remove('open');
  navOverlay.classList.remove('show');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  nav.classList.contains('open') ? closeNav() : openNav();
});
navOverlay.addEventListener('click', closeNav);
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

/* ===== 2. 헤더 스크롤 효과 ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.style.borderBottomColor = window.scrollY > 40 ? '#2a2518' : 'transparent';
});

/* ===== 3. 실시간 시세 ===== */
// 시세 데이터 저장소 (KRW 환산)
let prices = { XAU: null, XAG: null, XPT: null, XPD: null };
let krwRate = 1380; // 기본 환율 (USD/KRW)

// 환율 가져오기
async function fetchKrwRate() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=KRW');
    const data = await res.json();
    if (data.rates && data.rates.KRW) {
      krwRate = data.rates.KRW;
    }
  } catch (e) {
    console.warn('환율 API 실패, 기본값 사용:', krwRate);
  }
}

// 금속 시세 가져오기 (metals.live — 무료, API 키 불필요)
async function fetchMetalPrices() {
  try {
    const res = await fetch('https://metals.live/api/spot');
    const data = await res.json();
    // metals.live는 troy oz 단위 USD 반환
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.gold !== undefined) prices.XAU = item.gold;
        if (item.silver !== undefined) prices.XAG = item.silver;
        if (item.platinum !== undefined) prices.XPT = item.platinum;
        if (item.palladium !== undefined) prices.XPD = item.palladium;
      });
    }
  } catch (e) {
    // 폴백: 정적 기본값 (실제 운영 시 다른 API로 교체 권장)
    console.warn('metals.live API 실패, 기본값 사용');
    prices.XAU = prices.XAU || 3250;
    prices.XAG = prices.XAG || 32.5;
    prices.XPT = prices.XPT || 980;
    prices.XPD = prices.XPD || 960;
  }
}

// 가격 계산 헬퍼
const TROY_OZ_TO_G = 31.1035;

function calcPrice(metalKey, weightOz, margin = 1.03) {
  const usdPerOz = prices[metalKey];
  if (!usdPerOz) return null;
  return Math.round(usdPerOz * weightOz * margin * krwRate);
}

function formatKrw(won) {
  if (!won) return '시세 불러오는 중...';
  return '₩' + won.toLocaleString('ko-KR');
}

/* ===== 4. 상품 데이터 ===== */
// margin: 마진율 (1.03 = 3% 마진)
// weightOz: 중량(troy oz 기준)
// metalKey: XAU(금) / XAG(은) / XPT(백금) / XPD(팔라듐)
const PRODUCTS = [
  {
    id: 1, category: 'gold',
    icon: '🥇',
    tag: 'GOLD · 순금 99.99%',
    name: 'PAMP 스위스 골드바 1oz',
    metalKey: 'XAU', weightOz: 1, margin: 1.04,
    unit: '1oz'
  },
  {
    id: 2, category: 'gold',
    icon: '🪙',
    tag: 'GOLD · 캐나다 왕립 조폐국',
    name: '메이플리프 금화 1/4oz',
    metalKey: 'XAU', weightOz: 0.25, margin: 1.05,
    unit: '1/4oz'
  },
  {
    id: 3, category: 'gold',
    icon: '✨',
    tag: 'GOLD · 한국조폐공사',
    name: '대한민국 금화 1/2oz',
    metalKey: 'XAU', weightOz: 0.5, margin: 1.05,
    unit: '1/2oz'
  },
  {
    id: 4, category: 'gold',
    icon: '🥇',
    tag: 'GOLD · 독일 게르마니아 조폐국',
    name: '게르마니아 금화 1oz 2025',
    metalKey: 'XAU', weightOz: 1, margin: 1.045,
    unit: '1oz'
  },
  {
    id: 5, category: 'silver',
    icon: '🥈',
    tag: 'SILVER · 순은 99.9%',
    name: '아메리칸 이글 은화 1oz',
    metalKey: 'XAG', weightOz: 1, margin: 1.08,
    unit: '1oz'
  },
  {
    id: 6, category: 'silver',
    icon: '🥈',
    tag: 'SILVER · 호주 퍼스 조폐국',
    name: '쿠쿠버라 은화 1oz 2025',
    metalKey: 'XAG', weightOz: 1, margin: 1.08,
    unit: '1oz'
  },
  {
    id: 7, category: 'silver',
    icon: '🥈',
    tag: 'SILVER · 오스트리아 조폐국',
    name: '빈 필하모닉 은화 1oz',
    metalKey: 'XAG', weightOz: 1, margin: 1.07,
    unit: '1oz'
  },
  {
    id: 8, category: 'platinum',
    icon: '💎',
    tag: 'PLATINUM · 순백금 99.95%',
    name: '플래티넘 바 10g',
    metalKey: 'XPT', weightOz: 10 / TROY_OZ_TO_G, margin: 1.05,
    unit: '10g'
  },
  {
    id: 9, category: 'collectible',
    icon: '🪙',
    tag: 'COLLECTIBLE · 한정판',
    name: '2025 을사년 뱀 기념 금화',
    metalKey: 'XAU', weightOz: 0.5, margin: 1.12,
    unit: '1/2oz'
  },
  {
    id: 10, category: 'collectible',
    icon: '🏅',
    tag: 'COLLECTIBLE · 한정 1,000개',
    name: '퍼스 민트 드래곤 은화 5oz',
    metalKey: 'XAG', weightOz: 5, margin: 1.15,
    unit: '5oz'
  },
];

function renderProducts(filter = 'all') {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  const filtered = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);

  filtered.forEach(p => {
    const price = calcPrice(p.metalKey, p.weightOz, p.margin);
    const priceHtml = price
      ? `${formatKrw(price)} <small>/ ${p.unit}</small>`
      : `<span class="loading">시세 불러오는 중...</span>`;

    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="product-img">${p.icon}</div>
      <div class="product-info">
        <span class="product-tag">${p.tag}</span>
        <div class="product-name">${p.name}</div>
        <div class="product-price" data-id="${p.id}">${priceHtml}</div>
      </div>
      <button class="product-btn">상세 문의</button>
    `;
    card.querySelector('.product-btn').addEventListener('click', () => {
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });
    grid.appendChild(card);
  });
}

function updateProductPrices() {
  PRODUCTS.forEach(p => {
    const el = document.querySelector(`.product-price[data-id="${p.id}"]`);
    if (!el) return;
    const price = calcPrice(p.metalKey, p.weightOz, p.margin);
    if (price) {
      el.innerHTML = `${formatKrw(price)} <small>/ ${p.unit}</small>`;
    }
  });
}

/* ===== 티커 렌더링 ===== */
function renderTicker() {
  const track = document.getElementById('tickerTrack');
  if (!prices.XAU) return;

  const items = [
    { name: '금 (1g)', usd: prices.XAU / TROY_OZ_TO_G, key: 'XAU_g' },
    { name: '금 (1oz)', usd: prices.XAU, key: 'XAU_oz' },
    { name: '은 (1g)', usd: prices.XAG / TROY_OZ_TO_G, key: 'XAG_g' },
    { name: '은 (1oz)', usd: prices.XAG, key: 'XAG_oz' },
    { name: '백금 (1g)', usd: prices.XPT / TROY_OZ_TO_G, key: 'XPT_g' },
    { name: '팔라듐 (1g)', usd: prices.XPD / TROY_OZ_TO_G, key: 'XPD_g' },
  ];

  // 무한 스크롤을 위해 2번 반복
  const makeItems = () => items.map(item => {
    const krw = Math.round(item.usd * krwRate);
    // 가격 변동은 실제 API에서 제공하지 않으므로 표시 생략 또는 정적 표기
    return `
      <span class="tick-item">
        <span class="name">${item.name}</span>
        <span class="price">${formatKrw(krw)}</span>
      </span>
      <span class="tick-sep">·</span>
    `;
  }).join('');

  track.innerHTML = makeItems() + makeItems();
}

/* ===== 5. 상품 필터 ===== */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(btn.dataset.filter);
  });
});

// 카테고리 카드 클릭 → 필터 적용
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    const filter = card.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
    renderProducts(filter);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
});

/* ===== 6. 차트 탭 전환 ===== */
document.querySelectorAll('.chart-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (typeof loadChart === 'function') {
      loadChart(tab.dataset.symbol);
    }
  });
});

/* ===== 7. 문의 폼 ===== */
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = '전송 완료! ✓';
  btn.style.background = '#6abf69';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '문의 보내기';
    btn.style.background = '';
    btn.disabled = false;
    e.target.reset();
  }, 3000);
});

/* ===== 초기화 ===== */
async function init() {
  // 상품 먼저 로딩 표시
  renderProducts('all');

  // 시세 가져오기
  await Promise.all([fetchKrwRate(), fetchMetalPrices()]);

  // 시세 반영
  renderTicker();
  updateProductPrices();

  // 5분마다 자동 갱신
  setInterval(async () => {
    await Promise.all([fetchKrwRate(), fetchMetalPrices()]);
    renderTicker();
    updateProductPrices();
  }, 5 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);
