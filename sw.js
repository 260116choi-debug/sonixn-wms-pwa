/* 소닉슨 WMS — PWA 서비스워커 (셸 캐시)
   역할: 앱 껍데기(index/아이콘/manifest)를 폰에 캐시 → 오프라인에도 "앱 자체"는 열림.
   ※ GAS 웹앱(script.google.com) 은 교차출처·동적이라 캐시하지 않고 그냥 네트워크로 통과.
      즉 오프라인이면 앱은 열리되 GAS 데이터 화면은 "인터넷 필요" 안내가 뜬다(런처 셸 단계의 한계). */
const CACHE = 'sonixn-wms-shell-v1';
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
  // 같은 출처(우리 셸)만 캐시 우선. 그 외(GAS 등)는 손대지 않고 네트워크로.
  if (url.origin === self.location.origin) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
  }
});
