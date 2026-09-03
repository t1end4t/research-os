# Gate Map v0.2 — Nơi Instrument chặn người dùng lại

Trạng thái: **bản nháp khám phá**. Rút ra từ `docs/research-trace.md`.
`AGENTS.md` vẫn là tài liệu có thẩm quyền cao nhất.

**Gate** là điểm chuyển tiếp mà người dùng không được đi qua miễn phí. Mỗi gate
ghi rõ: cần gì, ai viết, assistant được check gì, app từ chối gì.

Hai nguyên tắc bao trùm:

1. **Người dùng viết mọi cam kết.** Assistant không bao giờ viết thứ mà người
   dùng sẽ bị đánh giá.
2. **Friction là cơ chế, không phải lỗi.** Bỏ một gate để tiết kiệm thời gian là
   bỏ luôn lý do tồn tại của tool.

Ký hiệu: **[E]** đã được `AGENTS.md` quy định · **[D]** đã chốt trong
`docs/decisions.md` · **[P]** còn mở.

Các gate không phụ thuộc vào hình thức research. Cái thay đổi theo hình thức là
claim trông thế nào và cái gì được tính là evidence — xem
`docs/research-forms.md`.

## Spine

```text
Loose note → Candidate → Question → Claim → Evidence
           → Experiment intent → Run → Artifact → Observation → Revision
```

---

## Gate 1 — Đọc → Note

**Chuyển tiếp:** một phiên đọc trở thành record lâu dài.

| | |
|---|---|
| Bắt buộc | Một dòng "điều gì còn mở ở đây?" kèm nguồn |
| Ai viết | Người dùng |
| Assistant được | Trả lời câu hỏi về paper đang mở |
| App từ chối | Tóm tắt paper **[E]**; lưu phiên đọc không tạo node **[E]** |

Một phiên đọc không tạo ra node thì chưa tạo ra gì.

---

## Gate 2 — Notes → Candidate

**Chuyển tiếp:** các note rời rạc thành một nhóm được đề xuất.

| | |
|---|---|
| Bắt buộc | Dưới 15 note chưa cluster, hoặc đã có 3+ candidate **[E]** |
| Ai viết | Người dùng accept/reject; assistant có thể đề xuất cluster **[E]** |
| Assistant được | Chỉ cluster các note đã tồn tại |
| App từ chối | Thêm note khi đã chạm stop; mọi override flag **[E]** |

**Đã chốt [D-005].** App có thể cho thấy các cluster đang tách biệt và nói
"chưa có note nào nối hai nhóm này". App không được viết cầu nối, không sinh
question kết hợp. Chỉ làm sự vắng mặt nhìn thấy được.

---

## Gate 3 — Candidate → Question

**Chuyển tiếp:** một nhóm trở thành QUESTION thật. **Một chiều, không demote [E]**

| | |
|---|---|
| Bắt buộc | Claim trả lời nó, xác nhận khả sai, xác nhận giải quyết được trong một năm **[E]** |
| Ai viết | Người dùng viết toàn bộ **[E]** |
| Assistant được | Không gì cả |
| App từ chối | Viết claim hoặc tick hộ checkbox **[E]** |

**Đây là nơi `LLM + PECT + tinyML` bị chặn.** Một stack không có đối tượng cần
giải thích và không có gì phản bác được, nên không viết được claim khả sai. Gate
hoạt động mà không cần thêm cơ chế mới.

Yêu cầu khả sai áp dụng cho mọi hình thức research, không riêng dạng kết hợp.

**Đã chốt [D-006].** App dùng mức 2: gọi tên hình dạng lỗi bằng từ vựng cố định
(`topic`, `technology stack`, `quá rộng`, `không khả sai`, `thiếu target`), nói
rõ thành phần cấu trúc còn thiếu, hỏi câu chẩn đoán cố định nếu cần và hiển thị
lại các note do chính người dùng viết. Nó không hoàn thành câu, không viết lại
thành question và không đề xuất nội dung.

---

## Gate 4 — Question → Claim

**Chuyển tiếp:** một claim được gắn vào question.

| | |
|---|---|
| Bắt buộc | `user_reason` trên link **[E]** |
| Ai viết | Luôn là người dùng **[E]** |
| Assistant được | Check Type/Scope/Target sau khi reason đã có **[E]** |
| App từ chối | Mọi link thiếu reason, ở cả UI *và* API **[E]**; mọi tool schema có trường reason ghi được **[E]** |

Link không có reason thì không thể check.

---

## Gate 5 — Passage → Evidence

**Chuyển tiếp:** thứ đã đọc trở thành evidence dưới một claim.

| | |
|---|---|
| Bắt buộc | Một finding (không phải paper) kèm một dòng reason **[E]** |
| Ai viết | Người dùng |
| Assistant được | Check link theo ba trục |
| App từ chối | Paper-as-node **[E]**; tạo evidence không reason **[E]** |

Một paper tạo ra nhiều finding, gồm cả finding chống lại claim.

---

## Gate 6 — Claim → Experiment intent  ⟨mới⟩

**Chuyển tiếp:** người dùng quyết định xây hoặc chạy một thứ.

| | |
|---|---|
| Bắt buộc **[D-001]** | Claim nào đang được test; đo cái gì; đây là infrastructure hay probe |
| Ai viết | Người dùng |
| Assistant được | Báo khi target khai báo không khớp claim |
| App từ chối | Coi "framework chạy được" là evidence cho research claim |

**Đã chốt [D-001].** Infrastructure **không** thành tầng thứ tư hay node
nghiên cứu mới. Graph vẫn strictly `QUESTION → CLAIM → EVIDENCE`. Experiment có
thể tham chiếu code/commit/environment bên ngoài, nhưng chỉ experiment nằm
trong graph.

Vì đây là research chứ không phải dev, assertion về chính infrastructure —
hiệu năng, độ đúng, khả năng tổng quát — vẫn phải được test bằng benchmark hoặc
experiment.

---

## Gate 7 — Intent → Run  ⟨mới⟩

**Chuyển tiếp:** một run được dùng làm confirmatory evidence.

| | |
|---|---|
| Bắt buộc **[D-002]** | Claim, target/metric, baseline, prediction/ngưỡng, failure condition, validity condition, scope — ghi **trước** khi chạy |
| Ai viết | Người dùng |
| Assistant được | Không gì cả cho đến khi contract tồn tại |
| App từ chối | Trình bày run không có prediction như confirmatory evidence |

Debug và exploratory run vẫn tự do. Contract chỉ ràng buộc khi run được dùng để
xác nhận claim.

**Vì sao cần.** `accuracy = 90%` tự nó chưa có nghĩa: 90% so với baseline nào,
trên distribution nào, ngưỡng cam kết trước là bao nhiêu? Không có prediction
trước thì mọi kết quả đều "thú vị", scope được chọn sau khi thấy dữ liệu, metric
tốt nhất được chọn hậu kỳ, và một lần đổi ý thật không phân biệt được với một
câu chuyện kể lại.

**Đã chốt [D-003].** Run chạy rồi vẫn được thêm làm evidence, nhưng mang nhãn
`exploratory` vĩnh viễn. Muốn thành `confirmatory` phải viết prediction rồi
replicate; lần chạy mới là record độc lập, lịch sử cũ không bị viết lại.

---

## Gate 8 — Artifact → Observation

**Chuyển tiếp:** raw result trở thành điều người dùng khẳng định.

| | |
|---|---|
| Bắt buộc | "Kết quả này cho thấy gì?" ở status `done` **[E]** |
| Ai viết | Người dùng **[E]** |
| Assistant được | Check observation với claim, sau khi nó đã được viết |
| App từ chối | Viết observation; gộp artifact với ý nghĩa **[E]** |

App đặt cạnh nhau: prediction, result, observation, claim, scope đã khai báo và
run validity. Đặt chúng cạnh nhau chính là thứ làm hindsight lộ ra.

**Đã chốt [D-004].** Validity là thuộc tính riêng của run
(`valid | invalid | uncertain`), **không** phải link status thứ tư. Link vẫn là
`holds | weak | missing`. Run invalid không hỗ trợ và cũng không phản bác claim,
và không bao giờ được tự động đổi link status.

---

## Gate 9 — Observation → Revision

**Chuyển tiếp:** lập luận thay đổi.

| | |
|---|---|
| Bắt buộc | Version mới kèm lý do **[E]** |
| Ai viết | Người dùng |
| Assistant được | Thực hiện structured edit khi được yêu cầu, có confirmation và Undo **[E]** |
| App từ chối | Overwrite; xóa claim đã reject **[E]**; quá một mutating tool mỗi message **[E]** |

Lịch sử là sản phẩm.

---

## Ranh giới lưu trữ

Cắt ngang mọi gate. **Cái tái tạo được sống bên ngoài; cái mất là mất vĩnh viễn
sống trong second-brain.**

| Trong second-brain | Trong project folder |
|---|---|
| question, claim, `user_reason` | code, environment, dataset |
| prediction, scope, validity | CSV, plot, log, checkpoint |
| observation, revision, provenance | run outputs |

Plot tái tạo được từ code, data và seed. Câu "plot này cho thấy X" thì không.
PDF tải lại được; passage đã đánh dấu và lý do đánh dấu thì không.

**Đã chốt [D-010].** Artifact là record nội dung bất biến có `artifact_id`,
`run_id`, SHA-256 `content_hash` và workspace-relative locator. File đổi chỗ mà
hash giữ nguyên tạo locator version mới; bytes đổi tạo artifact mới. Observation
không tự chuyển sang nội dung mới, và metadata vẫn tồn tại khi file bị mất.

---

## Assistant không bao giờ được làm, ở mọi gate

Diễn đạt lại `AGENTS.md` §4 theo ngôn ngữ gate:

- Viết hoặc sửa `user_reason` — **ở bất cứ đâu**. Luật quan trọng nhất.
- Viết claim để promote hoặc tick hộ checkbox.
- Tóm tắt paper.
- Invent claim, paper hoặc finding.
- Sinh research question từ một topic prompt.
- Đặt link status khi chưa có reason.
- Viết prediction hoặc observation **[D-002, D-004]**.

---

## Trạng thái các quyết định

| # | Vấn đề | Trạng thái |
|---|---|---|
| D-001 | Infrastructure tách khỏi experiment | Đã chốt — ngoài graph, được experiment tham chiếu |
| D-002 | Pre-run contract | Đã chốt — chỉ bắt buộc cho confirmatory evidence |
| D-003 | Post-hoc evidence | Đã chốt — cho phép, nhãn `exploratory` vĩnh viễn |
| D-004 | Run validity | Đã chốt — chiều riêng, tách khỏi link status |
| D-005 | Literature tách biệt | Đã chốt — chỉ hiển thị cấu trúc, không sinh cầu nối |
| D-006 | Mức độ giải thích khi từ chối | Đã chốt — mức 2, giải thích cấu trúc nhưng không viết nội dung |
| D-007 | Theoretical evidence | Đã chốt — hai trục độc lập `origin` và `form` |
| D-008 | Evidence vocabulary | Đã chốt — ba giá trị tối thiểu cho mỗi trục |
| D-009 | Derivation validity | Đã chốt — user-owned, tách khỏi link status |
| D-010 | Artifact identity | Đã chốt — immutable record + hash; path chỉ là locator |
| D-011 | Prototype migration | Đã chốt — giữ user assertions, empty thay vì đoán, legacy AI gắn nhãn |
| D-012 | GUI direction | Đã chốt — spatial map, link-first, dock drag context, schema enforcement |
| D-013 | Visual/interaction system | Đã chốt — xem `docs/gui-design.md` |
| D-014 | Storage schema và migration | Đã chốt — xem `docs/storage-design.md` |
| D-015 | Product scope | Đã chốt — chỉ Research OS, chưa xây platform |
| D-016 | Implementation order | Đã chốt — vertical slices, không big-bang rewrite |

Gate 1–5 và 9 suy ra được từ `AGENTS.md`. Gate 6–8 là mới và là thứ case thực tế
làm lộ ra.

## Theoretical evidence

**Đã chốt [D-007].** Research OS phải hỗ trợ proof, derivation,
counterexample và các dạng theoretical evidence do người dùng tạo. Evidence sẽ
được mô tả bằng hai trục độc lập:

- `origin`: nó đến từ literature, experiment hay reasoning của người dùng.
- `form`: nó hỗ trợ/phản bác bằng measurement, derivation, counterexample hoặc
  một hình thức khác đã được chứng minh là cần.

**Đã chốt [D-008].** Vocabulary tối thiểu là
`origin = literature | experiment | own_reasoning` và
`form = measurement | derivation | counterexample`. Hai trường này giúp app
hiển thị provenance, các field liên quan và context; chúng không tự đánh giá
validity hay link status. Xem `docs/research-forms.md` mục 3.

**Đã chốt [D-009].** Với `form = derivation`, validity là chiều riêng:
`unassessed | valid | invalid | uncertain`. Chỉ người dùng đặt validity và viết
lý do; assistant chỉ check derivation→claim theo điều kiện "nếu derivation hợp
lệ". App hiển thị validity tách khỏi relation-to-claim.
