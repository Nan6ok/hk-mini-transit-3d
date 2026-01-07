mapboxgl.accessToken = 'pk.eyJ1IjoibmFuNm9rIiwiYSI6ImNtazB2bTYxMTdhNnkzZHB1cXN4bTRmb3UifQ.c6BNgPAE-3qtewe22CGvyQ';
const map = new mapboxgl.Map({
  container:'map',
  style:'mapbox://styles/mapbox/light-v11',
  center:[114.157,22.285],
  zoom:14,
  pitch:60,
  bearing:-17,
  antialias:true
});

map.on('load',()=>{
  map.addSource('routeLine',{
    type:'geojson',
    data:{
      type:'FeatureCollection',
      features:[]
    }
  });
  map.addLayer({
    id:'routeLine',
    type:'line',
    source:'routeLine',
    layout:{ 'line-join':'round','line-cap':'round' },
    paint:{ 'line-color':'#ff0000', 'line-width':4 }
  });

  initThreeLayer(map); // 初始化 3D 模型
});

// 地圖風格切換
document.getElementById('mapStyleBtn').addEventListener('click',()=>{
  const current=map.getStyle().name;
  if(current==='Mapbox Light') map.setStyle('mapbox://styles/mapbox/dark-v11');
  else map.setStyle('mapbox://styles/mapbox/light-v11');
});
