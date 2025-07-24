# Yandex HomeKit
Добавляет устройства из Умного Дома Яндекса в HomeKit

> [!CAUTION]
> 
> Разработка проекта прекращена. [issue](https://github.com/Mon4ik/yandex-homekit/issues/15)
>
> Как альтернативу, могу посоветовать [Home Assistant](https://www.home-assistant.io).
 
## Установка и запуск
1. Установить через:
   - NPM:
     ```shell
     npm i -g yandex-homekit@latest
     ```
   - Вручную:
     ```shell
     gh repo clone Mon4ik/yandex-homekit
     # git clone https://github.com/Mon4ik/yandex-homekit.git
     
     cd yandex-homekit
     pnpm i
     pnpm build
     pnpm link .
     
     yandex-homekit
     ```
   - Docker:
     _пока что нету, сорри)_
2. Первый запуск для создания конфигов
   ```shell
   yandex-homekit start
   # напишет сверху всякие ошибки
   # но самое главное что создаст конфиги по пути:
   #  > ~/.yandex-homekit
   ```
3. Создаём API клиент на [oauth.yandex.ru](https://oauth.yandex.ru) c:
   - запрашиваемыми правами
     ```text
     iot:view
     iot:control
     ```
   - Redirect URI
     ```text
     http://<локальный IP сервера>:13370/callback
     ```
4. Открываем `~/.yandex-homekit/config.json` и заполняем конфиг:
   ```json
   {
     "client": {
       "id": "CLIENT ID",
       "secret": "CLIENT SECRET"
     }
   }
5. Запускаем OAuth сервер и входим в аккаунт через:
   ```shell
   yandex-homekit oauth
   # можно можно поставить флаг -o для открытия сайта в браузере:
   #  $ yandex-homekit oauth -o
   ```
6. Готово! Теперь можем запустить мост и добавить его по QR-коду в HomeKit!
   ```shell
   yandex-homekit start
   ```

## Известные ошибки
- HomeKit не может сразу содержать `ColorTemperature` и `Hue/Saturation`, так что мне придётся танцевать с бубном для правильной работы лампочек с выбором кельвинов и цвета [(#1)](https://github.com/Mon4ik/yandex-homekit/issues/1)

[//]: # (## Поддержка)
[//]: # (Я в одиночку не смогу поддерживать всё и вся, так что вы можете скидывать в Issues форматы реальных умений &#40;см. [CONTRIBUTION.md]&#40;&#41;&#41;)
