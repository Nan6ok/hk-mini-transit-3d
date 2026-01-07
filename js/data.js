/*
  data.js
  負責：
  - 拉取 KMB / Citybus / NLB 即時 ETA
  - 統一格式
  - 提供給模擬函式使用
*/

const ETAStore = {
  kmb: {},
  ctb: {},
  nlb: {},
};

/* =========================
   KMB ETA
========================= */
async function fetchKMBETA() {
  const res = await fetch("https://data.etabus.gov.hk/v1/transport/kmb/eta/");
  const data = await res.json();

  ETAStore.kmb = {};

  for (const bus of data.data) {
    const key = `${bus.route}-${bus.bound}-${bus.service_type}-${bus.stop}`;
    ETAStore.kmb[key] = {
      route: bus.route,
      bound: bus.bound,
      serviceType: bus.service_type,
      stopId: bus.stop,
      eta: bus.eta, // ISO 8601
    };
  }

  console.log("KMB ETA updated", ETAStore.kmb);
}

/* =========================
   Citybus / NWFB ETA
========================= */
async function fetchCitybusETA() {
  const res = await fetch("https://rt.data.gov.hk/v1/transport/citybus/eta/ctb");
  const data = await res.json();

  ETAStore.ctb = {};

  for (const bus of data.data) {
    const key = `${bus.route}-${bus.bound}-${bus.stop}`;
    ETAStore.ctb[key] = {
      route: bus.route,
      bound: bus.bound,
      stopId: bus.stop,
      eta: bus.eta, // ISO 8601
    };
  }

  console.log("Citybus ETA updated", ETAStore.ctb);
}

/* =========================
   NLB ETA
========================= */
async function fetchNLBETA() {
  const res = await fetch("https://rt.data.gov.hk/v1/transport/nlb/eta.php");
  const data = await res.json();

  ETAStore.nlb = {};

  for (const bus of data) {
    const key = `${bus.routeId}-${bus.stopId}`;
    ETAStore.nlb[key] = {
      routeId: bus.routeId,
      stopId: bus.stopId,
      eta: bus.eta, // ISO 8601
    };
  }

  console.log("NLB ETA updated", ETAStore.nlb);
}

/* =========================
   對外入口
========================= */
async function fetchAllETA() {
  console.log("Fetching all ETA...");

  await fetchKMBETA();
  await fetchCitybusETA();
  await fetchNLBETA();

  console.log("All ETA updated");
}

/* 自動每 30 秒更新一次 */
setInterval(fetchAllETA, 30 * 1000);

/* 對外提供全域變數 */
window.ETAStore = ETAStore;
window.fetchAllETA = fetchAllETA;
