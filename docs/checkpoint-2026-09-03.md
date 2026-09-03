# Checkpoint thiết kế — 2026-09-03

Phiên khám phá này dừng tại đây. Không có code, schema hay GUI nào được chốt hoặc
implement từ các tài liệu này.

## Quan điểm sản phẩm đã giữ lại

- AI là tool for thought, không phải assistant làm việc thay người dùng.
- Mục tiêu là hiểu công việc và nâng chất lượng, không tối đa tốc độ.
- App giúp người dùng tìm đúng câu hỏi thay vì sinh câu trả lời nhanh.
- Tự động hóa phần đã biết; giữ phán đoán về phần chưa biết cho người dùng.
- App làm cấu trúc, điểm yếu và sự vắng mặt nhìn thấy được; người dùng viết nội
  dung nghiên cứu.

## Quyết định đã chốt

- Infrastructure không phải evidence; experiment có thể tham chiếu
  infrastructure bên ngoài graph.
- Confirmatory evidence cần pre-run contract.
- Post-hoc evidence được giữ với nhãn `exploratory` và cần predicted replication
  để có confirmatory evidence.
- Run validity tách khỏi link status.
- App có thể cho thấy các literature/cluster tách biệt nhưng không sinh cầu nối.
- Khi từ chối, app giải thích hình dạng lỗi nhưng không viết nội dung thay người
  dùng.
- Research OS hỗ trợ empirical và theoretical evidence.
- Evidence được hiểu theo hai trục độc lập: nguồn gốc (`origin`) và cách hỗ
  trợ/phản bác (`form`).
- Vocabulary tối thiểu đã chốt: `origin = literature | experiment |
  own_reasoning`; `form = measurement | derivation | counterexample`.
- Hai trục chỉ phục vụ hiển thị, provenance và context cho user/assistant;
  chúng không tự quyết định validity hoặc link status.
- Derivation validity tách khỏi link status; chỉ người dùng đặt validity, còn
  assistant chỉ check quan hệ với claim theo điều kiện "nếu derivation hợp lệ".
- Artifact là record nội dung bất biến: `artifact_id` là identity trong app,
  SHA-256 nhận diện exact bytes, còn workspace-relative path chỉ là locator có
  lịch sử.
- Migration không đoán dữ liệu thiếu: evidence `form` cũ hiển thị empty;
  `user_reason` được giữ; legacy AI checks được đóng băng và gắn
  `model:unknown`, không xem là check hiện hành.
- Authored content và history phân biệt `user`, `system` và `model:<id>` để có
  thể lọc trung thực những gì người dùng tự khẳng định.
- Hướng GUI ban đầu ưu tiên spatial map: GRAPH và DETAIL hợp thành canvas zoom
  liên tục; node gần grayscale, link mang status và visual weight; Survey dùng
  note field với cluster boundaries; Papers/Experiments là surface riêng.
- Assistant dock toàn cục ở bên phải, toggle/resize được và nhận research object
  bằng drag-drop. Prompt giải thích refusal; UI/API/tool schema mới là enforcement.
- Visual system và interaction model chốt tại `docs/gui-design.md`: giữ palette
  và hệ ba giọng chữ, status chỉ nằm trên link, semantic zoom ba mức, motion
  budget tối thiểu.
- Storage schema và migration chốt tại `docs/storage-design.md`: append-only
  version tables, link tách theo loại với `user_reason` NOT NULL, check gắn vào
  link version, artifact metadata theo D-010.
- Phân quyền quyết định: agent tự chốt token, layout, tên bảng và component;
  chỉ hỏi khi ảnh hưởng hành vi nghiên cứu, friction, ý nghĩa dữ liệu hoặc quyền
  của assistant.
- Phạm vi sản phẩm chỉ có Research OS; không xây platform hoặc instrument khác
  trước khi core loop chạy end-to-end với SQLite và evals.
- Implementation sẽ refactor theo lát dọc, giữ palette/typography/map layout/
  reader/assistant boundary; không rewrite toàn bộ. Thứ tự chi tiết ở D-016.

## Không còn quyết định thiết kế chặn build

Package, tên cột DDL, component boundary và các chi tiết tương đương được agent
quyết định khi implement, miễn không đổi semantic boundary đã chốt. Nếu một chi
tiết kỹ thuật làm thay đổi friction, lịch sử, ý nghĩa dữ liệu hoặc quyền của
assistant, nó quay lại thành quyết định sản phẩm và phải được nói rõ.

## Tài liệu nền

- `docs/decisions.md` — nhật ký quyết định.
- `docs/gui-design.md` — visual system và interaction model.
- `docs/storage-design.md` — bảng SQLite và migration.
- `docs/research-forms.md` — các hình thức research và failure modes.
- `docs/research-trace.md` — trace case LLM + PECT, không phải workflow phổ quát.
- `docs/gate-map.md` — các gate đã nhận diện.

## Ranh giới checkpoint

Prototype hiện tại vẫn chỉ là draft để suy nghĩ. Không được suy ngược từ GUI
hiện tại rằng product cuối cùng phải có cùng tab, pane, card, route hoặc workflow
trực quan.

Phiên sau phải bắt đầu bằng cách đọc checkpoint này và chọn **một vấn đề còn
mở**, không nhảy thẳng vào build.
