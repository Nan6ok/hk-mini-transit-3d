// Three.js 與巴士模型
let threeScene, threeCamera, threeRenderer;
const Bus3DMarkers = {}; // busKey -> THREE.Mesh

// 初始化 Three.js Layer
function initThreeLayer(map) {
  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera();

  map.addLayer({
    id: '3d-bus-layer',
    type: 'custom',
    renderingMode: '3d',
    onAdd: function(map, gl) {
      threeRenderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      threeRenderer.autoClear = false;
    },
    render: function(gl, matrix) {
      const m = new THREE.Matrix4().fromArray(matrix);
      threeCamera.projectionMatrix = m;
      threeRenderer.state.reset();
      threeRenderer.render(threeScene, threeCamera);
      map.triggerRepaint();
    }
  });
}

// 生成 3D 巴士盒子（保證一定看得到）
function addBus3D(busKey, brand) {
  if (Bus3DMarkers[busKey]) return;

  // 用 BoxGeometry 代替真實模型
  const geometry = new THREE.BoxGeometry(0.0005, 0.0002, 0.0002);
  let color = 0xff0000; // KMB 紅色
  if (brand === 'ctb') color = 0xffff00; // CTB 黃色
  if (brand === 'nlb') color = 0x3399ff; // NLB 藍綠

  const material = new THREE.MeshStandardMaterial({ color });
  const bus = new THREE.Mesh(geometry, material);

  Bus3DMarkers[busKey] = bus;
  threeScene.add(bus);
}

// 更新巴士位置與朝向
function updateBus3DPosition(busKey, lng, lat, heading = 0) {
  const bus = Bus3DMarkers[busKey];
  if (!bus) return;

  const coords = mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, 0);
  bus.position.set(coords.x, coords.y, coords.z);
  bus.rotation.y = heading;
}

// 計算位置
function getBusPosition(routeStops, stopETAs, now) {
  for (let i = 0; i < routeStops.length - 1; i++) {
    const a = routeStops[i], b = routeStops[i + 1];
    const etaA = new Date(stopETAs[a.stopId]), etaB = new Date(stopETAs[b.stopId]);
    if (now >= etaA && now <= etaB) {
      const ratio = (now - etaA) / (etaB - etaA);
      const lat = a.lat + (b.lat - a.lat) * ratio;
      const lng = a.lng + (b.lng - a.lng) * ratio;
      return [lng, lat];
    }
  }
  const last = routeStops[routeStops.length - 1];
  return [last.lng, last.lat];
}

// 計算朝向
function getBusHeading(routeStops, stopETAs, now) {
  for (let i = 0; i < routeStops.length - 1; i++) {
    const a = routeStops[i], b = routeStops[i + 1];
    const etaA = new Date(stopETAs[a.stopId]), etaB = new Date(stopETAs[b.stopId]);
    if (now >= etaA && now <= etaB) {
      const dx = b.lng - a.lng, dz = b.lat - a.lat;
      return Math.atan2(dx, dz);
    }
  }
  return 0;
}

// 模擬巴士動態
function simulateBuses3D() {
  const now = new Date();

  for (const routeKey in RoutesStore.kmb) {
    const route = RoutesStore.kmb[routeKey], stopETAs = {};
    route.stops.forEach(s => {
      const key = `${route.route}-${route.bound}-${route.serviceType}-${s.stopId}`;
      if (ETAStore.kmb[key]) stopETAs[s.stopId] = ETAStore.kmb[key].eta;
    });
    if (Object.keys(stopETAs).length > 1) {
      const pos = getBusPosition(route.stops, stopETAs, now);
      const heading = getBusHeading(route.stops, stopETAs, now);
      const busKey = 'KMB-' + routeKey;
      addBus3D(busKey, 'kmb');
      updateBus3DPosition(busKey, pos[0], pos[1], heading);
    }
  }

  for (const routeKey in RoutesStore.ctb) {
    const route = RoutesStore.ctb[routeKey], stopETAs = {};
    route.stops.forEach(s => {
      const key = `${route.route}-${route.bound}-${s.stopId}`;
      if (ETAStore.ctb[key]) stopETAs[s.stopId] = ETAStore.ctb[key].eta;
    });
    if (Object.keys(stopETAs).length > 1) {
      const pos = getBusPosition(route.stops, stopETAs, now);
      const heading = getBusHeading(route.stops, stopETAs, now);
      const busKey = 'CTB-' + routeKey;
      addBus3D(busKey, 'ctb');
      updateBus3DPosition(busKey, pos[0], pos[1], heading);
    }
  }

  for (const routeKey in RoutesStore.nlb) {
    const route = RoutesStore.nlb[routeKey], stopETAs = {};
    route.stops.forEach(s => {
      const key = `${routeKey}-${s.stopId}`;
      if (ETAStore.nlb[key]) stopETAs[s.stopId] = ETAStore.nlb[key].eta;
    });
    if (Object.keys(stopETAs).length > 1) {
      const pos = getBusPosition(route.stops, stopETAs, now);
      const heading = getBusHeading(route.stops, stopETAs, now);
      const busKey = 'NLB-' + routeKey;
      addBus3D(busKey, 'nlb');
      updateBus3DPosition(busKey, pos[0], pos[1], heading);
    }
  }
}
setInterval(simulateBuses3D, 1000);
