# Storage design — bảng và migration

Trạng thái: **đã chốt hướng, chưa implement**. Chốt tại D-014.
`AGENTS.md` vẫn là tài liệu có thẩm quyền cao nhất.

Tài liệu này mô tả các bảng ở mức khái niệm. DDL thật, tên cột chi tiết và index
cụ thể được viết khi implement và không cần người dùng duyệt.

## Nguyên tắc

> Lịch sử là sản phẩm. Không có UPDATE trên nội dung suy luận.

Ba luật chi phối toàn bộ schema:

1. Nội dung người dùng khẳng định thì **append**, không sửa đè. Đổi ý là một
   hàng mới kèm lý do.
2. Mọi hàng nội dung ghi rõ tác giả: `user`, `system` hoặc `model:<id>`.
3. Cái tái tạo được sống ngoài workspace; cái mất là mất vĩnh viễn sống trong DB.

Một file SQLite cho mỗi workspace folder, mở một lúc một cái.

Vị trí được chốt là `.instrument/instrument.sqlite` dưới workspace root. ID là
opaque text do app tạo; thời gian lưu UTC milliseconds. Khi implement, bật
foreign keys, transaction cho mọi application operation và chế độ journal mặc
định một-file phù hợp với app local single-user.

## Các nhóm bảng

### Cây lập luận

```text
questions          id, created_at
question_versions  question_id, text, reason, author, created_at
question_tag_events
                   question_id, tag, action, author, created_at
claims             id, created_at
claim_versions     claim_id, text, reason, author, created_at
claim_status_versions
                   claim_id, state, reason, author, created_at
evidence           id, created_at
evidence_versions  evidence_id, text, origin, form, citation, source_ref,
                   reason, author, created_at
```

`origin` và `form` nằm trên `evidence_versions` vì chúng là điều người dùng
khẳng định về evidence, và một lần sửa phân loại cũng là một lần đổi ý. Cả hai
cho phép NULL, vì D-011 nói dữ liệu không biết thì để trống chứ không đoán. UI
hiển thị NULL là "không có", không phải một giá trị mặc định.

`claim_status_versions.state` là `active | rejected`. Reject là một version có
lý do, không phải cột bị ghi đè, và không bao giờ là DELETE. Trạng thái hiện tại
của claim là version mới nhất.

`question_tag_events.action` là `add | remove`; current tags được suy ra từ event
mới nhất cho mỗi string. Không có bảng tag và không rename cascade.

### Link

```text
claim_links          id, claim_id, created_at
claim_link_versions  link_id, question_id, user_reason, reason, author, created_at
evidence_links       id, evidence_id, created_at
evidence_link_versions
                     link_id, claim_id, user_reason, reason, author, created_at
```

Tách hai loại link để SQLite có foreign key thật và chỉ cho phép hai quan hệ
`QUESTION → CLAIM` và `CLAIM → EVIDENCE`. Không dùng bảng polymorphic
`parent_type/child_type`, vì nó làm strict tree chỉ còn là convention của code.

Mỗi child có đúng một base link. Parent hiện tại nằm trên link version; move là
một version mới với parent và reason mới. Đây là giả định 1 trong `AGENTS.md`
§7: position nghĩa là chỗ trong cây, không phải toạ độ canvas.

`user_reason` **NOT NULL** trong cả hai bảng link version. Đây là chỗ enforcement
nằm ở tầng thấp nhất: một link không reason không tạo được version, nên không tồn
tại ở trạng thái có thể check. API và tool schema không được có đường vòng.

`author` trên link version luôn là `user`. Khi model thực hiện một move theo chỉ
thị, structured operation được dán nhãn model, nhưng parent và reason vẫn là cam
kết do user cung cấp.

### Check

```text
check_runs        id, claim_link_version_id hoặc evidence_link_version_id,
                  model_id, status, finding, created_at
check_verdicts    check_run_id, axis, verdict
```

- `axis` là `type | scope | target`; `verdict` là `pass | partial | mismatch`.
- Đúng một trong hai foreign key link-version phải có giá trị. Check trỏ vào
  **một version cụ thể**, không phải base link. Khi người dùng sửa
  reason, một version mới ra đời và check cũ tự động không còn áp dụng — không
  cần cờ `isStale` thủ công như prototype.
- `model_id` NOT NULL. Check chỉ tồn tại khi biết ai tạo ra nó.
- `status` là `holds | weak | missing`; nếu chưa có check cho current link
  version thì UI hiển thị "chưa check", không lưu một status thứ tư.

### Legacy import

```text
import_batches  id, source_root, started_at, completed_at, author
imported_notes  id, subject_type, subject_id, body, author, imported_at
```

Theo D-011, check cũ của prototype vào đây với `author = 'model:unknown'`. Chúng
là ghi chú lịch sử đóng băng, không phải `check_runs`, và không bị dịch cưỡng bức
từ 5 verdict cũ sang 3 verdict mới.

Các version được import giữ tác giả của nội dung: prose và `user_reason` thuộc
`user`; import operation thuộc `system` trong `import_batches`. Không gắn
`author = system` lên nội dung của user chỉ vì app đã copy nó vào DB.

### Theoretical evidence

```text
derivation_details
  evidence_version_id, assumptions, derivation_body, conclusion, scope
counterexample_details
  evidence_version_id, concrete_case, challenged_scope
measurement_details
  evidence_version_id, target, method, scope
derivation_validity_versions
  evidence_version_id, validity, validity_reason, author, created_at
```

`validity` là `unassessed | valid | invalid | uncertain`. `validity_reason` bắt
buộc trừ khi `unassessed`. `author` luôn là `user`; không có đường nào cho model
ghi vào bảng này.

Form-specific row bắt buộc theo `form`: derivation cần assumptions/body/
conclusion/scope; counterexample cần case và scope bị thách thức; measurement
cần target và scope. API validate tổ hợp; không dùng một JSON blob để né schema.

### Literature

```text
papers                       id, title, authors, year, citation, created_at
paper_passages               id, paper_id, locator, content_hash
evidence_literature_sources  evidence_version_id, paper_id, passage_id, citation
```

Một paper không phải evidence. Bảng source chỉ nối một **finding version** với
paper/passage đã sinh ra nó. Một paper có thể sinh nhiều evidence và một passage
có thể liên quan nhiều finding khác nhau.

### Experiment và run

```text
experiments        id, created_at
experiment_versions
                   experiment_id, claim_version_id, status, intent_type,
                   target, reason, author, created_at
prerun_contracts   experiment_version_id, target_metric, baseline,
                   expected_result, weakening_condition, validity_condition,
                   scope, author, created_at
runs               id, experiment_version_id, provenance,
                   code_revision, dataset_version, config, seed,
                   started_at, finished_at
run_validity_versions
                   run_id, validity, validity_reason, author, created_at
evidence_experiment_sources
                   evidence_version_id, run_id, artifact_id, observation_id
```

- `provenance` là `exploratory | confirmatory` theo D-003. Chỉ run có pre-run
  contract mới được `confirmatory`.
- `validity` là `valid | invalid | uncertain` theo D-004, tách hẳn khỏi link
  status và không bao giờ tự động đổi link status.
- Experiment trỏ vào **claim version** mà nó định test, không phải current claim.
  Claim đổi sau run không được làm lịch sử trông như experiment đã test câu mới.
- `intent_type` là `probe | infrastructure`. Infrastructure vẫn không phải
  evidence; nó chỉ mô tả mục tiêu của experiment intent theo D-001.
- Evidence origin `experiment` chỉ tồn tại sau khi có run, artifact và user
  observation; planned experiment tự nó chưa phải finding.

### Artifact

```text
artifacts           id, run_id, content_hash, media_type, created_at
artifact_locators   artifact_id, relative_path, state, observed_at
observations        id, artifact_id, created_at
observation_versions
                    observation_id, body, reason, author, created_at
```

Theo D-010: bytes ở lại workspace, DB chỉ giữ metadata. Cùng hash mà khác path
thì thêm một locator, không sửa hàng cũ. Khác hash là artifact mới, và
observation cũ không đi theo. Xóa file không xóa `artifacts` hay `observations`.

`artifact_locators.state` là `present | missing`, và mỗi lần app quan sát khác
trước thì ghi thêm một hàng. Lịch sử vị trí không bị overwrite, nên "file từng ở
đây" vẫn trả lời được. Observation content nằm trong version; sửa cách diễn giải
là một hàng mới, vì đó là một lần đổi ý về ý nghĩa của kết quả.

`observation_versions.author` luôn là `user`. Model không có đường ghi vào bảng
này.

### Survey

```text
open_problems      id, body, source, created_at, created_by
candidates         id, body, created_at
candidate_member_events
                   candidate_id, open_problem_id, action, author, created_at
promotions         candidate_id, question_id, promoted_at
```

`candidate_member_events.action` là `add | remove`. Mốc 15 note đếm số
`open_problems` không có membership hiện hành, theo giả định 3 trong `AGENTS.md`
§7. Promotion một chiều; không có event demote.

`candidates` do người dùng nhận, nhưng một grouping có thể bắt nguồn từ đề xuất
của model, nên bảng này ghi cả `proposed_by` để phân biệt cluster người dùng tự
gom với cluster model đề xuất và người dùng đã accept.

### Assistant

```text
threads    id, context_kind, context_id, created_at
messages   thread_id, sender, body, model_id, created_at
thread_context_items
           thread_id, object_type, object_id
operations id, operation_type, actor, payload, created_at, undoes_operation_id
```

Thread tách theo context và không bao giờ nối chéo.

`operations` là audit log cho add/move/rename/split/delete và Undo. Payload chỉ
chứa domain operation đã validate; model không viết storage trực tiếp.

## Current views và search

Các bảng version không có mutable `current_version_id`. "Current" được suy ra
từ hàng mới nhất theo `(created_at, id)`, qua SQL view. Như vậy không có pointer
bị overwrite làm mất lịch sử.

FTS search là derived index, không phải source of truth. Nó index current
question, claim, evidence, `user_reason` và observation do user viết. Model
output không xuất hiện trong search mặc định; người dùng có thể bật filter riêng
để tìm trong transcript/check history.

## Migration từ workspace prototype

Chạy một lần, theo D-011.

```text
questions/*.md + .json   → questions, question_versions v1,
                           question_tag_events (action='add')
claims/*.md    + .json   → claims, claim_versions v1,
                           claim_status_versions v1
evidence/*.md  + .json   → evidence, evidence_versions v1
                           (origin='literature', form=NULL)
links/q*--c*.json        → claim_links + claim_link_versions v1
links/c*--e*.json        → evidence_links + evidence_link_versions v1
links/*.json .check      → imported_notes, author='model:unknown'
survey/open-problems/*   → open_problems
survey/candidate-*/*     → candidates + candidate_member_events
papers/*                 → paper records; passage marks không tạo link
```

Quy tắc:

- `kind: paper` → `origin = literature`. `form` để NULL, người dùng tự điền.
- `user_reason` chuyển nguyên văn, `author = 'user'`.
- Version đầu tiên của prose/reason có `author = 'user'`; `import_batch_id` ghi
  nó đến từ lần import nào. Initial version không cần change reason vì chưa có
  lần đổi ý nào.
- `rejected: true` trong `claims/*.json` → một hàng `claim_status_versions` với
  `state = 'rejected'`, `author = 'system'`, lý do ghi rõ là giá trị được import.
- `linked_claim_id` trong paper metadata là con trỏ passage của reader, không
  phải link trong cây, nên không tạo `links`.
- `status` trên link file cũ (`holds | weak | missing`) là kết quả của check cũ,
  không phải cam kết của người dùng. Nó **không** được nhập như check hiện hành;
  nó đi cùng `imported_notes`. Sau migration link ở trạng thái chưa check.
- Migration chạy trong một transaction. Bất kỳ link file nào thiếu `user_reason`
  làm migration dừng với lỗi, không im lặng bỏ qua và không tự điền.
- Check cũ **không** vào `check_runs`. Sau migration mọi link ở trạng thái chưa
  check theo schema mới.
- `tag`, `tag_color`, `placeholderText`, `isEmpty` bị bỏ; chúng là cosmetic của
  prototype.
- Experiment hiện là fixture hardcode nên không migrate. `experiments`, `runs`,
  `artifacts` khởi tạo rỗng.

Migration không được tạo ra bất kỳ nội dung nghiên cứu nào mà file gốc không có.

## Ghost

Không có bảng ghost. Ghost được suy ra khi query: claim không có evidence, hoặc
question không có claim. Nó là cách vẽ sự vắng mặt, không phải dữ liệu.

## Điều schema này cố tình không hỗ trợ

- Không xóa cứng nội dung suy luận. Reject là cờ, không phải DELETE.
- Không có bảng project. Tag là cách nhóm duy nhất.
- Không có truy vấn xuyên workspace.
- Không có bảng nào cho model ghi trực tiếp; mọi thay đổi đi qua application
  operation có confirmation và Undo.
- Không có bảng `positions` cho toạ độ layout. Layout là deterministic; "position"
  trong rule 4 nghĩa là chỗ của node trong cây.
