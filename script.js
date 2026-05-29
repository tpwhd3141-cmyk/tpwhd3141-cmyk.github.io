/* ===================================================
   GoldHouse — script.js
   1. 모바일 네비게이션
   2. 헤더 스크롤 효과
   3. 실시간 시세 (metals.live API → 상품 가격 계산용)
   4. 상품 데이터 & 가격 자동 계산
   5. 상품 필터
   6. 차트 탭 전환 (TradingView)
   7. 문의 폼
   ※ 티커는 TradingView 위젯으로 대체
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
    unit: '1oz',
    badges: ['인기 상품', '정품 보증'],
    specs: [
      { key: '중량', val: '1 Troy oz (31.1g)' },
      { key: '순도', val: '99.99% (24K)' },
      { key: '제조사', val: 'PAMP Suisse (스위스)' },
      { key: '포장', val: '개별 케이스 + 정품 인증서' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: 'PAMP Suisse는 세계 최고 권위의 스위스 귀금속 정제소입니다. 포르투나 여신이 새겨진 디자인으로 전 세계 투자자들에게 가장 인정받는 골드바 중 하나입니다. 개별 블리스터 포장과 고유 일련번호가 포함된 정품 인증서가 함께 제공됩니다.'
  },
  {
    id: 2, category: 'gold',
    icon: '🪙',
    tag: 'GOLD · 캐나다 왕립 조폐국',
    name: '메이플리프 금화 1/4oz',
    metalKey: 'XAU', weightOz: 0.25, margin: 1.05,
    unit: '1/4oz',
    badges: ['소액 투자 추천'],
    specs: [
      { key: '중량', val: '1/4 Troy oz (7.78g)' },
      { key: '순도', val: '99.99% (24K)' },
      { key: '제조사', val: '캐나다 왕립 조폐국 (RCM)' },
      { key: '액면가', val: CAD 10 },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '캐나다 왕립 조폐국(RCM)이 발행하는 메이플리프 금화는 세계에서 가장 널리 거래되는 금화 중 하나입니다. 1/4oz 단위로 소액 투자에 적합하며, 높은 유동성과 국제적인 인지도를 자랑합니다.'
  },
  {
    id: 3, category: 'gold',
    icon: '✨',
    tag: 'GOLD · 한국조폐공사',
    name: '대한민국 금화 1/2oz',
    metalKey: 'XAU', weightOz: 0.5, margin: 1.05,
    unit: '1/2oz',
    badges: ['국내 발행', '한정 수량'],
    specs: [
      { key: '중량', val: '1/2 Troy oz (15.55g)' },
      { key: '순도', val: '99.99% (24K)' },
      { key: '제조사', val: '한국조폐공사' },
      { key: '포장', val: '케이스 + 인증서' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '한국조폐공사가 발행하는 공식 대한민국 금화입니다. 국내에서 발행되어 국내 시장에서 높은 신뢰도를 가지며, 한정 수량으로 수집 가치도 있습니다.'
  },
  {
    id: 4, category: 'gold',
    icon: '🥇',
    tag: 'GOLD · 독일 게르마니아 조폐국',
    name: '게르마니아 금화 1oz 2025',
    metalKey: 'XAU', weightOz: 1, margin: 1.045,
    unit: '1oz',
    badges: ['2025 신상', '한정판'],
    specs: [
      { key: '중량', val: '1 Troy oz (31.1g)' },
      { key: '순도', val: '99.99% (24K)' },
      { key: '제조사', val: '게르마니아 조폐국 (독일)' },
      { key: '발행연도', val: '2025' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '독일 게르마니아 조폐국의 2025년 한정 발행 금화입니다. 게르마니아 여신이 새겨진 아름다운 디자인으로 수집가들에게 큰 인기를 얻고 있습니다.'
  },
  {
    id: 5, category: 'silver',
    icon: '🥈',
    tag: 'SILVER · 순은 99.9%',
    name: '아메리칸 이글 은화 1oz',
    metalKey: 'XAG', weightOz: 1, margin: 1.08,
    unit: '1oz',
    badges: ['미국 법정화폐', '최고 인지도'],
    specs: [
      { key: '중량', val: '1 Troy oz (31.1g)' },
      { key: '순도', val: '99.9% (Fine Silver)' },
      { key: '제조사', val: '미국 조폐국 (US Mint)' },
      { key: '액면가', val: 'USD 1' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '미국 조폐국이 발행하는 아메리칸 이글 은화는 전 세계에서 가장 많이 거래되는 은화입니다. 미국 법정화폐로 최고의 유동성을 자랑하며, Walking Liberty 디자인이 인상적입니다.'
  },
  {
    id: 6, category: 'silver',
    icon: '🥈',
    tag: 'SILVER · 호주 퍼스 조폐국',
    name: '쿠쿠버라 은화 1oz 2025',
    metalKey: 'XAG', weightOz: 1, margin: 1.08,
    unit: '1oz',
    badges: ['2025 신상', '매년 디자인 변경'],
    specs: [
      { key: '중량', val: '1 Troy oz (31.1g)' },
      { key: '순도', val: '99.9% (Fine Silver)' },
      { key: '제조사', val: '퍼스 조폐국 (호주)' },
      { key: '발행연도', val: '2025' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '호주 퍼스 조폐국의 쿠쿠버라 은화는 매년 새로운 디자인으로 발행되어 수집가들에게 인기가 높습니다. 2025년 버전은 호주의 상징 쿠쿠버라 새가 새롭게 디자인되었습니다.'
  },
  {
    id: 7, category: 'silver',
    icon: '🥈',
    tag: 'SILVER · 오스트리아 조폐국',
    name: '빈 필하모닉 은화 1oz',
    metalKey: 'XAG', weightOz: 1, margin: 1.07,
    unit: '1oz',
    badges: ['유럽 인기 1위'],
    specs: [
      { key: '중량', val: '1 Troy oz (31.1g)' },
      { key: '순도', val: '99.9% (Fine Silver)' },
      { key: '제조사', val: '오스트리아 조폐국' },
      { key: '액면가', val: '€ 1.50' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '오스트리아 조폐국이 발행하는 빈 필하모닉 은화는 유럽에서 가장 많이 팔리는 은화입니다. 빈 필하모닉 오케스트라의 악기들이 아름답게 새겨져 있습니다.'
  },
  {
    id: 8, category: 'platinum',
    icon: '💎',
    tag: 'PLATINUM · 순백금 99.95%',
    name: '플래티넘 바 10g',
    metalKey: 'XPT', weightOz: 10 / TROY_OZ_TO_G, margin: 1.05,
    unit: '10g',
    badges: ['희소 금속', '산업용 수요'],
    specs: [
      { key: '중량', val: '10g' },
      { key: '순도', val: '99.95% (Platinum)' },
      { key: '형태', val: '바 (Bar)' },
      { key: '포장', val: '개별 케이스 + 인증서' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '백금(플래티넘)은 금보다 희소한 귀금속으로 자동차 촉매, 의료기기 등 산업 수요가 높습니다. 10g 단위로 소액 투자에 적합하며 장기 투자 상품으로 주목받고 있습니다.'
  },
  {
    id: 9, category: 'collectible',
    icon: '🪙',
    tag: 'COLLECTIBLE · 한정판',
    name: '2025 을사년 뱀 기념 금화',
    metalKey: 'XAU', weightOz: 0.5, margin: 1.12,
    unit: '1/2oz',
    badges: ['한정 999개', '수집 가치'],
    specs: [
      { key: '중량', val: '1/2 Troy oz (15.55g)' },
      { key: '순도', val: '99.99% (24K)' },
      { key: '발행연도', val: '2025 (을사년)' },
      { key: '발행 수량', val: '999개 한정' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '2025 을사년(뱀의 해)을 기념하여 한정 발행된 기념 금화입니다. 999개 한정 발행으로 희소성이 높으며, 개별 시리얼 넘버가 부여됩니다. 투자 가치와 수집 가치를 동시에 지닌 특별한 상품입니다.'
  },
  {
    id: 10, category: 'collectible',
    icon: '🏅',
    tag: 'COLLECTIBLE · 한정 1,000개',
    name: '퍼스 민트 드래곤 은화 5oz',
    metalKey: 'XAG', weightOz: 5, margin: 1.15,
    unit: '5oz',
    badges: ['대형 은화', '한정 1,000개'],
    specs: [
      { key: '중량', val: '5 Troy oz (155.5g)' },
      { key: '순도', val: '99.9% (Fine Silver)' },
      { key: '제조사', val: '퍼스 조폐국 (호주)' },
      { key: '발행 수량', val: '1,000개 한정' },
      { key: '배송', val: '보험 포장 발송' },
    ],
    desc: '호주 퍼스 조폐국이 발행한 대형 5oz 드래곤 기념 은화입니다. 세밀한 조각과 큰 크기로 압도적인 존재감을 자랑합니다. 전 세계 1,000개 한정 발행으로 수집 가치가 매우 높습니다.'
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
      <button class="product-btn">상세 보기</button>
    `;
    card.querySelector('.product-btn').addEventListener('click', () => openDetail(p.id));
    card.querySelector('.product-img').addEventListener('click', () => openDetail(p.id));
    card.querySelector('.product-name').addEventListener('click', () => openDetail(p.id));
    card.style.cursor = 'pointer';
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
    // 상세 페이지가 열려있으면 거기도 업데이트
    const detailPrice = document.getElementById('detailPrice');
    const overlay = document.getElementById('detailOverlay');
    if (overlay.classList.contains('open') && overlay.dataset.productId == p.id) {
      detailPrice.textContent = formatKrw(price);
    }
  });
}

/* ===== 상품 상세 페이지 ===== */
function openDetail(productId) {
  const p = PRODUCTS.find(x => x.id === productId);
  if (!p) return;

  const price = calcPrice(p.metalKey, p.weightOz, p.margin);

  // 내용 채우기
  document.getElementById('detailImg').textContent = p.icon;
  document.getElementById('detailTag').textContent = p.tag;
  document.getElementById('detailName').textContent = p.name;
  document.getElementById('detailPrice').textContent = formatKrw(price) || '시세 불러오는 중...';
  document.getElementById('detailDesc').textContent = p.desc || '';

  // 배지
  const badgesEl = document.getElementById('detailBadges');
  badgesEl.innerHTML = (p.badges || []).map(b => `<span class="detail-badge">${b}</span>`).join('');

  // 스펙
  const specsEl = document.getElementById('detailSpecs');
  specsEl.innerHTML = (p.specs || []).map(s =>
    `<div class="detail-spec-row">
      <span class="spec-key">${s.key}</span>
      <span class="spec-val">${s.val}</span>
    </div>`
  ).join('');

  // 오버레이 열기
  const overlay = document.getElementById('detailOverlay');
  overlay.dataset.productId = productId;
  overlay.classList.add('open');
  overlay.scrollTop = 0;
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  const overlay = document.getElementById('detailOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// 닫기 버튼
document.getElementById('detailBack').addEventListener('click', closeDetail);

// 문의 버튼
document.getElementById('detailInquiry').addEventListener('click', () => {
  closeDetail();
  setTimeout(() => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  }, 400);
});

// 공유 버튼
document.getElementById('detailShare').addEventListener('click', () => {
  if (navigator.share) {
    const overlay = document.getElementById('detailOverlay');
    const p = PRODUCTS.find(x => x.id == overlay.dataset.productId);
    navigator.share({ title: p?.name, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다!');
  }
});

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
  updateProductPrices();

  // 5분마다 자동 갱신
  setInterval(async () => {
    await Promise.all([fetchKrwRate(), fetchMetalPrices()]);
    updateProductPrices();
  }, 5 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);
