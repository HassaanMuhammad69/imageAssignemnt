require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.log(err));

// Schema for storing image and other form data
const itemSchema = new mongoose.Schema({
    name: String,
    description: String,
    imageUrl: String,
});

const Item = mongoose.model("Item", itemSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Route to render form
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "form.html"));
});

// Route to handle form submission
app.post("/upload", upload.single("image"), async (req, res) => {
    const { name, description } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    const newItem = new Item({ name, description, imageUrl });
    await newItem.save();

    res.redirect("/items");
});

// Route to display all items
app.get("/items", async (req, res) => {
    const items = await Item.find({});
    res.send(`
      <html>
      <body>
        <h1>Uploaded Items</h1>
        <ul>
          ${items
            .map(
              item => `
              <li>
                <img src="${item.imageUrl}" width="100"/>
                <p><strong>${item.name}</strong>: ${item.description}</p>
              </li>
            `
            )
            .join("")}
        </ul>
      </body>
      </html>
    `);
});

// Start server
app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
