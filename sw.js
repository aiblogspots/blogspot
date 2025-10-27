const CACHE_NAME = 'blogai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/metadata.json',
  '/App.tsx',
  '/types.ts',
  '/icon.svg',
  '/services/geminiService.ts',
  '/components/ImageUploader.tsx',
  '/components/PostDisplay.tsx',
  '/components/Loader.tsx',
  '/components/Icons.tsx',
  '/components/TimerModal.tsx',
  '/components/Logo.tsx',
  '/components/SourcesModal.tsx',
  '/components/EditPostModal.tsx',
  '/components/ModeSwitcher.tsx',
  '/components/SourceCodeModal.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
