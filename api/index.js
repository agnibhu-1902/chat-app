import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { userModel } from "./models/User.js";
import { messageModel } from "./models/Message.js";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import cors from "cors";
import fs from "fs";
import { WebSocketServer } from "ws";
import path from 'path';
import { fileURLToPath } from 'url';

const port = process.env.PORT || 4000;
const bcryptSalt = bcrypt.genSaltSync(10);

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database connected!"))
  .catch(() => console.log("Cannot connect database!"));

const app = express();

app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  })
);
app.use(express.json());
app.use('/uploads', express.static(__dirname + '/uploads'))
app.use(cookieParser());

function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token)
      jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    else reject("no token");
  });
}

app.get("/test", (req, res) => {
  res.send("Test OK");
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await messageModel
      .find({
        sender: { $in: [userId, ourUserId] },
        recipient: { $in: [userId, ourUserId] },
      })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(401).json(err);
  }
});

app.get("/profile", async (req, res) => {
  try {
    const userData = await getUserDataFromRequest(req);
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

app.get("/people", async (req, res) => {
  const users = await userModel.find({}, { _id: true, username: true });
  res.json(users);
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await userModel.create({
      username,
      password: hashedPassword,
    });
    jwt.sign(
      { userId: createdUser._id, username },
      process.env.JWT_SECRET,
      (err, token) => {
        if (err) throw err;
        res
          .cookie("token", token, { sameSite: "none", secure: true })
          .status(200)
          .json({
            id: createdUser._id,
          });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json("error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const foundUser = await userModel.findOne({ username });
    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk)
        jwt.sign(
          { userId: foundUser._id, username },
          process.env.JWT_SECRET,
          (err, token) => {
            if (err) throw err;
            res
              .cookie("token", token, { sameSite: "none", secure: true })
              .status(200)
              .json({
                id: foundUser._id,
                username: foundUser.username,
              });
          }
        );
      else res.json("password invalid");
    } else res.json("user not found");
  } catch (err) {
    console.error(err);
    res.status(500).json("error");
  }
});

app.post("/logout", (req, res) => {
  res
    .cookie("token", "", { sameSite: "none", secure: true })
    .status(200)
    .json("ok");
});

const server = app.listen(port, () =>
  console.log(`Server started on http://localhost:${port}`)
);

// read usename and id from the cooke for this connection
const wss = new WebSocketServer({ server });
wss.on("connection", (connection, req) => {
  function notifyAboutOnlinePeople() {
    [...wss.clients].forEach((client) => {
      client.send(
        JSON.stringify({
          online: [...wss.clients].map((c) => ({
            userId: c.userId,
            username: c.username,
          })),
        })
      );
    });
  }

  connection.isAlive = true;
  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();
    }, 1000);
  }, 5000);

  connection.on("pong", () => {
    clearTimeout(connection.deathTimer);
  });

  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(",")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }

  // read the message from the client
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text, file } = messageData.message;
    let filename = null;
    if (file) {
        const parts = file.name.split('.')
        const ext = parts[parts.length - 1];
        filename = `${Date.now()}.${ext}`
        const path = __dirname + "/uploads/" + filename
        const bufferData = Buffer.from(file.data.split(',')[1], 'base64')
        fs.writeFile(path, bufferData, () => console.log('File saved: ' + path))
    }
    if (recipient && (text || file)) {
      const messageDoc = await messageModel.create({
        sender: connection.userId,
        recipient,
        text,
        file: file ? filename : null
      });
      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              sender: connection.userId,
              recipient,
              file: file ? filename : null,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  // notify everyone about who is online
  notifyAboutOnlinePeople();
});
