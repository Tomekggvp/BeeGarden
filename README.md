<p align="center">
  <a href="https://beegardenns.netlify.app/" target="_blank">
    <img src="https://img.shields.io/badge/_Beegarden-Живая_демо-4CAF50?style=for-the-badge&logo=netlify&logoColor=white" alt="Живая демо">
  </a>
</p>

Эта учётная запись намеренно оставлена публичной для демонстрации. Все посетители
имеют доступ к её данным; используйте её только для демонстрационных записей.

## Запуск

Требуется Node.js 22.14 или новее. Выполните `npm ci` отдельно в `client` и `server`.
Скопируйте соответствующие `.env.example` в `.env`, заполните настройки Supabase
и запускайте `npm run dev` в каждой папке. В браузер допускается только публичный
anon/publishable ключ; service-role и VAPID private key хранятся только на сервере.
Существующие значения публичного проекта остаются резервной конфигурацией клиента.

Сервер принимает `Authorization: Bearer <Supabase access token>`. Переданный
`user_id` должен совпадать с владельцем токена. Изменения схемы хранятся в
`supabase/migrations`; миграции от 25.11.2026 уже применены к действующему проекту.
Для нового проекта сначала нужна исходная схема таблиц: эти миграции её не создают.

## Проверки

В `client`: `npm run lint`, `npm run build`, `npm audit`.
В `server`: `npm test`, `npm audit`.
Эти проверки также запускаются в GitHub Actions.

На Render задайте `TRUST_PROXY_HOPS=1`, если запросы проходят через его прокси,
и перечислите разрешённые адреса фронтенда в `CORS_ORIGINS`. Для локального
запуска без прокси используйте `TRUST_PROXY_HOPS=0`.
Netlify должен публиковать `client/dist`, включая `_headers` и `_redirects`.
При смене API-домена обновите также `connect-src` в `client/public/_headers`.

Результаты проверки и ограничения: [отчёт](docs/SECURITY_REVIEW.md).
<p>
  <span>Тестовый логин: admin@gmail.com</span>
  <br>
  <span>Тестовый пароль: 12345678</span>
</p>
