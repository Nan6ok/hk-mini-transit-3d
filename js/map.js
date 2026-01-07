mapboxgl.accessToken = "pk.eyJ1IjoibmFuNm9rIiwiYSI6ImNtazB2bTYxMTdhNnkzZHB1cXN4bTRmb3UifQ.c6BNgPAE-3qtewe22CGvyQ";

/* 可切換的地圖風格 */
const mapStyles = [
  "mapbox://styles/mapbox/streets-v12",          // 彩色（日）
  "mapbox://styles/mapbox/navigation-night-v1", // 彩色（夜）
  "mapbox://styles/mapbox/light-v11"             // 淡色
];

let currentStyleIndex = 0;

/* 建立地圖 */
const map = new mapboxgl.Map({
  container: "map",
  style: mapStyles[currentStyleIndex],
  center: [114.1694, 22.3193], // 香港
  zoom: 11.8,
  pitch: 65,
  bearing: -20,
  antialias: true,
});

/* Map 載入完成後加入 3D 效果 */
map.on("load", () => {
  add3DEffects();
});

/* 地圖風格切換按鈕 */
document.getElementById("mapStyleBtn").addEventListener("click", () => {
  currentStyleIndex = (currentStyleIndex + 1) % mapStyles.length;
  map.setStyle(mapStyles[currentStyleIndex]);

  map.once("style.load", () => {
    add3DEffects();
  });
});

/* === 抽出共用的 3D 效果函式（關鍵） === */
function add3DEffects() {
  // 3D 地形
  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
  }

  map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });

  // 天空
  if (!map.getLayer("sky")) {
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 0.0],
        "sky-atmosphere-sun-intensity": 15,
      },
    });
  }

  // 3D 建築
  const layers = map.getStyle().layers;
  let labelLayerId;

  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === "symbol" && layers[i].layout["text-field"]) {
      labelLayerId = layers[i].id;
      break;
    }
  }

  if (!map.getLayer("3d-buildings")) {
    map.addLayer(
      {
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#d1d1d1",
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14,
            0,
            16,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14,
            0,
            16,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.85,
        },
      },
      labelLayerId
    );
  }
}
