# Nhật ký quyết định sản phẩm

Tài liệu này ghi lại các quyết định trong quá trình khám phá Research OS. Đây
không phải schema hay kế hoạch implementation. `AGENTS.md` vẫn là tài liệu có
thẩm quyền cao nhất.

Ngày ghi nhận: **2026-09-03**

## D-000 — Chưa chốt GUI

Trạng thái: **đã chấp nhận tại thời điểm khám phá; được D-012 chốt một phần về
hướng GUI ban đầu**.

Các tài liệu hiện tại chỉ chốt nguyên tắc sản phẩm, semantic boundary, gate và
quyền của người dùng/assistant. Chúng **không** chốt:

- Layout hoặc số cột.
- Tab, pane hoặc surface cuối cùng.
- Navigation và routing khi click một node.
- Drag-and-drop interaction.
- Tên gọi hiển thị trong GUI.
- Việc giữ, bỏ hay thay thế các màn hình của prototype hiện tại.

Các tên GRAPH, DETAIL, SURVEY, PAPERS và EXPERIMENTS trong trace chỉ mô tả draft
hiện có để kiểm tra workflow. Chúng không phải cam kết cho GUI tương lai.

Mọi kết luận như “derivation route về Detail” là quá sớm và không được xem là
quyết định.

## D-001 — Infrastructure không phải evidence

Trạng thái: **đã chấp nhận**.

Infrastructure vẫn phải được kiểm tra bằng benchmark hoặc experiment phù hợp.
Tuy nhiên, việc framework chạy được chỉ chứng minh framework hoạt động; nó
không tự động hỗ trợ research claim.

- Research graph vẫn chỉ có `QUESTION → CLAIM → EVIDENCE`.
- Infrastructure không trở thành tầng thứ tư hoặc node nghiên cứu mới.
- Experiment trong graph có thể tham chiếu code, commit, environment và runtime
  ở bên ngoài.
- Vì đây là research chứ không phải dev, mọi assertion quan trọng về
  infrastructure phải được kiểm tra bằng experiment.

## D-002 — Pre-run contract cho confirmatory evidence

Trạng thái: **đã chấp nhận**.

Debug run và exploratory run không cần ceremony. Trước khi một run được tính là
confirmatory evidence, người dùng phải ghi trước tối thiểu:

- Claim đang được kiểm tra.
- Target hoặc metric thực sự được đo.
- Baseline hoặc điểm so sánh.
- Kết quả kỳ vọng hoặc ngưỡng chấp nhận.
- Điều kiện làm claim yếu đi.
- Điều kiện để run được xem là hợp lệ.
- Scope mà kết luận được phép áp dụng.

Ví dụ, `accuracy = 90%` tự nó chưa có nghĩa. Nó chỉ có nghĩa khi biết 90% so với
baseline nào, trên distribution nào, và ngưỡng nào đã được cam kết trước.

## D-003 — Cho phép post-hoc evidence, nhưng phải mang nhãn

Trạng thái: **đã chấp nhận**.

Một run không có prediction trước vẫn có thể tạo ra evidence có giá trị. Nó
được lưu với provenance `exploratory`, không được trình bày như confirmatory
evidence.

Muốn có confirmatory evidence, người dùng phải tạo prediction rồi replicate.
Lần chạy mới là một record độc lập; lịch sử exploratory không bị viết lại.

## D-004 — Run validity tách khỏi link status

Trạng thái: **đã chấp nhận**.

Một run có thể hợp lệ, không hợp lệ hoặc chưa chắc. Đây là thuộc tính của run,
không phải trạng thái của evidence link.

- Link vẫn chỉ có `holds | weak | missing`.
- Một run invalid không hỗ trợ và cũng không phản bác claim.
- Implementation failure phải được phân biệt với research failure.

## D-005 — Cho thấy các literature đang tách biệt

Trạng thái: **đã chấp nhận**.

App có thể cho người dùng thấy các note hoặc cluster chưa có cầu nối cấu trúc.
App không được tự viết cầu nối, sinh câu hỏi hay đề xuất sự kết hợp.

Mục tiêu là giúp người dùng nhìn rộng và sâu hơn bằng cách làm sự vắng mặt trở
nên nhìn thấy được.

## D-006 — App giải thích việc từ chối đến đâu?

Trạng thái: **đã chấp nhận — mức 2, giải thích cấu trúc**.

Khi một input không qua gate, app:

- App gọi tên hình dạng lỗi bằng từ vựng cố định, ví dụ `topic`,
  `technology stack`, `quá rộng`, `không khả sai`, `thiếu target`.
- App nói rõ thành phần cấu trúc nào còn thiếu, không đánh giá nội dung nghiên
  cứu là hay hoặc dở.
- App hiển thị lại các note liên quan do chính người dùng đã viết.
- App có thể hỏi các câu chẩn đoán cố định như “Điều gì trong câu này có thể
  sai?” hoặc “Kết quả nào sẽ bác bỏ nó?”. Đây không phải research question.
- Sau đó app dừng. Nó không hoàn thành câu, không viết lại thành question,
  không tạo claim và không đề xuất cầu nối.

App không im lặng chỉ disable action, vì như vậy người dùng không hiểu mình đang
vướng ở đâu. App cũng không gợi ý cách sửa nội dung, vì như vậy model bắt đầu
viết research question thay người dùng.

Từ vựng từ chối phải đóng và ổn định. Copy không được chứa ví dụ hoàn thành câu
dựa trên topic hiện tại. Mục tiêu là giúp người dùng thấy **hình dạng của lỗi**,
không giúp họ viết một câu vừa đủ để qua gate.

## D-007 — Research OS hỗ trợ theoretical evidence

Trạng thái: **đã chấp nhận — biểu diễn theo hai trục độc lập**.

Research OS không chỉ phục vụ empirical research. Nó phải có khả năng biểu diễn
evidence do người dùng tạo ra từ reasoning lý thuyết, gồm proof, derivation,
counterexample, bound hoặc consistency analysis.

- **Proof** là một chứng minh logic/toán học rằng kết luận theo sau từ các giả
  định.
- **Derivation** là chuỗi suy dẫn hoặc biến đổi để đi từ giả định/phương trình
  tới một kết quả; nó không nhất thiết đạt mức formal proof.
- Theoretical evidence vẫn phải ghi rõ assumptions, scope, target và quan hệ
  với claim.
- Hỗ trợ loại evidence này không có nghĩa assistant được tự chứng minh theorem
  hoặc tuyên bố proof đúng.

Evidence không còn được hiểu bằng một trường `kind` đang trộn hai khái niệm.
Thiết kế tương lai phải tách:

1. **Origin — evidence đến từ đâu:** literature, experiment hoặc reasoning của
   người dùng.
2. **Form — evidence hỗ trợ hoặc phản bác claim bằng cách nào:** measurement,
   derivation/entailment, counterexample hoặc dạng khác được chứng minh là cần.

Hai trục độc lập giải quyết các trường hợp mà một enum chung không diễn đạt
được:

- Proof đọc trong paper: `origin = literature`, `form = derivation`.
- Kết quả benchmark của người dùng: `origin = experiment`, `form = measurement`.
- Counterexample tự xây dựng: `origin = own_reasoning`, `form = counterexample`.
- Counterexample quan sát được khi chạy: `origin = experiment`,
  `form = counterexample`.

Các trường bắt buộc được suy ra từ cả hai trục:

- Origin literature cần citation và passage/source reference.
- Origin experiment cần run, artifact, observation và validity.
- Form derivation cần assumptions, nội dung suy dẫn và scope.
- Form counterexample cần trường hợp cụ thể và claim tổng quát mà nó thách thức.

Nguyên tắc hai trục được chốt tại đây. Vocabulary tối thiểu và thay đổi công
khai trong brief được chốt sau đó tại D-008. Không biến taxonomy research trong
`docs/research-forms.md` thành enum.

## C-001 — Sửa sai lệch trong cách mô tả research

Trạng thái: **đã ghi nhận**.

Case LLM + PECT chỉ là một ví dụ về research dạng chuyển giao hoặc kết hợp. Nó
không phải workflow chuẩn cho mọi nghiên cứu.

Research còn có thể là:

- Thiết kế thuật toán hoặc phương pháp mới.
- Áp dụng một phương pháp từ domain này sang domain khác.
- Xây dựng mô hình xuất phát từ toán học hoặc lý thuyết.
- Đo đạc hoặc mô tả một hiện tượng.
- So sánh thực nghiệm.
- Replication hoặc phản bác kết quả cũ.
- Xây benchmark hoặc measurement instrument.

`QUESTION → CLAIM → EVIDENCE` vẫn có tính khái quát cao. Prototype ban đầu dùng
`EVIDENCE.kind = paper | experiment`, thiên về nghiên cứu thực nghiệm và không
biểu diễn đúng proof, derivation hoặc counterexample do người dùng tạo. D-007
và D-008 đã thay mô hình đó bằng hai trục `origin` và `form`.

## D-008 — Vocabulary tối thiểu cho evidence

Trạng thái: **đã chấp nhận**.

Evidence dùng hai trục với vocabulary tối thiểu:

- `origin = literature | experiment | own_reasoning`
- `form = measurement | derivation | counterexample`

Mục đích của hai trường là giúp app hiển thị đúng provenance, các trường liên
quan và context cho cả người dùng lẫn assistant. Chúng không phải taxonomy đầy
đủ của research, không quyết định evidence có hợp lệ hay không và không tự đặt
link status.

Không thêm `other`, `theory`, subtype chi tiết hoặc giá trị dự phòng. Một giá trị
mới chỉ được thêm khi xuất hiện evidence thật không thể biểu diễn bằng bộ hiện
tại mà không làm mất thông tin. Khi đó schema được version thay vì đoán trước.

Ví dụ:

- Finding định lượng từ paper: `literature + measurement`.
- Proof đọc trong paper: `literature + derivation`.
- Benchmark do người dùng chạy: `experiment + measurement`.
- Counterexample tìm thấy khi chạy: `experiment + counterexample`.
- Derivation do người dùng viết: `own_reasoning + derivation`.

Quyết định này sửa xung đột giữa D-007 và `AGENTS.md` cũ, nơi evidence chỉ có
`kind = paper | experiment`. Cách đánh giá validity của proof/derivation được
chốt sau đó tại D-009.

## D-009 — Derivation validity tách khỏi link status

Trạng thái: **đã chấp nhận**.

Một derivation có hai câu hỏi độc lập:

1. Bản thân derivation có hợp lệ không?
2. Nếu hợp lệ, kết luận của nó có hỗ trợ đúng claim không?

Validity thuộc về evidence derivation:

- `validity = unassessed | valid | invalid | uncertain`
- `validity_reason` bắt buộc trừ khi validity là `unassessed`

Chỉ người dùng được đặt hoặc thay đổi validity. Mỗi thay đổi tạo version mới,
không overwrite. Derivation `invalid` không hỗ trợ và cũng không phản bác claim,
nhưng vẫn được giữ trong lịch sử.

Link status vẫn thuộc về quan hệ derivation→claim. Assistant chỉ check quan hệ
theo cách có điều kiện: **nếu derivation hợp lệ**, conclusion, scope và target
của nó có hỗ trợ claim không? Assistant có thể chỉ ra assumption hoặc scope
không xuất hiện trong claim, nhưng không được đặt validity hay tuyên bố proof
hoặc derivation đúng.

App phải trình bày validity và relation-to-claim thành hai khối thông tin riêng,
để `unassessed` không bị hiểu thành link `weak`, và link `holds` không bị hiểu
thành assistant đã xác minh proof.

## D-010 — Artifact identity sống lâu hơn path

Trạng thái: **đã chấp nhận**.

Một artifact bên ngoài có ba khái niệm riêng:

- `artifact_id`: identity của record trong Instrument.
- `content_hash`: SHA-256 của chính xác nội dung file.
- `relative_path`: locator hiện tại tính từ workspace root.

Artifact còn ghi `run_id`, media type và creation time. File bytes tiếp tục sống
trong workspace và không được copy vào SQLite.

Nếu file đổi chỗ nhưng hash không đổi, nó vẫn là cùng artifact và app thêm một
locator version mới. Nếu bytes đổi, kể cả ở cùng path, đó là artifact mới;
observation cũ không bao giờ tự chuyển sang nội dung mới. Nếu file bị xóa,
metadata, locator history, provenance và observation vẫn được giữ. Một file
được nối lại với artifact cũ chỉ khi hash khớp.

Artifact được xem là một record nội dung bất biến. Phiên bản đầu chỉ hỗ trợ một
file cho mỗi artifact, không hash thư mục hoặc dataset. Filename/path không phải
identity; content hash nhận diện và kiểm tra exact bytes nhưng không thay thế
`artifact_id` làm database primary key.

## D-011 — Migration giữ assertion, không đoán dữ liệu thiếu

Trạng thái: **đã chấp nhận**.

Migration từ Markdown/JSON prototype sang SQLite tuân theo ba luật:

1. Dữ liệu không có thì để empty. Cụ thể, evidence `kind = paper` chuyển được
   thành `origin = literature`, nhưng `form` không được đoán; app hiển thị nó là
   không có giá trị cho đến khi người dùng điền.
2. Nội dung không thể tái tạo do người dùng viết, đặc biệt `user_reason`, được
   giữ nguyên. Import tạo system history event; nó không bịa lý do thay đổi và
   không biến nội dung người dùng thành nội dung system.
3. Legacy check có hình dạng AI output nhưng thiếu model id được giữ như một
   historical imported model output, đóng băng và gắn `model:unknown`. Nó không
   phải check hiện hành, không được dịch cưỡng bức từ verdict schema cũ sang
   schema mới và không được đóng dấu model hiện tại. Link sau import ở trạng
   thái chưa có check theo schema mới.

Mọi authored content và history record phân biệt provenance `user`, `system`
hoặc `model:<id>`. `model:unknown` chỉ dùng khi biết nội dung là model-produced
nhưng không biết model cụ thể. Mục tiêu là để bộ lọc "chỉ những gì tôi khẳng
định" luôn trung thực.

## D-012 — GUI ưu tiên bản đồ và link

Trạng thái: **đã chấp nhận — hướng thiết kế ban đầu, chưa implement**.

Các tên GRAPH, DETAIL, SURVEY, PAPERS và EXPERIMENTS mô tả công việc mà giao diện
phải hỗ trợ, không bắt buộc là năm tab riêng. GUI ưu tiên cấu trúc trực quan hơn
text/table, nhưng không hy sinh tính ổn định hoặc model boundary.

### Argument map

GRAPH và DETAIL hợp thành một không gian zoom liên tục:

```text
Toàn cảnh → thấy hình dạng và link status
Zoom vừa  → đọc question và claim
Zoom gần  → xem evidence, user_reason và link check
```

Layout deterministic với orthogonal edges; không dùng force-directed physics.
Node gần grayscale và phân cấp bằng kích thước/weight. Chỉ link mang màu status,
vì link là sản phẩm. Link `weak` và `missing` nặng hơn link `holds`; argument
khỏe trông yên tĩnh, chỗ hỏng tự nổi lên. Link selectable và mở working view.
Ghost là đường viền đứt, không nền, để trông như absence chứ không như node.

### Survey

Open-problem notes và candidate groups sống trong cùng một spatial field.
Candidate hiển thị như boundary quanh accepted cluster thay vì một cột tách rời.
Cluster không có cầu nối được để cách nhau; app làm absence nhìn thấy nhưng
không sinh cầu nối. Vị trí đủ ổn định để người dùng xây mental map.

### Assistant dock

Dock toàn cục nằm bên phải, toggle và resize được. Node, link, paper passage,
experiment và artifact có thể được kéo vào để tạo explicit context. Drop không
mở rộng quyền của assistant. Link là drag gesture chính: có `user_reason` thì
có thể chạy Type/Scope/Target check; thiếu reason thì hiển thị empty và từ chối.

Prompt chỉ giải thích việc từ chối. Enforcement nằm ở UI/API/domain tool schema:
không expose writable `user_reason`, promotion decision, observation hoặc
derivation validity cho model. Unsupported object combinations không tự tạo
capability mới.

Papers và Experiments vẫn là surface riêng vì đọc PDF và xem raw artifact không
phải công việc phù hợp trên argument canvas. Navigation, microinteraction và
visual tokens cụ thể được chốt sau đó tại D-013.

## D-013 — Visual system và interaction model

Trạng thái: **đã chấp nhận — chi tiết trong `docs/gui-design.md`**.

Người dùng giao các quyết định thị giác/tương tác cho agent, giữ lại quyền quyết
định về hành vi nghiên cứu. Các điểm chốt:

- Giữ palette và hệ ba giọng chữ đã có trong `src/index.css` và
  `src/components/ui/instrument.tsx`. Không thêm hue mới.
- Ba màu status chỉ dùng cho link. Tầng cây đọc bằng kích thước chữ, không bằng
  màu, nên vẫn hiểu được khi in trắng đen hoặc với người mù màu.
- Link `holds` mảnh và nhạt; `weak` và `missing` đậm hơn; chưa check là nét chấm
  màu trung tính. Trạng thái chưa check không được trông giống `weak`.
- Semantic zoom ba mức `SHAPE / STRUCTURE / WORKING` trên cùng một layout
  deterministic. Zoom đổi chi tiết, không đổi vị trí.
- Working view xếp theo thứ tự nhận thức: `user_reason` trước, model finding sau.
- Node/edge không kéo được để đổi vị trí; drag chỉ để đưa object vào dock, bắt
  đầu từ grip riêng.
- Motion budget cả app là ba chuyển động, tổng ≤ 160ms mỗi cái.
- Copy mô tả cấu trúc còn thiếu, không khen, không xin lỗi, không đưa ví dụ
  hoàn thành câu theo topic.

Ranh giới phân quyền: agent tự quyết token, spacing, layout, tên bảng và
component. Agent phải hỏi khi một quyết định làm đổi quyền của assistant, thứ
người dùng buộc phải viết, ý nghĩa của một thông tin, vị trí friction, lịch sử
được giữ, hoặc khi một màu/từ vựng đang mang nghĩa cố định bị dùng lại cho việc
khác.

## D-014 — Storage schema và migration

Trạng thái: **đã chấp nhận — chi tiết trong `docs/storage-design.md`**.

Một file SQLite cho mỗi workspace, tại `.instrument/instrument.sqlite`. Nội dung
suy luận là append-only; không UPDATE, không DELETE.

- Nội dung sống trong bảng version: question, claim, evidence, link, observation,
  experiment, derivation validity, run validity. "Current" là hàng mới nhất suy
  ra qua view, không phải pointer có thể bị ghi đè.
- Link tách thành `claim_links` và `evidence_links` để foreign key thật chỉ cho
  phép `QUESTION → CLAIM` và `CLAIM → EVIDENCE`. Không dùng bảng polymorphic.
- `user_reason` là NOT NULL trên link version. Đây là enforcement ở tầng thấp
  nhất, không chỉ ở UI.
- `check_runs` trỏ vào một link **version** cụ thể, nên sửa reason tự động làm
  check cũ hết hiệu lực; bỏ hẳn cờ `isStale`.
- Reject là `claim_status_versions`, không phải cột bị ghi đè và không phải
  DELETE. Tag và candidate membership là event `add | remove`.
- Experiment trỏ vào claim **version** mà nó định test, để claim đổi về sau không
  làm lịch sử trông như experiment đã test câu khác.
- `origin` và `form` nằm trên evidence version, cho phép NULL, kèm bảng
  form-specific bắt buộc thay vì JSON blob.
- Artifact theo D-010: metadata trong DB, bytes ở workspace, locator có lịch sử
  `present | missing`.
- Không có bảng ghost, bảng project, bảng toạ độ layout, hay bảng nào cho model
  ghi trực tiếp. FTS là derived index và mặc định chỉ tìm nội dung do user viết.

Migration chạy một lần trong một transaction theo D-011: giữ `user_reason`, để
`form` NULL, prose/reason giữ `author = 'user'`, còn import operation được ghi
riêng là `system`. Check cũ vào `imported_notes` với `model:unknown`. Link file
thiếu `user_reason` làm migration dừng với lỗi. Experiment fixture không được
migrate.

## D-015 — Chỉ xây Research OS

Trạng thái: **đã chấp nhận**.

Instrument hiện là một sản phẩm duy nhất: Research OS. Không xây launcher,
plugin architecture, instrument switcher, schema tổng quát cho nhiều loại công
việc, hay app khác dùng chung shell.

Abstraction cho một platform chưa tồn tại sẽ làm chậm việc kiểm chứng core loop
và dễ biến workspace thành project container bằng cửa sau. Chỉ xem lại quyết
định này sau khi một workspace đã đi trọn một research cycle với SQLite,
versioning, đầy đủ gate và assistant evals.

## D-016 — Build theo lát dọc, không rewrite

Trạng thái: **đã chấp nhận — chưa bắt đầu implement**.

Giữ những phần prototype đã đúng hướng:

- palette và ba giọng typography trong `src/index.css` và
  `src/components/ui/instrument.tsx`;
- deterministic map layout và orthogonal connections;
- paper reader foundation;
- assistant server boundary, pinned model và isolated context threads.

Refactor hoặc thay thế những phần đang cản trở:

- `src/types.ts` prototype shape;
- `src/App.tsx` monolith và session-local state;
- status/card visuals không còn khớp link-first design;
- hardcoded experiment fixtures và legacy five-value check shape.

Thứ tự implementation:

```text
0. Tạo assistant eval runner và ghi baseline trước mọi prompt/tool change
1. Domain types + SQLite foundation + one-shot migration
2. Read-only Map chạy từ SQLite
3. Link selection + bottom inspector + visual tokens D-013
4. Dock drag context + strict domain tools
5. Survey persistence và các gate promotion/15-note stop
6. Papers evidence capture với required user_reason
7. Experiments → run → artifact → observation
8. Bỏ fixtures, kiểm tra toàn research cycle
```

Mỗi bước giữ app chạy được và có test ở boundary vừa thay. Không có big-bang
rewrite và không đổi prompt ở bước 0; prompt chỉ được sửa sau khi baseline đã
được ghi theo hash của prompt file.
