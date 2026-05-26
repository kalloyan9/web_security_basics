const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Директорията, от която е позволено да се свалят файлове.
const BASE_DIR = path.resolve(__dirname, "public");

app.use(express.static(path.join(__dirname, "public")));
app.get("/favicon.ico", (req, res) => res.status(204).end());

function renderResultPage(title, result, statusClass = "info") {
  return `
    <!doctype html>
    <html lang="bg">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            line-height: 1.5;
            color: #222;
          }

          .result-box {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            background: #fafafa;
          }

          .danger {
            border-left: 6px solid #a40000;
          }

          .success {
            border-left: 6px solid #0b6b25;
          }

          .blocked {
            border-left: 6px solid #d88900;
          }

          pre {
            background: #f2f2f2;
            padding: 14px;
            border-radius: 6px;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .back-button {
            display: inline-block;
            margin-top: 14px;
            padding: 8px 14px;
            background: #333;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 14px;
          }

          .back-button:hover {
            background: #111;
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>

        <div class="result-box ${statusClass}">
          <pre>${result}</pre>
        </div>

        <a class="back-button" href="/">Назад</a>
      </body>
    </html>
  `;
}

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
          body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            line-height: 1.5;
            color: #222;
          }

          code {
            background: #f2f2f2;
            padding: 2px 5px;
            border-radius: 4px;
          }

          .bad {
            color: #a40000;
          }

          .good {
            color: #0b6b25;
          }

          .box {
            border: 1px solid #ddd;
            padding: 18px;
            border-radius: 8px;
            margin: 18px 0;
            background: #fafafa;
          }

          .request {
            margin-top: 12px;
            padding: 12px;
            background: white;
            border: 1px solid #e1e1e1;
            border-radius: 6px;
          }

          .action-button {
            display: inline-block;
            margin-top: 8px;
            padding: 7px 12px;
            background: #1f3a5f;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 14px;
          }

          .action-button:hover {
            background: #14263f;
          }

          .danger-button {
            background: #a40000;
          }

          .danger-button:hover {
            background: #760000;
          }

          .safe-button {
            background: #0b6b25;
          }

          .safe-button:hover {
            background: #064818;
          }
        </style>
      </head>
      <body>
        <h1>Path Traversal атаки в Node.js уеб приложения</h1>
        <p><strong>Изготвил:</strong> Калоян Механджийски, ф.н. 5MI0700025</p>

        <div class="box">
          <h2 class="bad">Уязвима версия</h2>

          <div class="request">
            <p>
              За проверка на коректен вход и резултат използвайте следната URL заявка:
            </p>
            <code>http://localhost:3000/download-vulnerable?file=hello.txt</code>
            <p>Резултат: трябва да върне публичния файл.</p>
            <a class="action-button" href="/download-vulnerable?file=hello.txt">
              Изпълни заявката
            </a>
          </div>

          <div class="request">
            <p>
              За опит за атака проверете следната URL заявка:
            </p>
            <code>http://localhost:3000/download-vulnerable?file=../private/secret.txt</code>
            <p>
              Резултат: това трябва да покаже проблема — уязвимият endpoint връща secret файла.
            </p>
            <a class="action-button danger-button" href="/download-vulnerable?file=../private/secret.txt">
              Изпълни атаката
            </a>
          </div>
        </div>

        <div class="box">
          <h2 class="good">Защитена версия</h2>

          <div class="request">
            <p>
              За опит за атака проверете следната URL заявка:
            </p>
            <code>http://localhost:3000/download-secure?file=../private/secret.txt</code>
            <p>
              Резултат: Access denied. Проектът работи правилно, ако endpoint-ът блокира заявката.
            </p>
            <a class="action-button safe-button" href="/download-secure?file=../private/secret.txt">
              Изпълни защитена проверка
            </a>
          </div>
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
    return res
      .status(400)
      .type("html")
      .send(renderResultPage("Грешка", "Missing file parameter.", "blocked"));
  }

  const unsafePath = path.join(__dirname, "public", file);

  fs.readFile(unsafePath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(404)
        .type("html")
        .send(renderResultPage("Файлът не е намерен", "File not found.", "blocked"));
    }

    res
      .type("html")
      .send(
        renderResultPage(
          "Резултат от уязвимия endpoint",
          data,
          file.includes("..") ? "danger" : "success"
        )
      );
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
    return res
      .status(400)
      .type("html")
      .send(renderResultPage("Грешка", "Missing file parameter.", "blocked"));
  }

  // Премахва излишни ".", ".." и повтарящи се наклонени черти.
  const normalizedFile = path.normalize(file);

  // Създава абсолютен път спрямо разрешената директория.
  const requestedPath = path.resolve(BASE_DIR, normalizedFile);

  // Гарантира, че requestedPath е вътре в BASE_DIR.
  // Добавяме path.sep, за да избегнем частични съвпадения като:
  // /app/public2 да мине като /app/public.
  const baseWithSeparator = BASE_DIR.endsWith(path.sep)
    ? BASE_DIR
    : BASE_DIR + path.sep;

  if (requestedPath !== BASE_DIR && !requestedPath.startsWith(baseWithSeparator)) {
    console.warn(`[BLOCKED] Path Traversal attempt: ${file}`);

    return res
      .status(403)
      .type("html")
      .send(
        renderResultPage(
          "Access denied",
          "Access denied. Заявката е блокирана, защото се опитва да достъпи файл извън разрешената директория.",
          "blocked"
        )
      );
  }

  fs.readFile(requestedPath, "utf8", (err, data) => {
    if (err) {
      return res
        .status(404)
        .type("html")
        .send(renderResultPage("Файлът не е намерен", "File not found.", "blocked"));
    }

    res
      .type("html")
      .send(renderResultPage("Резултат от защитения endpoint", data, "success"));
  });
});

app.listen(PORT, () => {
  console.log(`Path Traversal demo is running on http://localhost:${PORT}`);
  console.log(`Allowed directory: ${BASE_DIR}`);
});