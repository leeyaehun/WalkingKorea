/**
 * Single source of truth for the one playable Bukchon main street.
 *
 * STEP 02: Reframe the former zigzag as a nearly straight, gently bending
 * north-up hill alley with cityward views, based on publicly documented
 * Bukchon-ro 11-gil photos. This 99m game segment is deliberately condensed,
 * NOT a georeferenced survey, property map or 1:1 historic reconstruction.
 */
export const MAIN_STREET_ROUTE={
  name:'북촌로11길 메인 골목 (게임 재구성)',
  width:3.24,
  // South (z=+55) to North (z=-44): a 99m continuous descending viewpoint.
  // x drifts by only ~2m; the authentic photographic composition is a
  // long narrow downhill corridor, not a winding suburban cul-de-sac.
  points:[[-1,55],[-.95,43],[-1.15,35],[-1.35,25],[-1.58,15],
          [-1.87,6],[-2.18,-3],[-2.50,-14],[-2.76,-24],
          [-2.94,-34],[-3,-44]]
};

// Every discovery must lie on the walkable main street, never where a
// deleted side branch used to be. These are fictional tour descriptions.
export const MAIN_STREET_DISCOVERIES=[
 {id:'entrance',name:'북촌 골목 입구',detail:'하나의 골목을 따라 천천히 올라가거나 내려가요.',x:-.95,z:43},
 {id:'north',name:'첫 번째 지붕 전망',detail:'기와지붕과 담장을 바라볼 수 있는 골목의 윗부분이에요.',x:-1.35,z:25},
 {id:'middle',name:'골목 중간',detail:'한옥들 사이로 하나의 길이 이어져요.',x:-1.87,z:6},
 {id:'stone',name:'돌담 구간',detail:'도로 옆 돌담과 한옥의 재질을 가까이서 감상해요.',x:-2.44,z:-12},
 {id:'sloping',name:'가파른 골목',detail:'담장 사이로 이어진 완만한 굴곡과 경사를 느껴봐요.',x:-2.85,z:-29},
 {id:'view',name:'북촌 전망길',detail:'언덕 위에서 작은 한옥 지붕들이 겹쳐 보이는 전망 포인트예요.',x:-3,z:-42}
];
