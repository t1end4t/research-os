# Research Trace v0.2 — Từ đọc rộng đến kết quả

Trạng thái: **bản nháp khám phá, không phải specification hay cam kết build**.
Tên surface trong trace là ngôn ngữ của prototype; hướng GUI mới được chốt tại
D-012 và không bắt buộc các surface này là tab riêng.

Tài liệu này lần theo một phiên nghiên cứu cụ thể sử dụng case LLM + PECT +
tinyML. Case này chỉ là một phép thử cho thiết kế, **không phải khuôn mẫu của
mọi research**. Các hình thức research khác được ghi trong
`docs/research-forms.md`.

`AGENTS.md` vẫn là tài liệu có thẩm quyền cao nhất. Nếu trace này xung đột với
brief, xung đột phải được nói ra thay vì tự ý giải quyết.

## Quan điểm giữ nguyên

| Quan điểm | Ràng buộc lên app |
|---|---|
| AI as tool for thought | AI không sở hữu nội dung mà người dùng sẽ bị đánh giá |
| Do the job → understand the job | App giữ *vì sao*, không chỉ giữ *đã làm gì* |
| Faster work → higher quality work | Giá trị nằm ở sai lầm được bắt sớm, không phải throughput |
| Right answers → right question | Question là output đắt của quá trình nhìn cấu trúc |
| Automate the known → explore the unknown | Tự động hóa tải/chạy/lặp; không tự động hóa phán đoán |

Nguyên tắc trung tâm:

> LLM không làm research thay người dùng. Nó kiểm tra reasoning của người dùng.

---

## Trạng thái ban đầu

Người dùng chưa có research question. Chỉ có:

- Muốn hiểu thêm về LLM.
- Lab đang làm về NDT, cụ thể là PECT.
- Linh cảm hai vùng này có thể liên quan.
- Chưa biết vấn đề cụ thể.
- Chưa biết sự kết hợp có giá trị khoa học hay chỉ thú vị kỹ thuật.

`LLM + PECT + tinyML` là một hướng tò mò. Nó chưa phải question, claim hay
project. App không sinh research question từ các từ khóa này.

Lưu ý: một research khác có thể bắt đầu từ một theorem chưa chứng minh, một
algorithm mới, một measurement anomaly hoặc một replication failure. SURVEY
không được giả định mọi nghiên cứu đều bắt đầu từ hai literature cần kết hợp.

---

## Giai đoạn 1 — Orientation

### Người dùng làm gì?

Mở SURVEY và đọc paper về LLM agents, automated research, tinyML/edge inference
và các vấn đề còn mở trong PECT. PDF mở trong reader. Assistant trả lời câu hỏi
cụ thể về paper đang mở và không tóm tắt paper thay người dùng.

### Một phiên đọc phải tạo ra gì?

Phiên đọc có giá trị khi người dùng ghi lại ít nhất một trong các thứ sau:

- Vấn đề paper chưa giải quyết.
- Giới hạn của phương pháp.
- Assumption đáng nghi ngờ.
- Kết quả mâu thuẫn với điều từng tin.
- Passage có thể trở thành finding cho claim đã tồn tại.

Khi chưa có claim, output phù hợp là **open problem note** kèm nguồn:

```text
Điều gì vẫn còn mở ở đây?
[do người dùng viết]

Nguồn:
[paper, passage hoặc nguồn tự do]
```

Assistant có thể cluster các note đã tồn tại. Nó không được viết note hoặc
invent câu hỏi.

### App chặn ở đâu?

Quá 15 loose notes nhưng chưa có ít nhất ba candidate groupings thì không được
thêm note mới. App buộc người dùng nhìn lại:

- Note nào thực sự liên quan?
- Các literature có đang được đọc song song nhưng chưa chạm nhau?
- Cluster nào chỉ là topic, chưa phải open problem?
- Việc đọc có đang được dùng để trì hoãn cam kết?

### Điều kiện thoát

Orientation không kết thúc vì đã đọc đủ số paper. Nó kết thúc khi một candidate
grouping đủ cụ thể để thử chuyển thành question có thể được trả lời sai.

**Điểm mở:** luật 15 note nhìn thấy note chưa cluster nhưng chưa nhìn thấy hai
cluster hoàn chỉnh mà hoàn toàn không có cầu nối.

---

## Giai đoạn 2 — Một hướng nghiên cứu xuất hiện

Trong case này, người dùng nghĩ đến `LLM + PECT + autoresearch + tinyML`.

App không biến cụm này thành research question. Về cấu trúc nó mới chỉ là:

- Tổ hợp công nghệ.
- Hướng xây dựng.
- Chưa có đối tượng cần giải thích.
- Chưa có kết quả nào có thể bác bỏ nó.
- Chưa rõ novelty nằm ở đâu.
- Chưa rõ tinyML là constraint, method hay mục tiêu.

Assistant không viết câu hỏi. Người dùng phải tự quay lại material của mình và
xác định vấn đề, target, constraint và điều gì có thể khiến hướng này thất bại.

### App chặn ở đâu?

Một technology stack không thể được promote thành QUESTION. Promotion yêu cầu:

1. Người dùng tự viết question.
2. Người dùng tự viết claim trả lời question.
3. Người dùng xác nhận claim có thể sai.
4. Người dùng xác nhận claim có thể được giải quyết trong vòng một năm.

Không qua được bốn điều trên thì ý tưởng vẫn ở SURVEY. Nó không bị mất, nhưng
không được giả dạng thành research program.

Đây chỉ là cách Gate 3 hoạt động trong research dạng kết hợp. Với algorithm,
theory, measurement hoặc replication, hình dạng đầu vào khác nhưng yêu cầu khả
sai vẫn giữ nguyên.

---

## Giai đoạn 3 — Cam kết một claim

Người dùng tự viết:

```text
Question: [do người dùng viết]
Claim:    [câu trả lời tạm thời]
Reason:   [vì sao claim này trả lời question]
```

`user_reason` là bắt buộc. Thiếu reason thì link không được tạo và assistant
không được check — cả UI và API đều phải chặn.

Assistant chỉ check link theo ba trục:

- **Type:** claim có cùng loại với điều question hỏi không?
- **Scope:** claim có rộng hơn question hoặc phạm vi có thể kiểm tra không?
- **Target:** claim có trả lời question hay đã trượt sang mục tiêu khác?

Assistant trả `holds | weak | missing`, một finding ngắn và ba verdict. Nó
không sửa claim hoặc reason.

Người dùng có thể giữ, làm yếu, split, reject, tìm evidence hoặc thiết kế
experiment. Mọi thay đổi tạo version mới; không overwrite.

---

## Giai đoạn 4 — Đọc có mục tiêu

Bây giờ việc đọc nhằm kiểm tra một claim cụ thể.

Khi chọn passage và nhấn `+ Evidence`, người dùng phải viết:

```text
Finding: [paper thực sự tìm thấy điều gì]
Reason:  [vì sao finding hỗ trợ hoặc làm yếu claim]
```

Paper không phải evidence node. Một paper có thể tạo nhiều finding: hỗ trợ,
hẹp hơn claim, mâu thuẫn hoặc đo sai target. Mỗi finding có link và reason
riêng.

Assistant check từng evidence→claim link theo Type/Scope/Target. Nó không
summarize paper, không viết finding, không viết reason và không giấu finding
bất lợi.

---

## Giai đoạn 5 — Quyết định xây hoặc chạy một thứ

Đây là điểm dễ chuyển từ *kiểm tra claim* sang *xây một hệ thống thú vị*.

App phải giữ ba thứ tách biệt:

```text
Research target: muốn biết điều gì?
Experiment:      hành động nào tạo ra evidence?
Infrastructure:  thứ gì phải tồn tại để experiment chạy?
```

Autoresearch framework có thể là infrastructure. Framework chạy được chưa hỗ
trợ research claim. Tuy nhiên, vì đây là research chứ không phải dev, assertion
về chính framework — hiệu năng, độ đúng, khả năng tổng quát — cũng phải được
test bằng benchmark hoặc experiment.

Infrastructure không trở thành tầng thứ tư trong research graph. Experiment
có thể tham chiếu folder code, commit, environment hoặc runtime ở bên ngoài.

Hai thất bại phải được phân biệt:

1. **Implementation failure:** hệ thống không hoạt động như specification.
2. **Research failure:** hệ thống hoạt động đúng nhưng kết quả không hỗ trợ
   claim.

---

## Giai đoạn 6 — Cam kết trước run

Trước khi một run được tính là confirmatory evidence, người dùng ghi:

```text
Claim đang được test: [claim]
Target/metric:        [thứ thực sự được đo]
Baseline:             [điểm so sánh]
Expected outcome:     [prediction hoặc ngưỡng]
Failure condition:    [điều làm claim yếu đi]
Validity condition:   [điều phải đúng để run có giá trị]
Scope:                [phạm vi kết luận]
```

Ví dụ `accuracy = 90%` chưa đủ. Cần biết 90% so với baseline nào, trên
distribution nào, và ngưỡng đã được cam kết trước là bao nhiêu.

Debug và exploratory run không cần ceremony. Nhưng nếu không có prediction
trước, run chỉ có thể được dùng như exploratory evidence.

---

## Giai đoạn 7 — Thực thi bên ngoài

Code, dataset, checkpoint, CSV, plot và log sống trong project folder ngoài
second-brain.

```text
second-brain            project folder
- question              - code
- claim                 - environment
- reason                - dataset
- experiment intention  - run outputs
- prediction            - CSV
- observation           - plots
- revision              - logs
- provenance            - checkpoints
```

Quy tắc chia: **cái có thể tái tạo sống bên ngoài; cái mất là mất vĩnh viễn
sống trong second-brain.** Plot có thể tạo lại từ code, data và seed. Câu “plot
này cho thấy X” thì không. PDF có thể tải lại; passage đã chọn và lý do chọn thì
không.

Mỗi run đáng lưu có reference và provenance: run id, experiment, code revision,
dataset version, configuration, seed, thời gian, artifact id, result locator,
content hash và tool/agent đã tạo. Theo D-010, path chỉ là locator có lịch sử;
artifact là record nội dung bất biến và identity sống lâu hơn đường dẫn.

Scheduled agent có thể chạy experiment đã định nghĩa. Nó không được đổi target,
metric, prediction hoặc success criteria.

---

## Giai đoạn 8 — Quan sát kết quả

Artifact được hiển thị dưới claim mà experiment kiểm tra. Khi mở artifact quan
trọng, người dùng phải viết:

```text
Kết quả này cho thấy gì?
[do người dùng viết]
```

Artifact là raw result. Observation là điều người dùng khẳng định raw result có
nghĩa. Hai thứ không được collapse. Observation sống trong second-brain.

App đặt cạnh nhau:

- Prediction trước run.
- Result thực tế.
- Observation của người dùng.
- Claim đang được test.
- Scope đã khai báo.
- Run validity.

Assistant không viết observation. Khi observation và reason đã có, nó check
evidence→claim link theo Type/Scope/Target.

Run validity là chiều riêng, ví dụ `valid | invalid | uncertain`. Nó không phải
link status. Run invalid không hỗ trợ và cũng không phản bác claim.

---

## Giai đoạn 9 — Điều chỉnh lập luận

Người dùng đưa ra quyết định rõ:

- Claim vẫn giữ.
- Claim yếu đi.
- Claim cần thu hẹp scope.
- Claim bị reject.
- Experiment invalid và cần chạy lại.
- Kết quả tạo ra question mới.
- Kết quả chỉ nói về implementation, không nói về research claim.

Mỗi quyết định tạo lịch sử mới. Không sửa claim cũ để làm nó khớp result mới.

---

## Giai đoạn 10 — Viết

Người dùng dùng graph để xem question nào được trả lời, claim nào còn giữ,
finding nào hỗ trợ hoặc mâu thuẫn, experiment nào đo đúng target, scope thực sự
là gì và phần nào của argument còn thiếu.

Người dùng tự viết paper. App giữ traceability:

```text
Statement → Claim version → User reason → Evidence finding
          → Source hoặc run → Artifact → Observation
```

Assistant không invent claim để lấp chỗ trống. Một đoạn không có foundation
được làm cho nhìn thấy, không được viết giúp.

---

## Trạng thái kết thúc

Research cycle không cần kết thúc bằng positive result hay publication. Nó có
giá trị nếu tạo ra claim mạnh hơn, claim hẹp hơn, claim bị reject, assumption
được lộ ra, measurement mismatch, experiment invalid, question tốt hơn xuất
phát từ cấu trúc hoặc một hướng được dừng với lý do truy lại được.

Output cuối cùng:

> Tôi biết rõ hơn mình đang khẳng định điều gì, vì sao tôi tin nó, cái gì có thể
> khiến tôi sai và thực tế đã phản hồi ra sao.

## Spine mà case này làm lộ ra

```text
Survey → Candidate → Question → Claim → Evidence hoặc planned experiment
       → External run → Artifact → User observation → Link check → Revision
```

Spine trên phù hợp nhất với research thực nghiệm. Research OS cũng sẽ hỗ trợ
nhánh `Claim → original proof/derivation/counterexample → Revision` theo quyết
định D-007. D-008 đã chốt evidence dùng `origin` và `form`, không nhét
derivation vào experiment.

## Các vấn đề đã được giải quyết sau trace này

1. Infrastructure và experiment liên kết thế nào mà không thêm tầng graph.
2. Pre-run contract tối thiểu gồm những gì.
3. Run validity và exploratory/confirmatory provenance.
4. Cách hiển thị trạng thái artifact moved, replaced hoặc unavailable trong GUI.
5. Cách hiển thị các literature/cluster chưa có cầu nối.
6. Cách trình bày derivation validity và relation-to-claim thành hai khối rõ
   ràng trong GUI.

Quyết định D-007 và D-008 đã chốt evidence dùng hai trục tối thiểu:
`origin = literature | experiment | own_reasoning` và
`form = measurement | derivation | counterexample`.

Quyết định D-009 đã chốt derivation validity là đánh giá do người dùng sở hữu,
tách khỏi link status. Assistant chỉ check link theo điều kiện derivation hợp
lệ và không được tuyên bố proof đúng.
