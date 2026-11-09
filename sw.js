(() => {
  const CACHE = "cuberplus-dc153d054859f03f";
  const PRECACHE = ["/index.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/favicon.ico","/smartcubeanalyzer/theme-init.js","/smartcubeanalyzer/react-data-grid.css","/assets/AcubemyCsv-CMfcmPFt.png","/assets/analyzer-data-CmG5uDk6.js","/assets/analyzer-replay-DvD55JUl.js","/assets/AnalyzerSteps-2Zoh-Pxb.png","/assets/App-CDGYUIKv.js","/assets/App-CISQsj8K.css","/assets/App-CRfz_lRi.js","/assets/App-DGsqMfrp.js","/assets/App-GfXnifhN.css","/assets/auth-efGW1_fz.js","/assets/big-puzzle-orientation-ADWIOX6S-Bwoi1_ZV.js","/assets/big-puzzle-orientation-ADWIOX6S-M92kRirE.js","/assets/CacheKeys-C258EyQi.js","/assets/CaseImage-D0CwWsrs.js","/assets/caseImages-CrmDxHmK.js","/assets/CaseModal-DElArNT2.js","/assets/cfop-Ble3Q0hH.js","/assets/chartWorker-DZYoxTEm.js","/assets/chunk-7LXHWXCO-BUdpEG0K.js","/assets/chunk-7LXHWXCO-CKhpIYes.js","/assets/chunk-UEUJSZTX-BeuSS03m.js","/assets/csvImport-BstCgHB1.js","/assets/cube-BdGMef3T.js","/assets/CubeastCsv-BjqOuVrG.png","/assets/CubeastDownload-C48mqkPY.png","/assets/cubing-core-CIxi9GK6.js","/assets/Database-CQvRCl7b.js","/assets/Database-CzPzwu-W.css","/assets/Database-Y9BKHidS.png","/assets/dataClient-BIdH6HY5.js","/assets/dataWorker-BRK96gWs.js","/assets/DiscoverAlgorithms-BQnpZFD9.css","/assets/DiscoverAlgorithms-BR2zFkB9.js","/assets/f2l-B3Ty3b52.js","/assets/favoriteAlgorithms-q0c7kANU.js","/assets/favorites-C1973OeC.js","/assets/Home-C9Ly5fnQ.js","/assets/Home-D3sBm95I.css","/assets/index-BL1CTlIA.js","/assets/index-C_xrMGl9.js","/assets/index-Oozf9bYC.js","/assets/inside-JAJOK2MI-BnOfKTTh.js","/assets/inside-JAJOK2MI-CNBtwDU5.js","/assets/main-BVcrw-Br.css","/assets/main-OaBi-TZ2.js","/assets/MistakeAnalysis-CJq5Y8am.js","/assets/Options-VNfjNB6h.js","/assets/preload-helper-bFjQlsqE.js","/assets/puzzle-CQfxYkZp.js","/assets/puzzles-dynamic-3x3x3-FYXD7SIU-BAAKgtmM.js","/assets/puzzles-dynamic-4x4x4-AIGABOAR-Cr8v4tqZ.js","/assets/puzzles-dynamic-megaminx-2LVHIDL4-Cm8jQJ-N.js","/assets/puzzles-dynamic-side-events-IMYJ533P-DK91LDw7.js","/assets/puzzles-dynamic-side-events-IMYJ533P-uM0XY_nj.js","/assets/puzzles-dynamic-unofficial-P3TW433I-cOWAxRTA.js","/assets/puzzles-dynamic-unofficial-P3TW433I-Qmz-kdAk.js","/assets/Replay-mXegNzdg.js","/assets/Replay-XSh6Yxtz.css","/assets/Scrambler-YkJVfnMw.png","/assets/search-dynamic-sgs-side-events-WORUZVF5-C77SuSGZ.js","/assets/search-dynamic-sgs-side-events-WORUZVF5-DvXXyMwh.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-OtcRROxL.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-uSjj-rc2.js","/assets/search-dynamic-solve-3x3x3-B2L4IN34-uMfhr9Ka.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-B95fvbOS.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-l-98cmwl.js","/assets/search-dynamic-solve-fto-I5ID5LXD-D5Ks892-.js","/assets/search-dynamic-solve-fto-I5ID5LXD-D9hZgoUa.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-B4mEKWqA.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-DcK1bE6-.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-BrzVblnz.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-v-kPbnq9.js","/assets/search-worker-entry-C5ojn3m9.js","/assets/search-worker-entry-ggHwsg3J.js","/assets/SmartcubeAnalyzer-C55jalzc.png","/assets/solver.worker-CyT3tydY.js","/assets/storage-B4kGT3H8.js","/assets/Timer-riFFTkt6.png","/assets/twips-ZNMKGC5U-BXU1AVmg.js","/assets/twips-ZNMKGC5U-fb0M_g6e.js","/assets/twips_wasm_bg-TJNYGA2C-AP2O4LGG-SK8YhHEb.js","/assets/twisty-dynamic-3d-4BEQ76PB-DbywGTAu.js"];
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
