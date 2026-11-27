(() => {
  const CACHE = "cuberplus-97e86650f14b8f73";
  const PRECACHE = ["/index.html","/manifest.webmanifest","/icon-192.png","/icon-512.png","/favicon.ico","/trainer-preview.svg","/analyzer/theme-init.js","/analyzer/react-data-grid.css","/assets/AcubemyCsv-CMfcmPFt.png","/assets/algorithmMatching-CEZ32Qex.js","/assets/algorithms-yl9k5kVF.js","/assets/analysis-BsOLV6Sw.js","/assets/analyzer-data-B05bC1j0.js","/assets/analyzer-replay-CcCvbZQa.js","/assets/AnalyzerSteps-2Zoh-Pxb.png","/assets/App-BZNg4kz0.css","/assets/App-CRuW41XV.js","/assets/App-D6uiJlsL.css","/assets/App-UYbqeN0Q.js","/assets/App-z7qHM4Qd.js","/assets/aurora-2x-B-3lQwMo.webp","/assets/aurora-Bvg3dfg0.jpg","/assets/aurora-Cw0NljEy.webp","/assets/auth-efGW1_fz.js","/assets/big-puzzle-orientation-ADWIOX6S-CXAEUMPm.js","/assets/big-puzzle-orientation-ADWIOX6S-o3lg7fFX.js","/assets/CacheKeys-C258EyQi.js","/assets/caseGroups-CBr6wb-J.js","/assets/CaseImage-BEk_8Lf1.js","/assets/caseImages-DCvRVU0f.js","/assets/CaseModal-B0hZ5NhP.js","/assets/cases-B8mBvCRb.js","/assets/chartWorker-CYC0uNBG.js","/assets/chunk-7LXHWXCO-CkGcus8d.js","/assets/chunk-7LXHWXCO-lXmAMLQz.js","/assets/chunk-UEUJSZTX-B1L4t-kZ.js","/assets/cube-CRczlqun.js","/assets/CubeastCsv-BjqOuVrG.png","/assets/CubeastDownload-C48mqkPY.png","/assets/CubeConnection-BaqK77yG.js","/assets/cubeLocations-DaISfJW4.js","/assets/cubing-core-iTc8GN-O.js","/assets/customAlgorithms-CyZQ-ptI.js","/assets/Database-B_pVXkXp.css","/assets/Database-L6uL7udx.js","/assets/Database-Y9BKHidS.png","/assets/dataClient-BDIqpZaO.js","/assets/dataWorker-Dv3jBlOL.js","/assets/DiscoverAlgorithms-BQnpZFD9.css","/assets/DiscoverAlgorithms-CtyMI6ad.js","/assets/engine-a1gSG79h.js","/assets/f2l-CkQd7qPM.js","/assets/f2lPracticeImages-BpCqfWC2.js","/assets/favoriteAlgorithms-CxTUdT08.js","/assets/favorites-Co0P8QXy.js","/assets/Home-Ctk71ssx.js","/assets/Home-D3sBm95I.css","/assets/index-BL1CTlIA.js","/assets/index-CnzrsVp7.js","/assets/index-pjK_4Q32.js","/assets/inside-JAJOK2MI-COy97vFS.js","/assets/inside-JAJOK2MI-INKRSWiu.js","/assets/main-CGL6ssOq.js","/assets/main-CrzmoUMm.css","/assets/MistakeAnalysis-CRO0VZLE.js","/assets/MoveAnalysis-BrHZY0pY.js","/assets/Options-B_A2vrSW.js","/assets/PageOptionsButton-D6GVp7-C.js","/assets/preload-helper-bFjQlsqE.js","/assets/puzzle-2RmiaArB.js","/assets/puzzle-5cIpQ_1J.js","/assets/puzzles-dynamic-3x3x3-FYXD7SIU-BAAKgtmM.js","/assets/puzzles-dynamic-4x4x4-AIGABOAR-Cr8v4tqZ.js","/assets/puzzles-dynamic-megaminx-2LVHIDL4-Cm8jQJ-N.js","/assets/puzzles-dynamic-side-events-IMYJ533P-DK91LDw7.js","/assets/puzzles-dynamic-side-events-IMYJ533P-uM0XY_nj.js","/assets/puzzles-dynamic-unofficial-P3TW433I-cOWAxRTA.js","/assets/puzzles-dynamic-unofficial-P3TW433I-Qmz-kdAk.js","/assets/recent-BQEyu0ng.js","/assets/relativeTime-DfGj-JFi.js","/assets/Replay-BZxk54i-.css","/assets/Replay-CXyR_XP5.js","/assets/Scrambler-YkJVfnMw.png","/assets/search-dynamic-sgs-side-events-WORUZVF5-CPq2g9xj.js","/assets/search-dynamic-sgs-side-events-WORUZVF5-rB4_XiQd.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-Du-9Dejx.js","/assets/search-dynamic-sgs-unofficial-5JQKPNG2-UvhnLlvC.js","/assets/search-dynamic-solve-3x3x3-B2L4IN34-uMfhr9Ka.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-CM7lAY9i.js","/assets/search-dynamic-solve-4x4x4-BGV4AJVT-DHiVK35a.js","/assets/search-dynamic-solve-fto-I5ID5LXD-BdatdvEJ.js","/assets/search-dynamic-solve-fto-I5ID5LXD-DCoahtBn.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-9OX1aSr1.js","/assets/search-dynamic-solve-kilominx-Y2D3C74Y-CTp6jK8m.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-CieuOImW.js","/assets/search-dynamic-solve-master_tetraminx-GIS7T5B7-lQnZHX0h.js","/assets/search-worker-entry-B9TEFp0N.js","/assets/search-worker-entry-EMfW0jHs.js","/assets/ShareDialog-BGeY7Ajr.js","/assets/SharedPage-CRLays78.js","/assets/SmartcubeAnalyzer-C55jalzc.png","/assets/solver.worker-CyT3tydY.js","/assets/storage-BiFGsdNR.js","/assets/Timer-riFFTkt6.png","/assets/trainer-7btssb3O.js","/assets/trainer-CEistx-f.css","/assets/Trainer-CQchGuU3.png","/assets/Trainer-_VEruNXF.js","/assets/twips-ZNMKGC5U-BNnZmBEI.js","/assets/twips-ZNMKGC5U-D02H7J90.js","/assets/twips_wasm_bg-TJNYGA2C-AP2O4LGG-SK8YhHEb.js","/assets/twisty-dynamic-3d-4BEQ76PB-qeh62CjH.js","/assets/workerClient-CQEMIrKx.js","/case-images/AF2L.svg","/case-images/F2L.svg","/case-images/OF2L.svg","/case-images/OLL.svg","/case-images/Patterns.svg","/case-images/PLL.svg","/case-images/AF2L-1.svg","/case-images/AF2L-10.svg","/case-images/AF2L-10a.svg","/case-images/AF2L-11.svg","/case-images/AF2L-11a.svg","/case-images/AF2L-12.svg","/case-images/AF2L-12a.svg","/case-images/AF2L-13.svg","/case-images/AF2L-14.svg","/case-images/AF2L-15.svg","/case-images/AF2L-16.svg","/case-images/AF2L-17.svg","/case-images/AF2L-18.svg","/case-images/AF2L-19.svg","/case-images/AF2L-1a.svg","/case-images/AF2L-2.svg","/case-images/AF2L-20.svg","/case-images/AF2L-21.svg","/case-images/AF2L-22.svg","/case-images/AF2L-23.svg","/case-images/AF2L-24.svg","/case-images/AF2L-25.svg","/case-images/AF2L-26.svg","/case-images/AF2L-27.svg","/case-images/AF2L-28.svg","/case-images/AF2L-29.svg","/case-images/AF2L-2a.svg","/case-images/AF2L-3.svg","/case-images/AF2L-30.svg","/case-images/AF2L-31.svg","/case-images/AF2L-32.svg","/case-images/AF2L-33.svg","/case-images/AF2L-34.svg","/case-images/AF2L-35.svg","/case-images/AF2L-36.svg","/case-images/AF2L-37.svg","/case-images/AF2L-38.svg","/case-images/AF2L-39.svg","/case-images/AF2L-3a.svg","/case-images/AF2L-4.svg","/case-images/AF2L-40.svg","/case-images/AF2L-41.svg","/case-images/AF2L-42.svg","/case-images/AF2L-4a.svg","/case-images/AF2L-5.svg","/case-images/AF2L-5a.svg","/case-images/AF2L-6.svg","/case-images/AF2L-6a.svg","/case-images/AF2L-7.svg","/case-images/AF2L-7a.svg","/case-images/AF2L-8.svg","/case-images/AF2L-8a.svg","/case-images/AF2L-9.svg","/case-images/AF2L-9a.svg","/case-images/F2L-1.svg","/case-images/F2L-10.svg","/case-images/F2L-11.svg","/case-images/F2L-12.svg","/case-images/F2L-13.svg","/case-images/F2L-14.svg","/case-images/F2L-15.svg","/case-images/F2L-16.svg","/case-images/F2L-17.svg","/case-images/F2L-18.svg","/case-images/F2L-19.svg","/case-images/F2L-2.svg","/case-images/F2L-20.svg","/case-images/F2L-21.svg","/case-images/F2L-22.svg","/case-images/F2L-23.svg","/case-images/F2L-24.svg","/case-images/F2L-25.svg","/case-images/F2L-26.svg","/case-images/F2L-27.svg","/case-images/F2L-28.svg","/case-images/F2L-29.svg","/case-images/F2L-3.svg","/case-images/F2L-30.svg","/case-images/F2L-31.svg","/case-images/F2L-32.svg","/case-images/F2L-33.svg","/case-images/F2L-34.svg","/case-images/F2L-35.svg","/case-images/F2L-36.svg","/case-images/F2L-37.svg","/case-images/F2L-38.svg","/case-images/F2L-39.svg","/case-images/F2L-4.svg","/case-images/F2L-40.svg","/case-images/F2L-41.svg","/case-images/F2L-5.svg","/case-images/F2L-6.svg","/case-images/F2L-7.svg","/case-images/F2L-8.svg","/case-images/F2L-9.svg","/case-images/OF2L-1.svg","/case-images/OF2L-10.svg","/case-images/OF2L-11.svg","/case-images/OF2L-12.svg","/case-images/OF2L-13.svg","/case-images/OF2L-14.svg","/case-images/OF2L-15.svg","/case-images/OF2L-16.svg","/case-images/OF2L-17.svg","/case-images/OF2L-18.svg","/case-images/OF2L-19.svg","/case-images/OF2L-2.svg","/case-images/OF2L-20.svg","/case-images/OF2L-21.svg","/case-images/OF2L-22.svg","/case-images/OF2L-23.svg","/case-images/OF2L-24.svg","/case-images/OF2L-25.svg","/case-images/OF2L-26.svg","/case-images/OF2L-27.svg","/case-images/OF2L-28.svg","/case-images/OF2L-29.svg","/case-images/OF2L-3.svg","/case-images/OF2L-30.svg","/case-images/OF2L-31.svg","/case-images/OF2L-32.svg","/case-images/OF2L-33.svg","/case-images/OF2L-34.svg","/case-images/OF2L-35.svg","/case-images/OF2L-36.svg","/case-images/OF2L-37.svg","/case-images/OF2L-38.svg","/case-images/OF2L-39.svg","/case-images/OF2L-4.svg","/case-images/OF2L-40.svg","/case-images/OF2L-41.svg","/case-images/OF2L-42.svg","/case-images/OF2L-43.svg","/case-images/OF2L-44.svg","/case-images/OF2L-45.svg","/case-images/OF2L-46.svg","/case-images/OF2L-47.svg","/case-images/OF2L-48.svg","/case-images/OF2L-49.svg","/case-images/OF2L-5.svg","/case-images/OF2L-50.svg","/case-images/OF2L-51.svg","/case-images/OF2L-52.svg","/case-images/OF2L-53.svg","/case-images/OF2L-54.svg","/case-images/OF2L-55.svg","/case-images/OF2L-56.svg","/case-images/OF2L-57.svg","/case-images/OF2L-58.svg","/case-images/OF2L-59.svg","/case-images/OF2L-6.svg","/case-images/OF2L-60.svg","/case-images/OF2L-61.svg","/case-images/OF2L-62.svg","/case-images/OF2L-63.svg","/case-images/OF2L-64.svg","/case-images/OF2L-65.svg","/case-images/OF2L-66.svg","/case-images/OF2L-67.svg","/case-images/OF2L-68.svg","/case-images/OF2L-69.svg","/case-images/OF2L-7.svg","/case-images/OF2L-70.svg","/case-images/OF2L-71.svg","/case-images/OF2L-72.svg","/case-images/OF2L-73.svg","/case-images/OF2L-74.svg","/case-images/OF2L-75.svg","/case-images/OF2L-8.svg","/case-images/OF2L-9.svg","/case-images/OLL-1.svg","/case-images/OLL-10.svg","/case-images/OLL-11.svg","/case-images/OLL-12.svg","/case-images/OLL-13.svg","/case-images/OLL-14.svg","/case-images/OLL-15.svg","/case-images/OLL-16.svg","/case-images/OLL-17.svg","/case-images/OLL-18.svg","/case-images/OLL-19.svg","/case-images/OLL-2.svg","/case-images/OLL-20.svg","/case-images/OLL-21.svg","/case-images/OLL-22.svg","/case-images/OLL-23.svg","/case-images/OLL-24.svg","/case-images/OLL-25.svg","/case-images/OLL-26.svg","/case-images/OLL-27.svg","/case-images/OLL-28.svg","/case-images/OLL-29.svg","/case-images/OLL-3.svg","/case-images/OLL-30.svg","/case-images/OLL-31.svg","/case-images/OLL-32.svg","/case-images/OLL-33.svg","/case-images/OLL-34.svg","/case-images/OLL-35.svg","/case-images/OLL-36.svg","/case-images/OLL-37.svg","/case-images/OLL-38.svg","/case-images/OLL-39.svg","/case-images/OLL-4.svg","/case-images/OLL-40.svg","/case-images/OLL-41.svg","/case-images/OLL-42.svg","/case-images/OLL-43.svg","/case-images/OLL-44.svg","/case-images/OLL-45.svg","/case-images/OLL-46.svg","/case-images/OLL-47.svg","/case-images/OLL-48.svg","/case-images/OLL-49.svg","/case-images/OLL-5.svg","/case-images/OLL-50.svg","/case-images/OLL-51.svg","/case-images/OLL-52.svg","/case-images/OLL-53.svg","/case-images/OLL-54.svg","/case-images/OLL-55.svg","/case-images/OLL-56.svg","/case-images/OLL-57.svg","/case-images/OLL-6.svg","/case-images/OLL-7.svg","/case-images/OLL-8.svg","/case-images/OLL-9.svg","/case-images/Patterns-1.svg","/case-images/Patterns-10.svg","/case-images/Patterns-11.svg","/case-images/Patterns-2.svg","/case-images/Patterns-3.svg","/case-images/Patterns-4.svg","/case-images/Patterns-5.svg","/case-images/Patterns-6.svg","/case-images/Patterns-7.svg","/case-images/Patterns-8.svg","/case-images/Patterns-9.svg","/case-images/PLL-Aa.svg","/case-images/PLL-Ab.svg","/case-images/PLL-E.svg","/case-images/PLL-F.svg","/case-images/PLL-Ga.svg","/case-images/PLL-Gb.svg","/case-images/PLL-Gc.svg","/case-images/PLL-Gd.svg","/case-images/PLL-H.svg","/case-images/PLL-Ja.svg","/case-images/PLL-Jb.svg","/case-images/PLL-Na.svg","/case-images/PLL-Nb.svg","/case-images/PLL-Ra.svg","/case-images/PLL-Rb.svg","/case-images/PLL-T.svg","/case-images/PLL-Ua.svg","/case-images/PLL-Ub.svg","/case-images/PLL-V.svg","/case-images/PLL-Y.svg","/case-images/PLL-Z.svg"];
  const page = /^\/(?:(?:timer|analyzer|smartcubeanalyzer|scrambler|database|trainer|options)\/?)?(?:index\.html)?$/;
  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then(async (cache) => {
      await cache.addAll(PRECACHE.filter((file) => !file.startsWith("/case-images/")));
      for (const file of PRECACHE.filter((file2) => file2.startsWith("/case-images/"))) await cache.add(file);
    }));
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
      if ((await self.clients.matchAll({ includeUncontrolled: true })).length <= 1) {
        await Promise.all((await caches.keys()).filter((key) => key.startsWith("cuberplus-") && key !== CACHE && key !== "cuberplus-preferences").map((key) => caches.delete(key)));
      }
      await self.clients.claim();
    })());
  });
  async function remindStreak() {
    const now = /* @__PURE__ */ new Date();
    if (now.getHours() < 18 || Notification.permission !== "granted") return;
    const day = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5;
    const today = day(now), settings = await caches.open("cuberplus-preferences");
    if (await (await settings.match("/streak-reminders/enabled"))?.text() !== "true" || await (await settings.match("/streak-reminders/last-day"))?.text() === String(today)) return;
    const best = /* @__PURE__ */ new Map();
    let hasToday = false;
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("smart-cube-timer");
      request.onupgradeneeded = () => request.transaction?.abort();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("solves"), cursor = tx.objectStore("solves").openCursor();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onabort = tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        cursor.onsuccess = () => {
          const row = cursor.result;
          if (!row) return;
          const solve = row.value;
          if (solve.status !== "active") {
            const date = day(new Date(solve.imported?.endDate ?? Date.parse(solve.createdAt) + (solve.moves.at(-1)?.elapsed ?? solve.duration)));
            if (date === today) hasToday = true;
            if (solve.status === "complete" && solve.session !== "Retries") {
              const time = solve.duration + (solve.penalty ?? 0);
              best.set(date, Math.min(time, best.get(date) ?? Infinity));
            }
          }
          row.continue();
        };
      };
    });
    if (hasToday) return;
    for (const target of [5, 7, 10, 15, 20, 30, 60]) {
      let length = 0;
      for (let date = today - 1; (best.get(date) ?? Infinity) < target * 1e3; date--) length++;
      if (!length) continue;
      await settings.put("/streak-reminders/last-day", new Response(String(today)));
      await self.registration.showNotification(`Your ${length} day sub-${target} streak is about to end!`, {
        tag: "streak-reminder",
        icon: "/icon-192.png",
        data: { url: "/timer/" }
      });
      break;
    }
  }
  let reminderCheck = Promise.resolve();
  self.addEventListener("periodicsync", (event) => {
    const sync = event;
    if (sync.tag === "streak-reminder") sync.waitUntil(reminderCheck = reminderCheck.catch(() => {
    }).then(remindStreak));
  });
  self.addEventListener("notificationclick", (event) => {
    if (event.notification.tag !== "streak-reminder") return;
    event.notification.close();
    event.waitUntil((async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.navigate("/timer/");
        await existing.focus();
      } else await self.clients.openWindow("/timer/");
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
