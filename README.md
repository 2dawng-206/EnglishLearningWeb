Bắt đầu (máy mới hoặc Codespace mới)


1. Mở repo trong VS Code → "Reopen in Container" (hoặc trong GitHub Codespaces: Code → Codespaces → Create codespace on main). Devcontainer sẽ tự build image Node 24 + MySQL-client.
2. postCreateCommand sẽ tự chạy npm install trong backend/ khi khởi động lần đầu — đợi nó chạy xong rồi mới làm gì tiếp.
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
