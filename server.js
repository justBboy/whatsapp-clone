import express from "express";
import mongoose from "mongoose";
import Message from "./dbMessages.js";
import Pusher from "pusher";
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());


const port = process.env.PORT || 5000;

const pusher = new Pusher({
  appId: "1099953",
  key: "6300e0dbc885cf32bbd0",
  secret: "189a23d91a2c8d321df6",
  cluster: "mt1",
  useTLS: true,
});

mongoose.connect(
  "mongodb+srv://bboy:justbboy@portfolio.qqmhs.gcp.mongodb.net/whatsappdb?retryWrites=true&w=majority",
  {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;

db.once("open", () => {
  console.log("db connection established");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log("a change occured " + change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher
        .trigger("messages", "inserted", {
          name: messageDetails.user,
          message: messageDetails.message,
          timestamp: messageDetails.timestamp,
          received: messageDetails.received,
        })
        .catch((err) => console.log(err));
    } else {
      console.log("Error triggering pusher");
    }
  });
});

app.get("/", (req, res) => res.status(200).send("hello world"));

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Message.create(dbMessage, (err, data) => {
    if (err) {
      return res.status(400).send(err);
    } else {
      return res.status(201).send(data);
    }
  });
});

app.get("/messages/sync", (req, res) => {
  Message.find((err, data) => {
    if (err) {
      return res.status(400).send(err);
    } else {
      return res.status(200).send(data);
    }
  });
});

app.listen(port, () => console.log("server running"));
