# V2.8 — 여섯 캐릭터의 동작 자세

기존 캐릭터 6종 각각에 스윙 연습·투구 준비·앉아서 물을 마시며 쉬는 자세를 추가했습니다. `assets/actions/avatar-01.png`부터 `avatar-06.png`까지 각 2172×724 RGBA PNG이며, 세 개의 정사각 칸을 가진 이미지입니다. 기존 프로필/생성 이미지와 저장된 외형 선택은 유지합니다.

## 표시와 계산

타자 준비는 스윙, 투수 준비는 와인드업, 휴식/재활은 앉은 자세입니다. 좌타·좌투는 해당 자세를 좌우 반전합니다. 양타는 오른손 연습 자세를 사용합니다. 타자의 주루·수비·송구 중심 확정 훈련에는 스윙 그림을 표시하지 않고 기존 캐릭터를 유지합니다. 은퇴도 기존 캐릭터를 유지합니다. 이는 준비 상태의 정지 포즈이며 경기 타석/투구 결과를 재현하지 않습니다.

선택한 외형의 이미지만 필요할 때 불러옵니다. 이미지가 실제로 로드되고 가로가 세로의 세 배인지 확인한 뒤 새 자세를 표시합니다. 로딩 중이나 실패 시 기존 캐릭터가 남습니다. 다른 캐릭터로 대체하지 않습니다. 표시를 위한 일시 캐시만 추가하며 저장·난수·기용·성장 계산은 변경하지 않습니다.

## 자산 제작 및 생성 프롬프트

기본 내장 image_gen 도구로 생성했습니다. 원본 `assets/portraits/avatar-01.webp`부터 `avatar-06.webp`를 각 캐릭터의 편집 대상으로 사용했습니다. 첫 초록색 이미지 이후에는 초록색 3칸 이미지를 배치·자세만 참고하는 두 번째 입력으로 사용했습니다. 원본이나 생성 결과를 자르거나 다시 그리지 않고 그대로 복사해 CSS로 각 칸을 표시합니다. 원본 게임의 자산은 사용하지 않았습니다.

첫 이미지 프롬프트:

> Use case: identity-preserve. Asset type: transparent PNG game sprite atlas for PROJECT DIAMOND. Edit target/reference: the attached original green-uniform baseball avatar. Preserve exactly the same young male character identity, facial features, black hair, dark green baseball cap and shirt, cream trousers, dark green socks, black cleats, chibi proportions, clean illustrated linework and soft shading. Create ONE horizontal atlas with exactly THREE equally sized square cells in a single row, total image aspect 3:1. Each pose entirely inside its own cell, same character scale and foot baseline, generous transparent margin with no overlap across cell boundaries. Cell 1 left: right-handed baseball batter, both hands gripping a wooden bat, completed practice swing follow-through, realistic two hands and two arms, no ball/contact outcome. Cell 2 middle: right-handed pitcher in balanced high-knee windup, baseball in right hand and glove on left, cap and recognizable face visible, no ball in flight. Cell 3 right: seated resting on a simple small backless bench, holding a water bottle, calm tired expression, same uniform, cap worn. Transparent background in all three cells, no floor, no ground shadow, no environment, no lettering, no numbers, no extra characters, no logos, no watermark. This is the existing original character performing three new poses, not a new character. Production-ready coherent atlas, full body never clipped including bat.

나머지 5종 공통 프롬프트(입력 1만 각 원본 캐릭터로 변경):

> Use case: identity-preserve. Asset type: ONE transparent PNG game sprite atlas, 3 equal square cells horizontally, total aspect 3:1. Input image 1 is the EDIT TARGET character: preserve its exact face, hair style, cap/shirt/sock color and cream baseball trousers, black cleats, existing chibi illustration style. Input image 2 is ONLY a layout and pose guide, do not copy its face or green uniform. Recreate the THREE poses in image 2 using ONLY image 1's original character identity and uniform colors. Left cell: right-handed batter practice swing follow-through, two hands gripping wooden bat. Middle: right-handed pitcher with high-knee windup, baseball in right hand, glove on left. Right: seated calmly on simple small backless bench holding water bottle, cap worn. Each entire body and all equipment must fit INSIDE its own equal square cell; use consistent scale and foot baseline with 6% transparent safety margin on every edge; no cross-cell overlap. Three full-body poses of the SAME character. True transparent background, remove ALL original background/fringing. No scenery, no floor, no ground shadow, no text, no cell labels, no logos, no watermark. No ball flight or hit result. Clean hands with correct anatomy. Output only the atlas.

## 검증

로컬 기존 장면·화면 구성 18개, 새 6종×세 자세·저장 불변·좌우 반전·수비 훈련 유지·이미지 실패 복구 10개 검사 통과. PNG의 규격과 투명 알파 확인. 전체 CI 및 실제 배포 검증 결과는 PR에 기록합니다.
