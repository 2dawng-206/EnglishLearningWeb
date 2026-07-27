# 📚 VocabMaster

> A modern English vocabulary learning platform built with React, NestJS and MySQL.

![GitHub stars](https://img.shields.io/github/stars/...)
![GitHub forks](https://img.shields.io/github/forks/...)
![License](https://img.shields.io/badge/license-MIT-blue)

Bắt đầu (máy mới hoặc Codespace mới)


1. Mở repo trong VS Code → "Reopen in Container" (hoặc trong GitHub Codespaces: Code → Codespaces → Create codespace on main). Devcontainer sẽ tự build image Node 24 + MySQL-client.
2. postCreateCommand sẽ tự chạy npm install trong backend/ khi khởi động lần đầu - đợi nó chạy xong rồi mới làm gì tiếp.
3. cd backend r tạo file .env sau đó paste giá trị thật vào
4. mkdir -p certs, sau đó upload file ca.pem vào
5. npm run build -> npm run start:dev
6. mở thêm 1 ternimal sau đó dán câu lệnh sau
6. cd frontend && npm install
7. chạy npm run dev khi và chỉ khi backend đã hiện "Nest application successfully started"
8. Nếu bị lỗi 404 thì nhớ chỉnh ports của nestjs với vite dev server thành public

***Biến môi trường (backend/.env)

NODE_ENV=development
PORT=3000
FRONTEND_URL=https://special-yodel-r499qv74w4vcpgwr-5173.app.github.dev

DB_SSL_CA_PATH=./certs/ca.pem

# Aiven MySQL

DB_HOST=

DB_PORT=

DB_DATABASE=

DB_USERNAME=

DB_PASSWORD=

DB_SSL=true

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

JWT_EXPIRES_IN=15m

JWT_REFRESH_EXPIRES_IN=7d

DICTIONARY_API_BASE_URL=https://api.dictionaryapi.dev/api/v2/entries/en



***frontend/.env

VITE_API_BASE_URL=https://special-yodel-r499qv74w4vcpgwr-3000.app.github.dev/api

# Thực hiện đánh giá/trình bày vấn đề Luật, đao đức xã hội và đạo đức nghề nghiệp khi Nhóm xây dựng Project trên.
1. Khía cạnh Luật pháp (Legal) & Bảo mật (Security)

Khi xây dựng dự án VocabMaster, nhóm em tuân thủ nghiêm ngặt các quy định pháp chế và bảo vệ dữ liệu người dùng:

Bảo vệ dữ liệu: Tuân thủ luật bảo vệ dữ liệu người dùng chung để tránh rò rỉ dữ liệu nghiêm trọng (như bài học rò rỉ thông tin cá nhân qua phím F12 rút kinh nghiệm từ trang Gumtree).

Có Security như:

Quản lý Token an toàn: Access token chỉ được lưu trữ tạm thời trên bộ nhớ để hạn chế tối đa rủi ro lộ lọt. Refresh token được lưu trong cơ sở dữ liệu (users.refresh_token) dưới dạng mã băm (bcrypt hash) chứ không lưu token thô, và liên tục được xoay vòng mỗi khi sử dụng.

Nhận diện rủi ro: Nhóm nhận thức và tài liệu hóa rõ ràng rủi ro XSS khi lưu refresh token ở localStorage của Client, tạo tiền đề nâng cấp lên httpOnly cookie trong tương lai.

Phân quyền: Ứng dụng áp dụng Global JwtAuthGuard để bảo vệ mọi API route mặc định. Quyền truy cập các tính năng nhạy cảm (như tạo/sửa/xóa từ vựng) được bảo vệ bằng @Roles(UserRole.ADMIN).

Bản quyền và Sở hữu trí tuệ: Nhóm cam kết tuân thủ các giấy phép sử dụng mã nguồn mở đối với các thư viện và công cụ được sử dụng (Vite, NestJS, React) cũng như các tài nguyên hình ảnh trên web.

2. Vấn đề Đạo đức Xã hội (Social Ethics)

Nhóm phát triển bọn em luôn cân nhắc các khía cạnh công nghệ - xã hội nhằm đảm bảo ứng dụng mang lại giá trị tích cực và công bằng:

Ứng dụng của nhóm em đảm bảo tính truy cập cho nhiều nhóm người dùng khác nhau (người bình thường, người khiếm thị...) và sử dụng màu sắc hợp lý không gây nhức mắt với bảng màu "ink and amber" (mực và hổ phách) kết hợp phông chữ Zilla Slab và IBM Plex Sans/Mono giúp văn bản rõ ràng không gây mỏi mắt. Cải thiện tính sử dụng và Không bỏ rơi người dùng: Trong tính năng luyện phát âm, mặc dù hệ thống dùng Web Speech API (STT), nhưng nhóm nhận thức được không phải trình duyệt nào cũng hỗ trợ. Thay vì vô hiệu hóa ứng dụng, hệ thống cung cấp thông báo dự phòng rõ ràng bằng ngôn ngữ tự nhiên và cho phép người dùng tiếp tục học mà không bị chặn.
Tính minh bạch (Transparency): Người dùng cần được biết dữ liệu nào đang được thu thập và quản lý. Trong VocabMaster, lịch sử học tập và tiến độ của người dùng được thu thập một cách minh bạch nhằm mục đích duy nhất là phục vụ thuật toán SM-2 và tính năng Gamification (tính XP, theo dõi chuỗi học) giúp cá nhân hóa trải nghiệm học.

3. Đạo đức Nghề nghiệp (Professional Ethics)

Cách phối hợp cũng như làm việc trong nhóm:

Tuân thủ tiêu chuẩn Code và Tài liệu hóa (Practice): Nhóm phải biết nhận thức và tuân thủ các tiêu chuẩn nghề nghiệp, tiêu chuẩn code và tài liệu hóa. Nhóm sử dụng TypeScript chặt chẽ cùng các hàm cốt lõi như tính điểm XP, chuỗi học (streak) đều được tách thành hàm thuần túy (pure functions).

Làm việc nhóm và Quản lý quy trình: Trách nhiệm vai trò cá nhân được chia rõ (front end, backend) và sử dụng hệ thống điều khiển kho chứa mã nguồn (Git). Repo dự án được tổ chức rõ ràng thành 2 thư mục độc lập frontend/ và backend/ chung một repo Git để dễ phối hợp.


Trách nhiệm với Dữ liệu (Security & Professionalism): Khi thao tác ghi nhận kết quả học tập, lập trình viên của nhóm tuân thủ kỷ luật nghiêm ngặt về "transaction boundary": các thao tác ghi được gói gọn trong một transaction để tránh sai lệch dữ liệu, sau đó mới thực hiện query đọc lại kết quả.
