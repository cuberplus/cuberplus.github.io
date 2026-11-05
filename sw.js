(() => {
  const CACHE = "cuberplus-efe9c110680471d5";
  const PRECACHE = ["/index.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/favicon.ico","/smartcubeanalyzer/theme-init.js","/smartcubeanalyzer/react-data-grid.css","/assets/AcubemyCsv-CMfcmPFt.png","/assets/analyzer-data-BM0e3KK6.js","/assets/analyzer-replay-DHbZI8tI.js","/assets/AnalyzerSteps-2Zoh-Pxb.png","/assets/App--J74hNPC.js","/assets/App-Bdwpu1di.js","/assets/App-BuvqqElk.js","/assets/App-CZQsvo-o.css","/assets/App-D3sBm95I.css","/assets/App-DcyMMrEv.js","/assets/App-DgGYU6Vm.css","/assets/big-puzzle-orientation-ADWIOX6S-BEf8xKNJ.js","/assets/chartWorker-ABT6XagO.js","/assets/chunk-7LXHWXCO-BbeEqPN2.js","/assets/chunk-UEUJSZTX-CfQkmGpb.js","/assets/cube-DoBmB9j7.js","/assets/CubeastCsv-BjqOuVrG.png","/assets/CubeastDownload-C48mqkPY.png","/assets/cubing-core-BlVCN5VW.js","/assets/index-BdhXpoQ7.css","/assets/index-C5LDRMrh.js","/assets/index-CW5GorPG.js","/assets/inside-JAJOK2MI-CJwAbITI.js","/assets/MistakeAnalysis-5ZYe3Jmh.js","/assets/Options-oEP3V670.js","/assets/puzzles-dynamic-3x3x3-FYXD7SIU-BAAKgtmM.js","/assets/puzzles-dynamic-4x4x4-AIGABOAR-Cr8v4tqZ.js","/assets/puzzles-dynamic-megaminx-2LVHIDL4-Cm8jQJ-N.js","/assets/puzzles-dynamic-side-events-IMYJ533P-uM0XY_nj.js","/assets/puzzles-dynamic-unofficial-P3TW433I-cOWAxRTA.js","/assets/Replay-BgHH8wsZ.css","/assets/Replay-DY9Vzbcf.js","/assets/Scrambler-Bm7vjutl.png","/assets/search-dynamic-sgs-side-events-WORUZVF5-h1pSZCTT.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-DPTwgiTV.js","/assets/search-dynamic-solve-3x3x3-B2L4IN34-uMfhr9Ka.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-B4LYv-f_.js","/assets/search-dynamic-solve-fto-I5ID5LXD-a2hTxbpD.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-DKaUuKrY.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-BH6yevJT.js","/assets/search-worker-entry-SRoK5lVB.js","/assets/SmartcubeAnalyzer-Dv1-qz8H.png","/assets/solver.worker-Dcd9M3uR.js","/assets/storage-CZdPFfJM.js","/assets/Timer-BTBuJ6P0.png","/assets/twips-ZNMKGC5U-CsU0hkLR.js","/assets/twips_wasm_bg-TJNYGA2C-AP2O4LGG-SK8YhHEb.js","/assets/twisty-dynamic-3d-4BEQ76PB-8sjd3Rkg.js"];
  const page = /^\/(?:(?:timer|smartcubeanalyzer|scrambler|options)\/?)?(?:index\.html)?$/;
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
