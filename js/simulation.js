/*
  simulation.js
  - 將 ETA 轉成地圖上的巴士位置
  - 更新 Mapbox Marker
  - 支援 KMB / CTB / NLB
*/

const BusMarkers = {}; // { "busKey": mapboxgl.Marker }

/* 線性插值計算兩點間位置 */
function interpolatePosition(lat1, lng1, lat2, lng2, ratio) {
  const lat = lat1 + (lat2 - lat1) * ratio;
  const lng = lng1 + (lng2 - lng1) * ratio;
  return [lng, lat];
}

/* 計算當前巴士位置 */
function getBusPosition(routeStops, stopETAs, now = new Date()) {
  for (let i = 0; i < routeStops.length - 1; i++) {
    const stopA = routeStops[i];
    const stopB = routeStops[i + 1];

    const etaA = new Date(stopETAs[stopA.stopId]);
    const etaB = new Date(stopETAs[stopB.stopId]);

    if (now >= etaA && now <= etaB) {
      const total = etaB - etaA;
      const passed = now - etaA;
      const ratio = Math.min(Math.max(passed / total, 0), 1);

      return interpolatePosition(stopA.lat, stopA.lng, stopB.lat, stopB.lng, ratio);
    }
  }

  // 如果已經超過最後一站
  const lastStop = routeStops[routeStops.length - 1];
  return [lastStop.lng, lastStop.lat];
}

/* 建立或更新巴士 Marker */
function updateBusMarker(busKey, position, color = "red") {
  if (!BusMarkers[busKey]) {
    const el = document.createElement("div");
    el.className = "bus-marker";
    el.style.width = "20px";
    el.style.height = "20px";
    el.style.background = color;
    el.style.borderRadius = "50%";
    el.style.border = "2px solid white";

    const marker = new mapboxgl.Marker(el)
      .setLngLat(position)
      .addTo(map);

    BusMarkers[busKey] = marker;
  } else {
    BusMarkers[busKey].setLngLat(position);
  }
}

/* 主要更新函式，每秒跑一次 */
function simulateBuses() {
  const now = new Date();

  // KMB
  for (const routeKey in RoutesStore.kmb) {
    const route = RoutesStore.kmb[routeKey];
    const stopETAs = {};
    for (const stop of route.stops) {
      const etaKey = `${route.route}-${route.bound}-${route.serviceType}-${stop.stopId}`;
      const etaObj = ETAStore.kmb[etaKey];
      if (etaObj) stopETAs[stop.stopId] = etaObj.eta;
    }

    if (Object.keys(stopETAs).length > 1) {
      const pos = getBusPosition(route.stops, stopETAs, now);
      updateBusMarker("KMB-" + routeKey, pos, "red");
    }
  }

  // Citybus
  for (const routeKey in RoutesStore.ctb) {
    const route = RoutesStore.ctb[routeKey];
    const stopETAs = {};
    for (const stop of route.stops) {
      const etaKey = `${route.route}-${route.bound}-${stop.stopId}`;
      const etaObj = ETAStore.ctb[etaKey];
      if (etaObj) stopETAs[stop.stopId] = etaObj.eta;
    }

    if (Object.keys(stopETAs).length > 1) {
      const pos = getBusPosition(route.stops, stopETAs, now);
      updateBusMarker("CTB-" + routeKey, pos, "blue");
    }
  }

  // NLB
  for (const routeId in RoutesStore.nlb) {
    const route = RoutesStore.nlb[routeId];
    const stopETAs = {};
    for (const stop of route.stops) {
      const etaObj = ETAStore.nlb[`${routeId}-${stop.stopId}`];
      if (etaObj) stopETAs[stop.stopId] = etaObj.eta;
    }

    if (Object.keys(stopETAs).length > 1) {
      const pos = getBusPosition(route.stops, stopETAs, now);
      updateBusMarker("NLB-" + routeId, pos, "green");
    }
  }
}

/* 每秒更新一次巴士位置 */
setInterval(simulateBuses, 1000);

/* bus-marker CSS */
const style = document.createElement("style");
style.innerHTML = `
.bus-marker {
  box-shadow: 0 0 3px rgba(0,0,0,0.6);
  transform: translate(-50%, -50%);
}
`;
document.head.appendChild(style);
