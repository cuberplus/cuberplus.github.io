(() => {
  const CACHE = "cuberplus-c1742e7c9f5dc7b1";
  const PRECACHE = ["/index.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/favicon.ico","/smartcubeanalyzer/theme-init.js","/smartcubeanalyzer/react-data-grid.css","/assets/AcubemyCsv-CMfcmPFt.png","/assets/algorithmMatching-C7A6BAmr.js","/assets/analyzer-data-BEyLqF49.js","/assets/analyzer-replay-BJ7YcewD.js","/assets/AnalyzerSteps-2Zoh-Pxb.png","/assets/App-07DechG1.js","/assets/App-B0jGq3A6.js","/assets/App-BDtKqCfO.js","/assets/App-CISQsj8K.css","/assets/App-D3sBm95I.css","/assets/App-DfkhBeF6.js","/assets/App-fZ1cehT7.css","/assets/auth-efGW1_fz.js","/assets/big-puzzle-orientation-ADWIOX6S-Bwoi1_ZV.js","/assets/CacheKeys-C258EyQi.js","/assets/caseImages-CSaaEXvJ.js","/assets/chartWorker-BsmxQEqY.js","/assets/chunk-7LXHWXCO-CKhpIYes.js","/assets/chunk-UEUJSZTX-BeuSS03m.js","/assets/CsvParser-Cb3uMD94.js","/assets/cube-BdGMef3T.js","/assets/CubeastCsv-BjqOuVrG.png","/assets/CubeastDownload-C48mqkPY.png","/assets/cubing-core-CIxi9GK6.js","/assets/Database-Cbiqp-bS.js","/assets/Database-CzPzwu-W.css","/assets/Database-Y9BKHidS.png","/assets/DiscoverAlgorithms-BQnpZFD9.css","/assets/DiscoverAlgorithms-zPN4x9RW.js","/assets/f2l-B2ItKnj_.js","/assets/favoriteAlgorithms-CC7z4Pfv.js","/assets/index-BL1CTlIA.js","/assets/index-Oozf9bYC.js","/assets/inside-JAJOK2MI-CNBtwDU5.js","/assets/main-Ck5o6K0Y.css","/assets/main-xu7ODFyg.js","/assets/MistakeAnalysis-DiA_IbPT.js","/assets/Options-CmALAey9.js","/assets/preload-helper-bFjQlsqE.js","/assets/puzzle-CJOlooja.js","/assets/puzzles-dynamic-3x3x3-FYXD7SIU-BAAKgtmM.js","/assets/puzzles-dynamic-4x4x4-AIGABOAR-Cr8v4tqZ.js","/assets/puzzles-dynamic-megaminx-2LVHIDL4-Cm8jQJ-N.js","/assets/puzzles-dynamic-side-events-IMYJ533P-uM0XY_nj.js","/assets/puzzles-dynamic-unofficial-P3TW433I-cOWAxRTA.js","/assets/Replay-XSh6Yxtz.css","/assets/Replay-xy33lQDY.js","/assets/Scrambler-YkJVfnMw.png","/assets/search-dynamic-sgs-side-events-WORUZVF5-DvXXyMwh.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-OtcRROxL.js","/assets/search-dynamic-solve-3x3x3-B2L4IN34-uMfhr9Ka.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-l-98cmwl.js","/assets/search-dynamic-solve-fto-I5ID5LXD-D9hZgoUa.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-B4mEKWqA.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-v-kPbnq9.js","/assets/search-worker-entry-ggHwsg3J.js","/assets/SmartcubeAnalyzer-Dq2aoPbC.png","/assets/solver.worker-CyT3tydY.js","/assets/storage-DQPQgtry.js","/assets/Timer-ohdVQgwM.png","/assets/twips-ZNMKGC5U-fb0M_g6e.js","/assets/twips_wasm_bg-TJNYGA2C-AP2O4LGG-SK8YhHEb.js","/assets/twisty-dynamic-3d-4BEQ76PB-Df1MGeX2.js"];
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
