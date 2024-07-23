const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");
const User = require("./models/user_modal");
const Note = require("./models/note_modal");

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_CONNECT);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit();
  }
};

connectDB();

const app = express();
const port = 8000;

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173", // Allow only the specified origin
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow credentials
  })
);
app.options("*", cors());

app.get("/", (req, res) => {
  res.send({ data: "Hello World" });
});

app.post("/create-account", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ Email: email });

    if (userExists) {
      return res.status(500).json({
        msg: "User with the email already exists",
      });
    }

    const user = new User({
      Name: name,
      Email: email,
      Password: password,
    });

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      user,
      accessToken,
      msg: "User Registered Successfully",
    });
  } catch (err) {
    console.error("Error: ", err.stack);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userInfo = await User.findOne({ Email: email, Password: password });

    if (!userInfo) {
      return res.status(400).json({
        msg: "Wrong email or password",
      });
    }

    const user = { user: userInfo };

    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    return res.json({
      msg: "Login Successfull",
      email,
      accessToken,
    });
  } catch (err) {
    console.error("Login Route : ", err);
    return res.staus(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.get("/get-user", authenticateToken, async (req, res) => {
  const { user } = req.user;

  const isUser = await User.findOne({ _id: user._id });

  if (!isUser) return res.sendStatus(401);

  return res.status(200).json({
    user: {
      Name: isUser.Name,
      Email: isUser.Email,
      _id: isUser._id,
      createdOn: isUser.createdOn,
    },
  });
});

app.post("/add-note", authenticateToken, async (req, res) => {
  const { title, content, tags } = req.body;
  const { user } = req.user;

  try {
    const note = new Note({
      Title: title,
      Content: content,
      Tags: tags || [],
      userId: user._id,
    });

    await note.save();

    return res.json({
      note,
      msg: "Note added Successfully",
    });
  } catch (err) {
    console.error("Add Note Route : ", err);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.put("/edit-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res.status(404).json({
        msg: "Note not Found",
      });
    }

    if (title !== undefined) note.Title = title;
    if (content !== undefined) note.Content = content;
    if (tags !== undefined) note.Tags = tags;
    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();

    return res.status(200).json({
      note,
      msg: "Updated note Successfully",
    });
  } catch (err) {
    console.error("Edit Note Route : ", err);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.get("/get-all-notes", authenticateToken, async (req, res) => {
  const { user } = req.user;

  try {
    const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });

    return res.json({
      notes,
      message: "All notes retreived Successfully",
    });
  } catch (err) {
    console.error("Get All Note Route : ", err);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.delete("/delete-note/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res.status(404).json({
        msg: "Note not Found",
      });
    }

    await Note.deleteOne({ _id: noteId, userId: user._id });

    return res.status(200).json({
      msg: "Note delted Successfully",
    });
  } catch (err) {
    console.error("Delete Note Route : ", err);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.put("/update-note-pinned/:noteId", authenticateToken, async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;
  const { user } = req.user;

  try {
    const note = await Note.findOne({ _id: noteId, userId: user._id });

    if (!note) {
      return res.status(404).json({
        msg: "Note not Found",
      });
    }

    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();

    return res.status(200).json({
      note,
      msg: "Updated Note Pin Successfully",
    });
  } catch (err) {
    console.error("Update Note Pin Route : ", err);
    return res.status(500).json({
      msg: "Internal Server Error",
    });
  }
});

app.listen(port, () => {
  console.log(`App started running on port ${port}`);
});

module.exports = app;
