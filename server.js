const express = require("express");
const app = express();
const port = 4000;
const { query } = require("./database");
require("dotenv").config();

app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(`Request: ${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});
app.use(express.json());

app.post("/books", async (req, res) => {
  const { title, year, author, genre } = req.body;

  try {
    const newBook = await query(
      "INSERT INTO books (title, year, author, genre) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, year, author, genre]
    );

    res.status(201).json(newBook.rows[0]);
  } catch (err) {
    console.error(err);
  }
});

app.get("/books", async (req, res) => {
  try {
    const allBooks = await query("SELECT * FROM books");

    res.status(200).json(allBooks.rows);
  } catch (err) {
    console.error(err);
  }
});

app.get("/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  try {
    const book = await query("SELECT * FROM books WHERE id = $1", [bookId]);

    if (book.rows.length > 0) {
      res.status(200).json(book.rows[0]);
    } else {
      res.status(404).send({ message: "Book not found" });
    }
  } catch (err) {
    console.error(err);
  }
});

// app.patch("/books/:id", async (req, res) => {
//   const bookId = parseInt(req.params.id, 10);

//   const { title, year, author, genre } = req.body;

//   try {
//     const updatedBook = await query(
//       "UPDATE books SET title = $1, year = $2, author = $3, genre = $4 RETURNING *",
//       [title, year, author, genre, bookId]
//     );

//     if (updatedBook.rows.length > 0) {
//       res.status(200).json(updatedBook.rows[0]);
//     } else {
//       res.status(404).send({ message: "Book not found" });
//     }
//   } catch (err) {
//     console.error(err);
//   }
// });

app.patch("/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  const fieldNames = ["title", "year", "author", "genre"].filter(
    (name) => req.body[name]
  );

  let updatedValues = fieldNames.map((name) => req.body[name]);
  const setValuesSQL = fieldNames
    .map((name, i) => {
      return `${name} = $${i + 1}`;
    })
    .join(", ");

  try {
    const updatedBook = await query(
      `UPDATE books SET ${setValuesSQL} WHERE id = $${
        fieldNames.length + 1
      } RETURNING *`,
      [...updatedValues, bookId]
    );

    if (updatedBook.rows.length > 0) {
      res.status(200).json(updatedBook.rows[0]);
    } else {
      res.status(404).send({ message: "Book not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
    console.error(err);
  }
});

app.delete("/books/:id", async (req, res) => {
  const bookId = parseInt(req.params.id, 10);

  try {
    const deleteOp = await query("DELETE FROM books WHERE id = $1", [bookId]);

    if (deleteOp.rowCount > 0) {
      res.status(200).send({ message: "Book deleted successfully" });
    } else {
      res.status(404).send({ message: "Book not found" });
    }
  } catch (err) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
