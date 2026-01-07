/*
  routes.js
  負責：
  - 取得 KMB / Citybus / NLB 路線與站點
  - 統一成可用的幾何資料結構
*/

const RoutesStore = {
  kmb: {},
  ctb: {},
  nlb: {},
};

/* =========================
   KMB
========================= */

async function loadKMBRoutes() {
  const routesRes = await fetch(
    "https://data.etabus.gov.hk/v1/transport/kmb/route/"
  );
  const routesData = await routesRes.json();

  for (const route of routesData.data) {
    const routeKey = `${route.route}-${route.bound}-${route.service_type}`;

    const stopsRes = await fetch(
      `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route.route}/${route.bound}/${route.service_type}`
    );
    const stopsData = await stopsRes.json();

    const stopCoords = [];

    for (const stop of stopsData.data) {
      const stopInfoRes = await fetch(
        `https://data.etabus.gov.hk/v1/transport/kmb/stop/${stop.stop}`
      );
      const stopInfo = await stopInfoRes.json();

      stopCoords.push({
        stopId: stop.stop,
        name: stopInfo.data.name_tc,
        lat: parseFloat(stopInfo.data.lat),
        lng: parseFloat(stopInfo.data.long),
        seq: stop.seq,
      });
    }

    RoutesStore.kmb[routeKey] = {
      route: route.route,
      bound: route.bound,
      serviceType: route.service_type,
      stops: stopCoords,
    };
  }

  console.log("KMB routes loaded", RoutesStore.kmb);
}

/* =========================
   Citybus / NWFB
========================= */

async function loadCitybusRoutes() {
  const routesRes = await fetch(
    "https://rt.data.gov.hk/v1/transport/citybus/route/ctb"
  );
  const routesData = await routesRes.json();

  for (const route of routesData.data) {
    const routeKey = `${route.route}-${route.bound}`;

    const stopsRes = await fetch(
      `https://rt.data.gov.hk/v1/transport/citybus/route-stop/ctb/${route.route}/${route.bound}`
    );
    const stopsData = await stopsRes.json();

    const stopCoords = [];

    for (const stop of stopsData.data) {
      const stopInfoRes = await fetch(
        `https://rt.data.gov.hk/v1/transport/citybus/stop/${stop.stop}`
      );
      const stopInfo = await stopInfoRes.json();

      stopCoords.push({
        stopId: stop.stop,
        name: stopInfo.data.name_tc,
        lat: parseFloat(stopInfo.data.lat),
        lng: parseFloat(stopInfo.data.long),
        seq: stop.seq,
      });
    }

    RoutesStore.ctb[routeKey] = {
      route: route.route,
      bound: route.bound,
      stops: stopCoords,
    };
  }

  console.log("Citybus routes loaded", RoutesStore.ctb);
}

/* =========================
   NLB
========================= */

async function loadNLBRoutes() {
  const routesRes = await fetch(
    "https://rt.data.gov.hk/v1/transport/nlb/route.php?action=list"
  );
  const routesData = await routesRes.json();

  for (const route of routesData.routes) {
    const routeId = route.routeId;

    const stopsRes = await fetch(
      `https://rt.data.gov.hk/v1/transport/nlb/route.php?action=detail&routeId=${routeId}`
    );
    const stopsData = await stopsRes.json();

    const stopCoords = [];

    for (const stop of stopsData.stops) {
      stopCoords.push({
        stopId: stop.stopId,
        name: stop.stopName_tc,
        lat: parseFloat(stop.latitude),
        lng: parseFloat(stop.longitude),
        seq: stop.sequence,
      });
    }

    RoutesStore.nlb[routeId] = {
      routeId,
      routeNo: route.routeNo,
      stops: stopCoords,
    };
  }

  console.log("NLB routes loaded", RoutesStore.nlb);
}

/* =========================
   對外初始化入口
========================= */

async function loadAllRoutes() {
  console.log("Loading routes...");

  await loadKMBRoutes();
  await loadCitybusRoutes();
  await loadNLBRoutes();

  console.log("All routes loaded");
}

/* 讓其他檔案可以使用 */
window.RoutesStore = RoutesStore;
window.loadAllRoutes = loadAllRoutes;
