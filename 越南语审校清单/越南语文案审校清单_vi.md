# KindredSouls 越南语（Tiếng Việt）全量文案审校清单

> 📋 审校说明：本清单涵盖前端所有越南语文案，共6个模块约200+条。
> 每条格式：`原文` → 军师如需修改请直接在旁边标注修改建议。
> 无需修改的条目打 ✅ 即可。

---

## 1️⃣ 静态UI字典 (vi.json) — 25条

| # | Key | 当前越南语 | 军师审校 |
|---|-----|-----------|---------|
| 1 | app.name | KindredSouls | ✅（品牌名不改） |
| 2 | app.tagline | Khai mở sợi dây liên kết vũ trụ của bạn | |
| 3 | input.title | Vận mệnh an bài trên ngàn tinh tú | |
| 4 | input.subtitle | Nhập ngày sinh của cả hai để hé lộ độ hòa hợp thiên định | |
| 5 | input.yourBirthday | Ngày sinh của bạn | |
| 6 | input.theirBirthday | Ngày sinh của đối phương | |
| 7 | input.calculate | Khai mở duyên phận | |
| 8 | input.placeholder1 | YYYY-MM-DD | ✅ |
| 9 | input.placeholder2 | YYYY-MM-DD | ✅ |
| 10 | result.title | Kết quả độ hòa hợp | |
| 11 | result.score | Điểm số duyên phận | |
| 12 | result.overall | Độ tương hợp tổng quan | |
| 13 | result.loading | Đang giải mã thông điệp từ vũ trụ... | |
| 14 | result.back | Xem duyên phận cặp khác | |
| 15 | result.luckyAspects | Điểm cát tường thiên định | |
| 16 | result.challengingAspects | Điểm xung khắc cần lưu ý | |
| 17 | result.engines.bazi | Tử vi Đông Phương (Bát Tự) | |
| 18 | result.engines.zodiac | Cung hoàng đạo Tây Phương | |
| 19 | result.engines.iching | Trí tuệ Kinh Dịch | |
| 20 | result.engines.aiInsight | Thấu thị mối quan hệ bằng AI Duyên Phận | |
| 21 | nav.language | Ngôn ngữ | ✅ |
| 22 | nav.settings | Cài đặt | ✅ |
| 23 | common.errorIncomplete | 🔮 Cần hội tụ đủ hai vì sao để định vị sợi dây mệnh vận | |
| 24 | common.errorFormat | ✨ Vui lòng dùng định dạng YYYY-MM-DD để hiệu chuẩn tần số vũ trụ của bạn | |
| 25 | common.errorInvalidDate | 🔮 Mốc thời gian phàm trần bị lệch hướng — Vui lòng điều chỉnh lại ngày sinh | |
| 26 | common.errorFutureDate | ⏳ Bánh xe vận mệnh chưa quay đến — Không thể bói trước tương lai | |
| 27 | common.errorTooOld | 🌟 Ngay cả tinh tú cũng có giới hạn — Vui lòng kiểm tra lại năm sinh | |

---

## 2️⃣ 八字算法 (bazi.ts) — 66条

### 天干 (10条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 1 | 甲 | Giáp | ✅ |
| 2 | 乙 | Ất | ✅ |
| 3 | 丙 | Bính | ✅ |
| 4 | 丁 | Đinh | ✅ |
| 5 | 戊 | Mậu | ✅ |
| 6 | 己 | Kỷ | ✅ |
| 7 | 庚 | Canh | ✅ |
| 8 | 辛 | Tân | ✅ |
| 9 | 壬 | Nhâm | ✅ |
| 10 | 癸 | Quý | ✅ |

### 地支 (12条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 11 | 子 | Tý | ✅ |
| 12 | 丑 | Sửu | ✅ |
| 13 | 寅 | Dần | ✅ |
| 14 | 卯 | Mão | ✅ |
| 15 | 辰 | Thìn | ✅ |
| 16 | 巳 | Tỵ | ✅ |
| 17 | 午 | Ngọ | ✅ |
| 18 | 未 | Mùi | ✅ |
| 19 | 申 | Thân | ✅ |
| 20 | 酉 | Dậu | ✅ |
| 21 | 戌 | Tuất | ✅ |
| 22 | 亥 | Hợi | ✅ |

### 五行 (5条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 23 | 木 | Mộc | ✅ |
| 24 | 火 | Hỏa | ✅ |
| 25 | 土 | Thổ | ✅ |
| 26 | 金 | Kim | ✅ |
| 27 | 水 | Thủy | ✅ |

### 关系描述与标签 (39条)
| # | 上下文 | 越南语 | 军师审校 |
|---|--------|--------|---------|
| 28 | 你的 | của bạn | |
| 29 | 对方的 | của đối phương | |
| 30 | 对方的(2) | của đối phương | |
| 31 | 你的(2) | của bạn | |
| 32 | 强 | mạnh | |
| 33 | ...带来滋养能量 | , mang lại năng lượng nuôi dưỡng cho  | |
| 34 | 为 | cho | |
| 35 | 年 | Năm | ✅ |
| 36 | 月 | Tháng | ✅ |
| 37 | 日 | Ngày | ✅ |
| 38 | [四柱] | [Tứ Trụ] | |
| 39 | 你 | Bạn | ✅ |
| 40 | 对方 | Đối phương | ✅ |
| 41 | 年(2) | Năm | ✅ |
| 42 | 月(2) | Tháng | ✅ |
| 43 | 日(2) | Ngày | ✅ |
| 44 | [日主分析] | [Phân tích Nhật Chủ] | |
| 45 | [合婚] | [Hợp Hôn] | |
| 46 | 总分 | Điểm tổng | |
| 47 | 元素 | nguyên tố | |
| 48 | 日主 | Nhật Chủ | ✅ |
| 49 | 你的(3) | của bạn | |
| 50 | 对方的(3) | của đối phương | |
| 51 | 本质相似—天然默契 | Bản chất tương đồng — ăn ý tự nhiên từ đầu | |
| 52 | 不同但互补 | Khác nhau nhưng bổ trợ — mỗi người giúp đỡ phát huy tiềm năng của người kia | |
| 53 | 差异明显—需要理解 | Khác biệt rõ ràng — cần thêm sự thấu hiểu và kiên nhẫn | |
| 54 | 缘分深厚 | Duyên sâu sắc — trân trọng nhau | |
| 55 | 基础稳固—好好经营 | Nền tảng vững — chăm sóc thật tốt | |
| 56 | 需要调整但值得 | Cần điều chỉnh, nhưng đáng để cố gắng | |
| 57 | 四柱分析 | Phân tích Tứ Trụ | |
| 58 | 你(2) | Bạn | ✅ |
| 59 | 对方(2) | Đối phương | ✅ |
| 60 | 年柱 | Trụ Năm | ✅ |
| 61 | 月柱 | Trụ Tháng | ✅ |
| 62 | 日柱 | Trụ Ngày | ✅ |
| 63 | 日主分析(2) | Phân tích Nhật Chủ | |
| 64 | 合婚分析(2) | Phân tích Hợp Hôn | |
| 65 | 总分(2) | Điểm Tổng | |
| 66 | 八字(中文名) | BaZi (Tử Vi Trung Hoa) | |

---

## 3️⃣ 星座算法 (zodiac.ts) — 59条

### 12星座 (12条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 1 | 白羊 | Bạch Dương | ✅ |
| 2 | 金牛 | Kim Ngưu | ✅ |
| 3 | 双子 | Song Tử | ✅ |
| 4 | 巨蟹 | Cự Giải | ✅ |
| 5 | 狮子 | Sư Tử | ✅ |
| 6 | 处女 | Xử Nữ | ✅ |
| 7 | 天秤 | Thiên Bình | ✅ |
| 8 | 天蝎 | Bọ Cạp | ✅ |
| 9 | 射手 | Nhân Mã | ✅ |
| 10 | 摩羯 | Ma Kết | ✅ |
| 11 | 水瓶 | Bảo Bình | ✅ |
| 12 | 双鱼 | Song Ngư | ✅ |

### 四元素 (4条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 13 | 火 | Hỏa | ✅ |
| 14 | 土 | Thổ | ✅ |
| 15 | 风 | Phong | ✅ |
| 16 | 水 | Thủy | ✅ |

### 三模态 (3条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 17 | 开创 | Kiến Tạo | |
| 18 | 固定 | Cố Định | |
| 19 | 变动 | Biến Đổi | |

### 行星 (11条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 20 | 火星 | Sao Hỏa | ✅ |
| 21 | 金星 | Sao Kim | ✅ |
| 22 | 水星 | Sao Thủy | ✅ |
| 23 | 月亮 | Mặt Trăng | ✅ |
| 24 | 太阳 | Mặt Trời | ✅ |
| 25 | 木星 | Sao Mộc | ✅ |
| 26 | 土星 | Sao Thổ | ✅ |
| 27 | 天王星 | Sao Thiên Vương | ✅ |
| 28 | 海王星 | Sao Hải Vương | ✅ |
| 29 | 冥王星 | Sao Diêm Vương | ✅ |

### 角度描述 (6条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 30 | 合相(0°) | Cùng cung (0° hợp) — hiểu nhau sâu sắc nhưng có thể làm trầm trọng điểm yếu chung | |
| 31 | 对冲(${z1} ↔ ${z2}) | Đối nghịch (${z1} ↔ ${z2}) — hấp dẫn mạnh nhưng cần cân bằng khác biệt | |
| 32 | 刑(${z1} □ ${z2}) | Vuông góc (${z1} □ ${z2}) — căng thẳng phát triển, vững chắc hơn sau điều chỉnh | |
| 33 | 三合(${z1} △ ${z2}) | Tam hợp (${z1} △ ${z2}) — năng lượng chảy hài hòa, thoải mái và dễ chịu | |
| 34 | 六合(${z1} ⚹ ${z2}) | Lục hợp (${z1} ⚹ ${z2}) — trùng hợp nhiều, hợp tác suôn sẻ | |
| 35 | 特殊角度(${deg}°) | Góc đặc biệt (${deg}°) — hấp dẫn độc đáo | |

### 元素交互 (3条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 36 | 同元素 | Cả hai đều ${elem} — giá trị cốt lõi phù hợp, nhưng có thể thiếu kích thích mới | |
| 37 | 相生 | ${elem1} và ${elem2}nuôi dưỡng nhau — bổ trợ tự nhiên | |
| 38 | 相克 | ${elem1} và ${elem2}khác nhau — khác biệt tạo không gian phát triển | |

### 星座配对评价 (7条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 39 | 完美配对 | ${z1} và ${z2}cặp đôi hoàn hảo — các vì sao sắp xếp cho cả hai. | |
| 40 | 化学反应 | ${z1}(bạn)gặp${z2}(đối phương) — năng lượng vũ trụ bùng nổ hóa học thú vị. | |
| 41 | 需要理解 | ${z1} và ${z2}cần thêm sự thấu hiểu, nhưng khác biệt nuôi dưỡng sự hấp dẫn. | |
| 42 | 对宫相遇 | Cung đối nghịch gặp nhau — đối lập ẩn chứa hấp dẫn ngang nhau. | |

### 标签/标题 (13条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 43 | 星座 | Cung Hoàng Đạo | |
| 44 | [太阳宫] | [Cung Mặt Trời] | |
| 45 | 你 | Bạn | ✅ |
| 46 | 对方 | Đối phương | ✅ |
| 47 | 元素 | nguyên tố | |
| 48 | 守护星 | sao bảo hộ | |
| 49 | 遇 | gặp | |
| 50 | [角度分析] | [Phân Tích Góc] | |
| 51 | [元素交互] | [Tương Tác Nguyên Tố] | |
| 52 | [守护星交互] | [Tương Tác Sao Bảo Hộ] | |
| 53 | 经典完美配对 | ${z1} và ${z2}là một trong những cặp đôi hoàn hảo kinh điển | |
| 54 | 对宫挑战 | ${z1} và ${z2}là cung đối nghịch — hấp dẫn gặp thách thức | |
| 55 | 独特配置 | ${z1} và ${z2}tạo cấu hình độc đáo | |
| 56 | 总分 | Điểm tổng | |

### 评分评语 (3条)
| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 57 | 星辰见证—深度连接 | Các vì sao làm chứng — kết nối sâu sắc | |
| 58 | 星光引路—值得期待 | Ánh sao dẫn lối — có điều đáng để trông chờ | |
| 59 | 星途有挑战—一起跨越 | Đường sao có thách thức — cùng nhau vượt qua | |

---

## 4️⃣ 易经算法 (iching.ts) — 17条

| # | 中文 | 越南语 | 军师审校 |
|---|------|--------|---------|
| 1 | 大吉 | Đại Cát | ✅ |
| 2 | 吉 | Cát | ✅ |
| 3 | 中 | Trung | ✅ |
| 4 | 小凶 | Tiểu Hung | ✅ |
| 5 | 待变 | Đợi Biến | |
| 6 | 凶 | Vi | ✅ |
| 7 | [主卦] | [Quẻ Chính] | |
| 8 | 性质 | Tính chất | ✅ |
| 9 | 卦辞(原为"判决") | Lời phán | |
| 10 | 级别 | Cấp độ | ✅ |
| 11 | [关系解读] | [Duyên nghiệp] | |
| 12 | [爻分析] | [Phân tích Hào] | |
| 13 | 诸爻静—关系稳定 | Tất cả hào tĩnh — quan hệ đang ổn định | |
| 14 | 吉卦，顺天意 | Quẻ cát tường, thuận theo Thiên Đạo | |
| 15 | 中上卦，事在人为 | Quẻ khá tốt, nỗ lực con người quyết định | |
| 16 | 卦在变—修心改命 | Quẻ đang chuyển — tu tâm để đổi mệnh | |
| 17 | 易经 | Trí tuệ Dịch Kinh | |

---

## 5️⃣ 塔罗牌 (AuthButton.tsx) — 22张大阿卡纳

| # | 英文名 | 越南语名 | 越南语释义 | 军师审校(名) | 军师审校(义) |
|---|--------|---------|-----------|-------------|-------------|
| 1 | The Fool | Kẻ Ngốc | Can đảm bước vào hành trình chưa biết — những khả năng mới đang chờ. | | |
| 2 | The Magician | Pháp Sư | Hiện thực hóa và sáng tạo — ý chí thức tỉnh thành hành động. | | |
| 3 | The High Priestess | Nữ Thần | Trực giác và bí ẩn — câu trả lời đang chờ được bật mí. | | |
| 4 | The Empress | Nữ Hoàng | Phồn vinh và nâng dưỡng — tình yêu nở rộ nhẹ nhàng. | | |
| 5 | The Emperor | Hoàng Đế | Trật tự và bảo vệ — một sức mạnh vững chãi. | | |
| 6 | The Hierophant | Giáo Hoàng | Dẫn dắt và niềm tin — tâm hồn kết nối ở tầng sâu hơn. | | |
| 7 | The Lovers | Cặp Đôi | Ngã tư của sự lựa chọn — mối quan hệ đối mặt với quyết định quan trọng. | | |
| 8 | The Chariot | Cỗ Xe | Ý chí và thắng lợi — vượt qua chướng ngại cùng nhau. | | |
| 9 | Strength | Sức Mạnh | Can đảm bên trong — dịu dàng nhưng bất khả chiến bại. | | |
| 10 | The Hermit | Người Ẩn Dật | Cô đơn và nội quan — câu trả lời nằm ở sâu bên trong. | | |
| 11 | Wheel of Fortune | Bánh Xe Vận Mệnh | Biến đổi và chu kỳ — vận mệnh đang xoay chuyển đến với bạn. | | |
| 12 | Justice | Công Lý | Nhân quả và cân bằng — vũ trụ đáp trả chính xác. | | |
| 13 | The Hanged Man | Người Bị Treo | Buông bỏ và đầu hàng — sự khôn ngoan từ góc nhìn khác. | | |
| 14 | Death | Sự Chết | Kết thúc và hoán chuyển — một chương mới bắt đầu. | | |
| 15 | Temperance | Sự Ôn Hòa | Cân bằng và hài hòa — tìm thấy nhịp điệu giữa hai thái cực. | | |
| 16 | The Devil | Ác Quỷ | Trói buộc và chấp niệm — đối mặt với bóng tối để vượt lên. | | |
| 17 | The Tower | Tháp | Tỉnh giác đột ngột — ảo ảnh vỡ tan để lộ ra sự thật. | | |
| 18 | The Star | Ngôi Sao | Hy vọng và cảm hứng — ánh sáng chữa lành vũ trụ dẫn đường cho bạn. | | |
| 19 | The Moon | Mặt Trăng | Ảo ảnh và nỗi sợ — đối diện với bất an sâu thẳm bên trong. | | |
| 20 | The Sun | Mặt Trời | Vui sướng và thành công — sức sống nở rộ trọn vẹn. | | |
| 21 | Judgement | Sự Phán Xử | Tái sinh và tha thứ — tâm hồn bạn đang được gọi. | | |
| 22 | The World | Thế Giới | Hoàn thành và viên mãn — hài hòa bên trong đã đạt được. | | |

---

## 6️⃣ AI洞察提示词 (ai-insight.js) — 越南语系统提示词

```
Bạn là nhà tâm lý mối quan hệ chiêm tinh học AI cao cấp của KindredSouls, viết cho người trẻ Việt Nam (TP.HCM / Hà Nội). Bạn phải thơ mộng, sâu sắc, và đầy sự thấu hiểu trong từng câu chữ.

Triết lý cốt lõi: Tích hợp liền mạch ngôn ngữ, văn hóa và logic là lợi thế cạnh tranh cốt lõi của chúng tôi.

Quy tắc dịch thuật & Phong cách (bắt buộc tuân thủ):
• Thuật ngữ Chiêm tinh & Bát Tự: Dùng từ Hán-Việt kết hợp tâm lý hiện đại
  - Nhật 主 (日主) = Nhật Chủ (Bản mệnh cốt lõi) | Sextile = Góc chiếu nâng đỡ (Sextile) | Trine = Góc chiếu hài hòa (Trine) | Clash (冲) = Xung khắc / Biến động năng lượng | I-Ching Hexagram (卦) = Quẻ Kinh Dịch
• Xóa các từ máy móc:
  - Tuyệt đối không dùng "Bản án" (án phạt) hay "Phán quyết" cho 卦辞 → dùng "Lời chiêm giải cốt lõi"
  - Không dùng "Kết quả/Điểm số" một cách khô cứng → dùng "Chỉ số hòa hợp" hoặc "Mức độ cát tường" ◆ Đại Cát / ◇ Cát thường
  - Không dùng "Lợi ích / Được lợi" trong tình yêu → dùng "Nuôi dưỡng / Bổ sung cho nhau" hoặc "Đồng hành cùng nhau"
• Cảnh báo tình cảm phải kết thúc bằng hy vọng và sự trưởng thành: "Thấu hiểu để bao dung" | "Chuyển hóa năng lượng" | "Hãy để tình yêu thuận theo dòng chảy tự nhiên" | "Vận mệnh đang mỉm cười với bạn"

Quy tắc định dạng:
- Cấm: ### ## # | **in đậm** | --- *** | Xuống dòng tự nhiên
- Dùng: | • ✨ 🌿 🚀 để tạo nhịp đọc thanh lịch trên màn hình điện thoại
- Kết thúc bằng cảm xúc: "🌿 Hãy để tình yêu thuận theo dòng chảy..." | "✨ Vận mệnh đang mỉm cười..."

Quy tắc nội dung:
1. Không viết ba phần riêng biệt (Bát Tự / Chiêm tinh / Kinh Dịch). Hòa trộn thành MỘT câu chuyện.
2. Không đề cập bất kỳ lá bài tarot nào trong nội dung chính (hệ thống sẽ thêm vào cuối).
3. Ngôn ngữ thơ mộng, đầy cảm xúc, không sáo rỗng.
4. Luôn tích cực, TUYỆT ĐỐI không dự đoán chia tay.
5. 80-150 từ, có chiều sâu, có cảm xúc, có logic.
```

**军师审校区域：**

---

## 🔍 牛牛预先标记的疑似问题

以下条目在泰语审校中发现过同类问题，越南语中可能也存在：

| # | 文件 | 原越南语 | 疑似问题 |
|---|------|---------|---------|
| A1 | zodiac.ts | ${elem1} và ${elem2}nuôi dưỡng nhau | 缺空格：`nuôi` 前应有空格 |
| A2 | zodiac.ts | ${elem1} và ${elem2}khác nhau | 缺空格：`khác` 前应有空格 |
| A3 | zodiac.ts | ${z1} và ${z2}cặp đôi hoàn hảo | 缺空格：`cặp` 前应有空格 |
| A4 | zodiac.ts | ${z1}(bạn)gặp${z2}(đối phương) | 缺空格：括号前后应有空格 |
| A5 | zodiac.ts | ${z1} và ${z2}cần thêm sự thấu hiểu | 缺空格 |
| A6 | zodiac.ts | ${z1} và ${z2}là một trong những | 缺空格 |
| A7 | zodiac.ts | ${z1} và ${z2}là cung đối nghịch | 缺空格 |
| A8 | zodiac.ts | ${z1} và ${z2}tạo cấu hình độc đáo | 缺空格 |
| A9 | zodiac.ts | ${z1}(bạn)gặp${z2}(đối phương) | 模板拼接缺空格 |
| B1 | vi.json | Điểm số duyên phận | "Điểm số" 是否太生硬？ |
| B2 | vi.json | Điểm xung khắc cần lưu ý | 是否过于负面？ |
| B3 | bazi.ts | of đối phương | "đối phương"在情感产品中是否足够温暖？ |
| B4 | iching.ts | [Duyên nghiệp] | 词义不准确，应为"关系解读" |

---

> 📌 审校完成后请发回，牛牛将逐一替换进代码并部署。
