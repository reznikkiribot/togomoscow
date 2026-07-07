# Google Sheet ↔ togomoscow — двусторонняя синхронизация

Таблица как «пульт» для всех заведений: правишь ячейку (например, добавляешь сайт)
→ приложение реагирует **сразу** и подтягивает данные к себе. Плюс ежедневный
парсинг сайтов/VK/Telegram уже работает на бэкенде.

## Как это устроено
- Backend: `GET /api/sheet/export?secret=...` (выгрузка всех заведений в таблицу),
  `POST /api/sheet/sync?secret=...` (приём одной отредактированной строки).
- Защита — общий секрет `SHEET_SECRET` (уже сгенерирован в `backend/.env`).
- В таблице — Google Apps Script: при сохранении ячейки шлёт строку на `/sheet/sync`.

## Настройка (один раз, ~5 минут)
1. Создай новую Google‑таблицу. Первая строка — заголовки **ровно**:
   `id | name | category | address | phone | website | telegram | vk | menu`
2. **Расширения → Apps Script**, вставь код из `apps-script.gs` (ниже).
3. В коде заполни `API` (адрес бэкенда) и `SECRET` (значение `SHEET_SECRET` из `backend/.env`).
4. Сохрани. Обнови таблицу → появится меню **togomoscow**:
   - **Загрузить все заведения** — заполняет таблицу всеми заведениями из приложения.
   - После этого любая правка ячейки (website/telegram/vk/menu/phone/address/name)
     автоматически уходит в приложение при сохранении.
5. Дай разрешения при первом запуске (Google спросит).

Колонки:
- `website` — сайт заведения (его и парсим).
- `telegram` — @канал или ссылка `t.me/...`.
- `vk` — короткое имя группы или `vk.com/...`.
- `menu` — позиции по строкам: `Название|Цена|DISH` или `...|DRINK` (через ; или перенос строки).
  Пример: `Капучино|220|DRINK; Чизкейк|450|DISH`.

`id` менять нельзя — это ключ заведения. Новые заведения через таблицу пока не создаются
(только редактирование существующих) — добавление новых сделаем отдельно при необходимости.

---

## apps-script.gs

```javascript
const API = 'https://app.togomoscow.ru/api'; // адрес бэкенда
const SECRET = 'ВСТАВЬ_SHEET_SECRET_ИЗ_backend/.env';
const HEADERS = ['id','name','category','address','phone','website','telegram','vk','menu'];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('togomoscow')
    .addItem('1. Включить авто-синхронизацию', 'setup')
    .addItem('2. Загрузить все заведения', 'pullAll')
    .addToUi();
}

// Installs an EDITABLE trigger (simple onEdit can't make external requests).
function setup() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onEditSync') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditSync')
    .forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  SpreadsheetApp.getActive().toast('Авто-синхронизация включена');
}

// Pull every venue from the app into the sheet (paged).
function pullAll() {
  const sh = SpreadsheetApp.getActiveSheet();
  sh.clear();
  sh.appendRow(HEADERS);
  let offset = 0;
  const limit = 1000;
  while (true) {
    const url = API + '/sheet/export?secret=' + encodeURIComponent(SECRET)
      + '&offset=' + offset + '&limit=' + limit;
    const rows = JSON.parse(UrlFetchApp.fetch(url, { muteHttpExceptions: true }).getContentText());
    if (!rows.length) break;
    const values = rows.map(r => HEADERS.map(h => r[h] || ''));
    sh.getRange(sh.getLastRow() + 1, 1, values.length, HEADERS.length).setValues(values);
    offset += rows.length;
    if (rows.length < limit) break;
  }
  SpreadsheetApp.getActive().toast('Готово: ' + (sh.getLastRow() - 1) + ' заведений');
}

// Installable trigger handler → pushes the edited row to the app immediately.
function onEditSync(e) {
  const sh = e.range.getSheet();
  const row = e.range.getRow();
  if (row === 1) return; // header
  const values = sh.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const payload = {};
  HEADERS.forEach((h, i) => payload[h] = values[i]);
  if (!payload.id) return;
  UrlFetchApp.fetch(API + '/sheet/sync?secret=' + encodeURIComponent(SECRET), {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
```

Важно: используется **устанавливаемый** триггер (`setup` создаёт его), потому что
простой `onEdit` в Apps Script не имеет права делать внешние запросы. Поэтому в меню
сначала «1. Включить авто-синхронизацию», потом «2. Загрузить все заведения».
```
