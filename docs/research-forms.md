# Các hình thức research — bản đồ mở, không phải taxonomy cố định

Status: **draft, exploratory**.

Mục đích của tài liệu này là ngăn Research OS vô tình giả định rằng mọi nghiên
cứu đều là “kết hợp A với B”. Danh sách không nhằm phân loại mọi paper. Một
research project có thể chứa nhiều hình thức cùng lúc.

Điểm chung duy nhất:

> Người dùng đang khẳng định điều gì, vì sao họ tin nó, và cái gì có quyền cho
> thấy họ sai?

## 1. Thiết kế thuật toán hoặc phương pháp

Claim thường nói rằng phương pháp có một thuộc tính, hành vi hoặc lợi thế nhất
định. Evidence có thể gồm phân tích, benchmark, ablation, baseline và stress
test.

Rủi ro chính:

- “Mới” bị nhầm với “tốt hơn”.
- Chọn baseline yếu.
- Chọn dataset thuận lợi.
- Claim tổng quát hơn phạm vi benchmark.
- Implementation bug bị nhầm với giới hạn thuật toán.

## 2. Chuyển phương pháp sang domain khác

Một phương pháp từ domain A được kiểm tra trong domain B. Việc chạy được ở B
chưa đủ; các assumption khiến nó đúng ở A có thể không còn giữ.

Rủi ro chính:

- Novelty chỉ là đổi dataset hoặc vocabulary.
- Đo sai target đặc thù của domain B.
- Bỏ qua constraint khiến phương pháp không còn tương đương.
- Kết quả kỹ thuật được trình bày như đóng góp khoa học.

## 3. Mô hình toán học hoặc lý thuyết

Claim có thể là theorem, bound, derivation, model hoặc explanation xuất phát từ
các assumption rõ ràng. Evidence có thể là proof, counterexample, consistency
analysis hoặc empirical validation nếu claim đi ra thế giới thực.

Rủi ro chính:

- Kết luận chỉ đúng dưới assumption nhưng claim lại bỏ mất assumption.
- Proof hỗ trợ claim toán học nhưng bị dùng để hỗ trợ claim thực nghiệm.
- Mô hình giải thích đẹp nhưng không tạo prediction phân biệt được.

**Đã giải quyết tại D-007/D-008:** evidence tách `origin` khỏi `form`, nên
original proof/derivation có thể được biểu diễn là
`own_reasoning + derivation`. Không nhét nó vào `experiment`.

## 4. Đo đạc hoặc mô tả hiện tượng

Claim mô tả điều xảy ra trong một điều kiện cụ thể. Evidence chủ yếu là phép đo
có provenance, calibration và khả năng lặp lại.

Rủi ro chính:

- Proxy bị nhầm với hiện tượng.
- Measurement instrument chưa được validate.
- Sampling bias.
- Observation đúng nhưng explanation bị thêm vào quá sớm.

## 5. So sánh thực nghiệm

Claim nói A hơn, kém hoặc khác B theo metric và scope xác định.

Rủi ro chính:

- Không định nghĩa “tốt hơn” trước khi chạy.
- Tuning budget không công bằng.
- Chọn metric sau khi thấy kết quả.
- Một con số aggregate che distribution hoặc failure modes.

## 6. Replication hoặc phản bác

Claim kiểm tra một kết quả đã công bố có giữ trong cùng điều kiện hoặc điều kiện
mới hay không.

Rủi ro chính:

- Replication không giống protocol gốc.
- Không replicate được bị diễn giải ngay là paper gốc sai.
- Scope của phản bác rộng hơn điều thực sự được kiểm tra.

## 7. Benchmark hoặc measurement instrument

Đối tượng nghiên cứu là khả năng đo. Claim không phải “tool chạy được”, mà là
tool đo đúng thuộc tính cần đo và có khả năng phân biệt các trường hợp quan
trọng.

Rủi ro chính:

- Benchmark reward gaming.
- Metric không tương ứng với construct.
- Dataset leakage.
- Tool reliability bị nhầm với measurement validity.

## 8. Kết hợp hoặc tích hợp

Hai hay nhiều phương pháp/domain được nối lại để giải quyết một vấn đề. Đây là
case LLM + PECT, nhưng chỉ là một hình thức trong nhiều hình thức.

Rủi ro chính:

- Technology stack giả dạng research question.
- Scope tăng theo số thành phần.
- Không attribution được thành phần nào tạo ra kết quả.
- “Hệ thống chạy được” bị nhầm với claim được hỗ trợ.

## Điều Research OS không nên làm

App không yêu cầu người dùng chọn một loại research trước. Taxonomy này không
trở thành dropdown bắt buộc hoặc project container.

App chỉ dùng cấu trúc thực tế để kiểm tra:

- Claim thuộc loại gì?
- Evidence đang hỗ trợ đúng loại claim đó không?
- Scope có khớp không?
- Experiment hoặc proof có đánh đúng target không?

Nếu một research không vừa một mục, taxonomy phải nhường research — không ép
research vừa taxonomy.
