(() => {
  const CACHE = "cuberplus-932a3944859d2178";
  const PRECACHE = ["/index.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/favicon.ico","/smartcubeanalyzer/theme-init.js","/smartcubeanalyzer/react-data-grid.css","/assets/AcubemyCsv-CMfcmPFt.png","/assets/analyzer-data-CyW5v0Qx.js","/assets/analyzer-replay-BCmZ8sUL.js","/assets/AnalyzerSteps-2Zoh-Pxb.png","/assets/App-CQiSFuJ3.js","/assets/App-CSs4LdgA.js","/assets/App-CsvPxobY.js","/assets/App-CZQsvo-o.css","/assets/App-D3sBm95I.css","/assets/App-DG3vZinf.js","/assets/App-DyXqB4uq.css","/assets/auth-efGW1_fz.js","/assets/big-puzzle-orientation-ADWIOX6S-Bwoi1_ZV.js","/assets/CacheKeys-C258EyQi.js","/assets/caseImages-CLyiKrS4.js","/assets/cfop-B8xmiQ66.js","/assets/chartWorker-ow1bVffT.js","/assets/chunk-7LXHWXCO-CKhpIYes.js","/assets/chunk-UEUJSZTX-BeuSS03m.js","/assets/cube-DH6ap3v4.js","/assets/CubeastCsv-BjqOuVrG.png","/assets/CubeastDownload-C48mqkPY.png","/assets/cubing-core-CIxi9GK6.js","/assets/Database-CzPzwu-W.css","/assets/Database-DDmEok-u.js","/assets/Database-XbQvWG6h.png","/assets/DiscoverAlgorithms-BQnpZFD9.css","/assets/DiscoverAlgorithms-DPwmsa4S.js","/assets/f2l-C2QhQ-QS.js","/assets/favoriteAlgorithms-Yb58-tbj.js","/assets/index-BL1CTlIA.js","/assets/index-Oozf9bYC.js","/assets/inside-JAJOK2MI-CNBtwDU5.js","/assets/main-BdhXpoQ7.css","/assets/main-DMGtMmXZ.js","/assets/MistakeAnalysis-BQejcu3K.js","/assets/Options-Cag36WWv.js","/assets/preload-helper-bFjQlsqE.js","/assets/puzzle-0PkpgyeK.js","/assets/puzzles-dynamic-3x3x3-FYXD7SIU-BAAKgtmM.js","/assets/puzzles-dynamic-4x4x4-AIGABOAR-Cr8v4tqZ.js","/assets/puzzles-dynamic-megaminx-2LVHIDL4-Cm8jQJ-N.js","/assets/puzzles-dynamic-side-events-IMYJ533P-uM0XY_nj.js","/assets/puzzles-dynamic-unofficial-P3TW433I-cOWAxRTA.js","/assets/Replay-99SWjEUh.js","/assets/Replay-BgHH8wsZ.css","/assets/Scrambler-Bm7vjutl.png","/assets/search-dynamic-sgs-side-events-WORUZVF5-DvXXyMwh.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-OtcRROxL.js","/assets/search-dynamic-solve-3x3x3-B2L4IN34-uMfhr9Ka.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-l-98cmwl.js","/assets/search-dynamic-solve-fto-I5ID5LXD-D9hZgoUa.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-B4mEKWqA.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-v-kPbnq9.js","/assets/search-worker-entry-ggHwsg3J.js","/assets/SmartcubeAnalyzer-Dv1-qz8H.png","/assets/solver.worker-Dcd9M3uR.js","/assets/storage-BxUgihp-.js","/assets/streaks-BnxG_xyi.js","/assets/Timer-BTBuJ6P0.png","/assets/twips-ZNMKGC5U-fb0M_g6e.js","/assets/twips_wasm_bg-TJNYGA2C-AP2O4LGG-SK8YhHEb.js","/assets/twisty-dynamic-3d-4BEQ76PB-J0GMu0Gv.js"];
  const page = /^\/(?:(?:timer|smartcubeanalyzer|scrambler|database|options)\/?)?(?:index\.html)?$/;
  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      if ((await self.clients.matchAll({ includeUncontrolled: true })).length <= 1) {
        await Promise.all((await caches.keys()).filter((key) => key.startsWith("cuberplus-") && key !== CACHE).map((key) => caches.delete(key)));
      }
      await self.clients.claim();
    })());
  });
  self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING") void self.skipWaiting();
  });
  self.addEventListener("fetch", (event) => {
    const request = event.request, url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin || request.headers.has("range")) return;
    if (request.mode === "navigate" && page.test(url.pathname)) {
      event.respondWith(fetch(request).catch(async () => await (await caches.open(CACHE)).match("/index.html") ?? Response.error()));
    } else if (/\.(?:js|css|wasm|png|jpe?g|gif|svg|ico|webmanifest)$/.test(url.pathname)) {
      event.respondWith(caches.open(CACHE).then(async (cache) => await cache.match(request, { ignoreVary: true }) ?? await caches.match(request, { ignoreVary: true }) ?? fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(cache.put(request, copy).catch(() => {
          }));
        }
        return response;
      })));
    }
  });
})();
