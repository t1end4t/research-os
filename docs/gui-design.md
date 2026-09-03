# GUI design — bản chốt hướng thị giác và tương tác

Trạng thái: **đã chốt hướng, chưa implement**. Chốt tại D-013.
`AGENTS.md` vẫn là tài liệu có thẩm quyền cao nhất.

Tài liệu này chốt các quyết định thị giác/tương tác mà người dùng không cần
duyệt từng chi tiết. Nó không chốt component tree hay tên class.

## Nguyên tắc trung tâm

> Argument khỏe thì màn hình yên tĩnh. Chỗ hỏng phải tự ồn lên.

Mọi quyết định dưới đây đều phục vụ đúng câu đó. Nếu một hiệu ứng làm màn hình
đẹp hơn nhưng làm chỗ hỏng khó thấy hơn, nó bị cắt.

## Signature: đường chịu lực

Điều app được nhớ đến không phải card hay màu nền, mà là **các đường nối mang
trọng lượng**. Link là sản phẩm, nên link là thứ nặng nhất trên canvas.

Node gần như im lặng. Người dùng đọc hình dạng của lập luận trước khi đọc chữ.

Đây là lý do bỏ cách tint card theo node type: khi mọi thứ đều có màu, không gì
có màu.

## 1. Color tokens

Giữ nguyên palette đã có trong `src/index.css`. Không thêm hue mới.

| Token | Vai trò |
|---|---|
| `--color-paper` | nền canvas |
| `--color-surface` | nền card, dock |
| `--color-ink` | chữ user-authored, viền selected |
| `--color-ink-muted` | chrome, label, ghost |
| `--color-rule` | hairline, divider |
| `--color-holds` | chỉ dùng cho link `holds` |
| `--color-weak` | chỉ dùng cho link `weak` |
| `--color-missing` | chỉ dùng cho link `missing` |

**Luật một nghĩa:** ba màu status chỉ xuất hiện trên link và trên chip status của
link. Không dùng chúng cho nút, badge trang trí, hover hay biểu đồ. Đỏ trên canvas
luôn có nghĩa duy nhất là `missing`.

Node không mang màu status. Cách đọc "claim này yếu" đến từ đường nối vào nó.

## 2. Type scale

Giữ hệ ba giọng đã có trong `src/components/ui/instrument.tsx`. Đây là luật
provenance D-011 được thể hiện bằng typography, nên không được trộn.

| Giọng | Font | Dùng cho |
|---|---|---|
| User-authored | `Newsreader` serif | question, claim, `user_reason`, observation |
| Chrome | `Public Sans` | label, nút, filter, menu |
| Model-produced | `IBM Plex Mono` + hatched left edge + model id stamp | check finding, clustering proposal |

Không bao giờ render nội dung model bằng serif. Người dùng phải phân biệt được
"điều tôi khẳng định" và "điều model nói" chỉ bằng cách nhìn.

Thang chữ trên map, dùng để mã hóa tầng cây:

```text
QUESTION   serif 22px / 1.3   ink
CLAIM      serif 16px / 1.5   ink
EVIDENCE   sans  13px / 1.5   ink-muted
LABEL      sans  11px uppercase, tracking .08em
```

Tầng cây được đọc bằng **kích thước**, không bằng màu. Điều này giữ được ý nghĩa
cả khi in trắng đen hoặc khi người dùng bị mù màu.

## 3. Link tokens

Đây là phần mang toàn bộ ý nghĩa.

| Status | Stroke | Màu | Ý nghĩa thị giác |
|---|---|---|---|
| `holds` | 1px liền | `holds` ở 50% opacity | lùi vào nền |
| `weak` | 2px liền | `weak` đủ đậm | đáng chú ý |
| `missing` | 2px nét đứt `6 4` | `missing` đủ đậm | ồn nhất |
| chưa check | 1px nét chấm | `ink-muted` 40% | chưa có phán quyết |

**Link tốt mảnh hơn link xấu.** Đây là điểm đảo ngược quan trọng nhất so với
prototype: không cần bấm filter mới thấy chỗ hỏng, vì chỗ hỏng vốn đã đậm hơn.

Trạng thái *chưa check* phải khác hẳn `weak`. Chưa kiểm tra không phải là yếu.

Edge là orthogonal elbow, bán kính góc 2px, không bezier. Vùng bấm được nới rộng
bằng một stroke trong suốt 12px để link dễ chọn bằng chuột.

## 4. Node và ghost

- Node: nền `surface`, hairline `rule`, bán kính 2px, không shadow.
- Selected: viền `ink` 1px cộng offset outline, không dùng glow.
- Hover: chỉ đổi màu viền, không nhấc card, không scale.
- Ghost: nền trong suốt, viền nét đứt `ink-muted` 50%, chữ `ink-muted`.

Ghost phải trông như **một chỗ trống**, không phải một card chưa điền. Nó không
có nút xóa, không có menu, vì nó không phải row trong storage.

## 5. Semantic zoom

Layout do `computeMapLayout` quyết định và **không đổi theo zoom**. Zoom chỉ đổi
mức chi tiết, nên vị trí một claim hôm nay giống hôm qua.

```text
z < 0.55   SHAPE    chỉ node block và link. Không chữ.
0.55–1.3   STRUCTURE question + claim text. Evidence là thanh nhỏ.
z > 1.3    WORKING  evidence text, user_reason, check, actions.
```

Chuyển mức là fade 120ms, không trượt, không nảy. Ở `prefers-reduced-motion` thì
cắt hẳn transition.

Điều khiển:

```text
pan     kéo nền, hoặc space + kéo, hoặc scroll
zoom    ctrl/cmd + scroll, pinch, hoặc nút +/− và "Fit"
reset   nút Fit đưa toàn bộ graph vào khung
```

Không auto-zoom theo con trỏ và không auto-pan khi chỉ hover. Camera chỉ di
chuyển khi người dùng yêu cầu, hoặc khi họ chọn một node từ nơi khác.

## 5A. Application shell

Desktop shell ưu tiên diện tích cho map:

```text
┌──────────────────────── top bar ────────────────────────────────┐
│rail│                                                             │
│ 48 │                        canvas                      │ dock   │
│ px │                                                    │ 360px  │
│    ├──────────── link inspector, khi có selection ──────┤        │
└──────────────────────────────────────────────────────────────────┘
```

- Top bar: workspace name, tag filter, status filter, search và dock toggle.
- Left rail: Map, Survey, Papers, Experiments. Không có mục Detail; Detail là
  trạng thái của Map.
- Canvas luôn là vùng lớn nhất.
- Dock mặc định 360px, min 300px, max 50% cửa sổ; đóng dock trả diện tích cho
  canvas.
- Link inspector là bottom drawer cao mặc định 34% viewport, min 240px, max 60%.
  Nó không thay route và không che mất parent/child đang được highlight.
- Dưới 1100px, dock trở thành overlay phải thay vì ép canvas quá hẹp. App là
  desktop-first; không thiết kế một mobile research workflow riêng.

Papers dùng vùng giữa cho reader; Experiments dùng claim-centric artifact
gallery; Survey dùng spatial field. Global selection và dock thread vẫn giữ khi
đổi surface.

## 6. Selection

```text
click node    → chọn node, xem nội dung và quan hệ
click link    → mở working view của link đó
```

Working view là nơi làm việc chính và luôn xếp theo đúng thứ tự nhận thức:

```text
1. parent và child
2. user_reason            (serif, của người dùng, lên trước)
3. validity nếu có        (derivation hoặc run)
4. model finding          (mono, có model id)
5. bảng Type/Scope/Target Pass|Partial|Mismatch
6. actions: Weaken claim | Add experiment | Reject
```

`user_reason` luôn nằm trên finding của model. Thứ tự này không phải thẩm mỹ: nó
nói rằng cam kết của người dùng có trước, và model chỉ phản hồi lại cam kết đó.

Khi link chưa có reason, mục 4 và 5 hiển thị trạng thái không có, kèm câu giải
thích cấu trúc còn thiếu. Không có ô nào để model điền hộ.

Node và edge không thể kéo để đổi vị trí; layout là deterministic. Drag vào dock
bắt đầu từ một grip hiện khi hover/focus, tránh xung đột với click và pan. Edge
có grip nhỏ ở midpoint. Kéo cả card trực tiếp không được dùng.

## 7. Keyboard

```text
Cmd/Ctrl+J   toggle dock
/            filter
Esc          bỏ selection
Tab          đi giữa các node theo thứ tự layout
Enter        mở working view của link đang chọn
```

Focus ring luôn nhìn thấy được, dùng outline `ink` đã khai báo trong `index.css`.

## 8. Dock và drag-drop

Dock nằm bên phải, resize bằng cách kéo cạnh trái, toggle bằng `Cmd/Ctrl+J`.

Khi bắt đầu kéo một object, dock hiện một vùng nhận rõ ràng với viền nét đứt.
Không có animation bay hay hiệu ứng nảy.

```text
drop node          → đặt node làm explicit context cho capability được phép
drop link          → "check quan hệ này"        ← gesture chính
drop passage       → hỏi về đoạn đang đọc
drop artifact      → đặt artifact và claim nó test cạnh nhau; không viết observation
drop nhiều object  → giữ context hiển thị; không tự suy ra hay sinh cầu nối
```

Context chip hiện đúng thứ đang cầm, và mỗi context là một thread riêng.

Khi kéo một link chưa có `user_reason`, dock hiện đúng chỗ vướng bằng từ vựng cố
định của D-006 và **không** đề nghị viết hộ. Đây là hành vi giao diện, nhưng thứ
thực sự chặn là tool schema không có field reason ghi được.

Nếu tổ hợp object không tương ứng với capability trong `AGENTS.md` §4, transcript
giải thích giới hạn và dừng. Drag-drop là cách truyền context, không phải cách
lách danh sách MAY.

## 9. Survey field

Note và candidate sống trong cùng một mặt phẳng.

- Note là card nhỏ một dòng, có nguồn.
- Candidate là một vùng bao quanh các note đã được nhận, không phải cột riêng.
- Cluster chưa có cầu nối được đặt cách nhau và app nói thẳng là chưa có note nào
  nối chúng. App không vẽ cầu nối gợi ý.
- Vị trí note ổn định giữa các lần mở, để người dùng xây được mental map.

Khi chạm mốc 15 note chưa cluster mà chưa đủ 3 candidate, ô thêm note biến thành
trạng thái bị chặn có giải thích. Không phải toast, không có nút bỏ qua.

## 10. Motion budget

Cả app chỉ có ba chuyển động:

```text
fade giữa các mức zoom       120ms
dock mở/đóng                 160ms
xuất hiện confirmation line   90ms
```

Không parallax, không ambient drift, không hiệu ứng gõ chữ. Chuyển động dư làm
giao diện trông như sinh tự động và làm mắt rời khỏi chỗ hỏng.

## 11. Copy

Giọng của app: mô tả cấu trúc, không khen, không xin lỗi.

```text
Tốt:   "Link này chưa có reason, nên chưa thể kiểm tra."
Tệ:    "Rất tiếc! Hãy thêm một lý do thật thuyết phục nhé."

Tốt:   "Chưa có evidence dưới claim này."
Tệ:    "Hãy thêm evidence để làm claim mạnh hơn!"
```

Trạng thái rỗng nói rõ đang thiếu thành phần cấu trúc nào, dùng từ vựng đóng của
D-006, và không đưa ví dụ hoàn thành câu dựa trên topic hiện tại.
