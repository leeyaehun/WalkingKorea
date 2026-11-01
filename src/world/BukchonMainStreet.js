/**
 * Single source of truth for the one playable Bukchon main street.
 *
 * STEP 01: Based on the existing stylized main-road shape. This is NOT
 * a surveyed/georeferenced trace of real Bukchonro 11-gil yet.
 * Step 02 will refine bends, width, slope and real-world resemblance.
 */
export const MAIN_STREET_ROUTE={
  name:'북촌로11길 메인 골목 (구성 중)',
  width:3.35,
  points:[[0,55],[0,43],[-1,35],[.5,25],[-1.5,15],[-5.5,6],
          [-5,-3],[-2.6,-14],[-2.7,-24],[-2.9,-34],[-3,-44]]
};

// Every discovery must lie on the walkable main street, never where a
// deleted side branch used to be. These are fictional tour descriptions.
export const MAIN_STREET_DISCOVERIES=[
 {id:'entrance',name:'북촌 골목 입구',detail:'하나의 골목을 따라 천천히 올라가거나 내려가요.',x:0,z:43},
 {id:'north',name:'첫 번째 지붕 전망',detail:'기와지붕과 담장을 바라볼 수 있는 골목의 윗부분이에요.',x:.5,z:25},
 {id:'middle',name:'골목 중간',detail:'한옥들 사이로 하나의 길이 이어져요.',x:-5.5,z:6},
 {id:'stone',name:'돌담 구간',detail:'도로 옆 돌담과 한옥의 재질을 가까이서 감상해요.',x:-2.6,z:-12},
 {id:'sloping',name:'가파른 골목',detail:'담장 사이로 이어진 완만한 굴곡과 경사를 느껴봐요.',x:-2.8,z:-29},
 {id:'view',name:'북촌 전망길',detail:'언덕 위에서 작은 한옥 지붕들이 겹쳐 보이는 전망 포인트예요.',x:-3,z:-42}
];
