const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Директорията, от която е позволено да се свалят файлове.
const BASE_DIR = path.resolve(__dirname, "public");

app.use(express.static(path.join(__dirname, "public")));
app.get("/favicon.ico", (req, res) => res.status(204).end());

/*
 * Начална страница с кратки инструкции.
 */
app.get("/", (req, res) => {
  res.type("html").send(`
    <!doctype html>
    <html lang="bg">
      <head>
        <meta charset="utf-8" />
        <title>Path Traversal Demo - Калоян Механджийски</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; line-height: 1.5; }
          code { background: #f2f2f2; padding: 2px 5px; border-radius: 4px; }
          .bad { color: #a40000; }
          .good { color: #0b6b25; }
          .box { border: 1px solid #ddd; padding: 16px; border-radius: 8px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <h1>Path Traversal атаки в Node.js уеб приложения</h1>
        <p><strong>Изготвил:</strong> Калоян Механджийски, ф.н. 5MI0700025</p>

        <div class="box">
          <h2 class="bad">Уязвима версия</h2>
          <p>За проверка на коректен вход и резултат използвайте проверете следната URL заявка: http://localhost:3000/download-vulnerable?file=hello.txt</p>
		  <p>Резултат: трябва да върне публичния файл.</p>
		  
          <p>За опит за атака проверете следната URL заявка: http://localhost:3000/download-vulnerable?file=../private/secret.txt</p>
		  <p>Резултат: това трябва да покаже проблема — уязвимият endpoint връща secret файла.</p>
        </div>

        <div class="box">
          <h2 class="good">Защитена версия</h2>
		  <p>За опит за атака проверете следната URL заявка: http://localhost:3000/download-secure?file=../private/secret.txt</p>
		  <p>Резултат: Access denied. Тоест проектът работи правилно, ако последният endpoint блокира заявката.</p>
        </div>
      </body>
    </html>
  `);
});

/*
 * УЯЗВИМ ENDPOINT
 *
 * Проблем:
 * Потребителят контролира параметъра "file".
 * Той се комбинира с __dirname без реална проверка дали остава в public/.
 *
 * Пример:
 * /download-vulnerable?file=../private/secret.txt
 */
app.get("/download-vulnerable", (req, res) => {
  const file = req.query.file;

  if (!file) {
    return res.status(400).send("Missing file parameter.");
  }

  const unsafePath = path.join(__dirname, "public", file);

  fs.readFile(unsafePath, "utf8", (err, data) => {
    if (err) {
      return res.status(404).send("File not found.");
    }

    res.type("text/plain").send(data);
  });
});

/*
 * ЗАЩИТЕН ENDPOINT
 *
 * Решение:
 * 1. Взимаме потребителския параметър.
 * 2. Нормализираме пътя с path.normalize().
 * 3. Изчисляваме абсолютния път с path.resolve().
 * 4. Проверяваме дали крайният път остава вътре в BASE_DIR.
 * 5. Ако пътят излиза извън public/, връщаме 403 Forbidden.
 */
app.get("/download-secure", (req, res) => {
  const file = req.query.file;

  if (!file) {
    return res.status(400).send("Missing file parameter.");
  }

  // Премахва излишни ".", ".." и повтарящи се наклонени черти.
  const normalizedFile = path.normalize(file);

  // Създава абсолютен път спрямо разрешената директория.
  const requestedPath = path.resolve(BASE_DIR, normalizedFile);

  // Гарантира, че requestedPath е вътре в BASE_DIR.
  // Добавяме path.sep, за да избегнем частични съвпадения като:
  // /app/public2 да мине като /app/public.
  const baseWithSeparator = BASE_DIR.endsWith(path.sep) ? BASE_DIR : BASE_DIR + path.sep;

  if (requestedPath !== BASE_DIR && !requestedPath.startsWith(baseWithSeparator)) {
    console.warn(`[BLOCKED] Path Traversal attempt: ${file}`);
    return res.status(403).send("Access denied.");
  }

  fs.readFile(requestedPath, "utf8", (err, data) => {
    if (err) {
      return res.status(404).send("File not found.");
    }

    res.type("text/plain").send(data);
  });
});

app.listen(PORT, () => {
  console.log(`Path Traversal demo is running on http://localhost:${PORT}`);
  console.log(`Allowed directory: ${BASE_DIR}`);
});
