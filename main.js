// @ts-check

const express = require("express");
const path = require("path");
// const template = require("./public/template.js");
const bodyParser = require("body-parser");
const mongoClient = require("./mongo");

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
const CRUDRouter = express.Router();
app.use("/crud", CRUDRouter);

const PORT = 5000;

const _client = mongoClient.connect();
async function getCRUDCollection() {
  const client = await _client;
  return client.db("crud").collection("diary");
}
app.use("/", async (req, res, next) => {
  let lists = "";
  const crudCollection = await getCRUDCollection();

  const crudCursor = crudCollection.find({});
  const crudContents = await crudCursor.toArray();

  for (const { youtube_link, title } of crudContents) {
    lists += `<tr><td><a href=/crud/read/${youtube_link}><img src=//img.youtube.com/vi/${youtube_link}/0.jpg></td><td><a href=/crud/read/${youtube_link}>${title}</td></tr>`;
  }

  const template_main = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8">
        <title></title>
      </head>
      <body>
          <a href="/crud/creates">글쓰기</a>
          <div>
            <table>
              <tr><td>영상</td><td>제목</td></tr>
              ${lists}
            </table>
          </div>
          <div><a href="/crud/all_delete">전체삭제</div>
      </body>
    </html>
  `;
  res.send(template_main);
  next();
});

CRUDRouter.get("/creates", (req, res) => {
  const template_crud = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title></title>
  </head>
  <body>
    <form class="" action="/crud/create_new" method="post">
      <ul style=''>
        <li><input type="text" name="youtube_link" value="" placeholder="유튜브 링크 입력"></li>
        <li><input type="text" name="title" value="" placeholder="제목"></li>
        <li><textarea name="contents" rows="8" cols="80" placeholder="내용"></textarea></li>
        <li><button type="submit">작성 완료</button></li>
      </ul>
    </form>
  </body>
</html>
`;
  res.send(template_crud);
});

CRUDRouter.post("/create_new", async (req, res) => {
  const { youtube_link, title, contents } = req.body;
  const youtube_code = youtube_link.split("=")[1];
  const crudCollection = await getCRUDCollection();
  await crudCollection.insertOne({
    youtube_link: youtube_code,
    title: title,
    contents: contents,
  });
  res.redirect(`/crud/read/${youtube_code}`);
});

CRUDRouter.get("/read/:id", async (req, res) => {
  const myKey = req.params.id;
  const crudCollection = await getCRUDCollection();
  try {
    var { title, contents } = await crudCollection.findOne({
      youtube_link: myKey,
    });
  } catch (exception) {
    res.redirect(`/`);
  }

  const template_read = `
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body>
      <div>${title}</div>
      <div><iframe height="411" width="730" frameborder="0" src="https://www.youtube.com/embed/${myKey}?autoplay=1&amp;version=3&amp;hd=1&amp;modestbranding=1&amp;rel=0&amp;showinfo=0&amp;fs=1" webkitallowfullscreen="" mozallowfullscreen="" allowfullscreen="" allow="autoplay; fullscreen"></iframe></div>
      <div>${contents}</div>
      <div><a href='/crud/'>HOME</div>
      <div><a href='/crud/updates/${myKey}'>글수정</div>
      <div><a href='/crud/delete/${myKey}'>글삭제</div>
    </body>
  </html>
  `;
  res.send(template_read);
});

CRUDRouter.get("/updates/:id", async (req, res) => {
  const myKey = req.params.id;
  const crudCollection = await getCRUDCollection();
  const { youtube_link, title, contents } = await crudCollection.findOne({
    youtube_link: myKey,
  });

  const template_crud = `
    <!DOCTYPE html>
    <html lang="en" dir="ltr">
      <head>
        <meta charset="utf-8">
        <title></title>
      </head>
      <body>
        <form class="" action="/crud/update_new" method="post">
          <ul style=''>
          <input type="hidden" name="keys" value="${myKey}">
            <li><input type="text" name="youtube_link" value="${youtube_link}" placeholder="유튜브 링크 입력"></li>
            <li><input type="text" name="title" value="${title}" placeholder="제목"></li>
            <li><textarea name="contents" rows="8" cols="80" placeholder="내용" >${contents}</textarea></li>
            <li><button type="submit">작성 완료</button></li>
          </ul>
        </form>
      </body>
    </html>
`;
  res.send(template_crud);
});

CRUDRouter.post("/update_new", async (req, res) => {
  const { keys, youtube_link, title, contents } = req.body;
  if (keys !== youtube_link) {
    var youtube_code = youtube_link.split("=")[1];
  } else {
    var youtube_code = keys;
  }
  const crudCollection = await getCRUDCollection();
  var myquery = { youtube_link: keys };
  var newvalue = {
    $set: {
      youtube_link: youtube_code,
      title: title,
      contents: contents,
    },
  };
  crudCollection.updateOne(myquery, newvalue, function (err, result) {
    if (err) throw err;
  });
  res.redirect(`/crud/read/${youtube_code}`);
});

CRUDRouter.get("/delete/:id", async (req, res) => {
  const youtube_link = req.params.id;
  console.log(youtube_link);
  const crudCollection = await getCRUDCollection();
  await crudCollection.deleteOne({ youtube_link: youtube_link });
  res.redirect(`/`);
});

CRUDRouter.get("/all_delete", async (req, res) => {
  const crudCollection = await getCRUDCollection();
  await crudCollection.deleteMany({});
  res.redirect(`/`);
});

app.listen(PORT, () => {
  console.log(`The app listening at ${PORT}`);
});
