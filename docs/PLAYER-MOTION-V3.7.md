# V3.7 선수 애니메이션

선수 6종의 기존 외형을 참고해 타격·투구·앉아서 쉬기 각각 네 자세를 새로 그렸습니다. 준비 장면과 시즌 진행 화면에서 현재 역할·회복 계획에 맞는 동작을 보여 주며, 경기 다시보기에서는 보관된 내 타석·투구에만 연출을 표시합니다. 볼넷 타석과 상대 타자의 타석에는 내 스윙을 표시하지 않습니다. 이 연출은 공의 궤적이나 타격 시점을 재현하는 물리 시뮬레이션이 아닙니다.

## 파일과 재생

- `assets/motion/avatar-01`부터 `avatar-06`까지 각각 `swing`, `pitch`, `rest`.
- 256×256 애니메이션 WebP 18개, 투명 GIF 18개, 정지 WebP 18개.
- 화면에 보이는 동작만 재생하고, 보이지 않는 영역·백그라운드 탭에서는 정지 그림으로 전환합니다.
- 움직임 끄기는 세션 설정으로 유지됩니다. 운영체제의 움직임 줄이기를 우선 적용합니다.
- WebP 재생 실패 → GIF → 정지 이미지 → 기존 자세/선수 이미지 순으로 복구합니다.
- 좌투·좌타는 해당 동작만 좌우 반전합니다. 수비 훈련·은퇴에는 타격 동작을 추가하지 않습니다.
- 실제 종합 능력 상승과 기록된 팀 우승에 짧은 강조 효과를 적용합니다. 성장 기준이 없거나 능력이 감소한 기록에 상승 연출을 표시하지 않습니다.

`player-motion.js`는 커리어 저장 함수나 난수를 호출하지 않습니다. 경기 결과·훈련 계산·계약·저장 형식을 변경하지 않습니다. 경기 자동 재생의 진행 상태와 이 그림의 움직임 설정은 별개입니다.

## 제작 기록

기존 `assets/actions/avatar-01.png`부터 `avatar-06.png`까지를 참고 이미지로 built-in image generation 도구를 사용했습니다. 프롬프트의 공통 명세:

> Preserve the reference character's face, hair, uniform colors, chibi proportions and shaded anime drawing style. Create a true-alpha transparent 4-column by 3-row sprite atlas with full bodies, consistent cell alignment and scale. Row 1: right-handed batting ready, backswing, swing, follow-through. Row 2: pitching set, leg lift, stride/release, follow-through. Row 3: seated rest holding, lifting, drinking and lowering a blue water bottle. No text, logos, borders, background, overlap or cropped limbs.

색상·외형 변형은 기존 선수에 맞춰 초록/짧은 검정 머리, 파랑/곱슬 검정 머리와 웃음, 노랑/갈색 머리, 보라/검정 머리, 빨강/검정 이너, 청회색/갈색 머리를 각각 지정했습니다. 노란 선수 시트는 배경만 투명하게 바꾸는 후속 편집을 적용했습니다.

`tools/encode-motion.py`는 생성된 시트를 등분하고 크기를 줄여 WebP/GIF로 인코딩합니다. 새로운 그림을 만드는 대체 도구로 사용하지 않았습니다. 원본 PNG는 덮어쓰지 않습니다.

```sh
python3 tools/encode-motion.py 1=/absolute/avatar-01-sheet.png 2=/absolute/avatar-02-sheet.png
```

## 검증

브라우저 회귀 검사에 선수 6종과 역할 전환, 좌우 반전, 정지·재개·새로고침, 움직임 줄이기, WebP/GIF 실패 복구, 기록에 따른 재생, 좁은 화면, 저장·난수 불변 검사를 포함합니다. 기존 저장 슬롯과 계산 로직은 유지합니다.
