/* 소닉슨 WMS — PWA 서비스워커 (셸 캐시)
   · HTML(껍데기 화면) = 네트워크 우선 → 온라인이면 항상 최신 셸, 오프라인이면 캐시 폴백.
     (셸을 고쳐 다시 올리면 다음 접속에 바로 반영되게 하기 위함)
   · 아이콘/manifest = 캐시 우선(빠름).
   · GAS 웹앱(script.google.com) = 교차출처·동적이라 손대지 않고 네트워크 통과.
     오프라인이면 앱은 열리되 GAS 데이터 화면은 "인터넷 필요" 안내가 뜬다(런처 셸 단계 한계). */
const CACHE = 'sonixn-wms-shell-v3';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-512-maskable.png', './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // GAS 등 외부는 기본 네트워크

  const isHTML = e.request.mode === 'navigate' ||
                 url.pathname.endsWith('/') || url.pathname.endsWith('index.html');
  if (isHTML) {
    // 네트워크 우선(최신 셸), 실패 시 캐시
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return r;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    // 정적 자원: 캐시 우선
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
