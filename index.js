const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Chatkit = require("@pusher/chatkit-server");

require("dotenv").config();

const app = express();
const INSTANCE_LOCATOR_ID = process.env.CHATKIT_INSTANCE_LOCATOR_ID;
const CHATKIT_SECRET = process.env.CHATKIT_SECRET_KEY;

const chatkit = new Chatkit.default({
  instanceLocator: INSTANCE_LOCATOR_ID,
  key: CHATKIT_SECRET
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.post("/auth", (req, res) => {
  const { user_id } = req.query;
  const authData = chatkit.authenticate({
    userId: user_id
  });

  res.status(authData.status).send(authData.body);
});

let users = [];
app.get("/users", async (req, res) => {
  try {
    users = await chatkit.getUsers();
    res.send({ users });
  } catch (get_users_err) {
    console.log("error getting users: ", get_users_err);
  }
});

app.post("/user", async (req, res) => {
  // note: don't forget to access http://localhost:5000/users on your browser first
  // because this route depends on the users variable to be filled
  const { username } = req.body;
  try {
    const user = users.find(usr => usr.name == username);
    res.send({ user });
  } catch (get_user_err) {
    console.log("error getting user: ", get_user_err);
  }
});

app.post("/user/permissions", async (req, res) => {
  const { room_id, user_id } = req.body;
  try {
    const roles = await chatkit.getUserRoles({ userId: user_id });
    const role = roles.find(role => role.room_id == room_id);
    const permissions = role ? role.permissions : [];

    res.send({ permissions });
  } catch (user_permissions_err) {
    console.log("error getting user permissions: ", user_permissions_err);
  }
});

app.post("/rooms", async (req, res) => {
  const { user_id } = req.body;
  try {
    const rooms = await chatkit.getUserRooms({
      userId: user_id
    });
    res.send({ total: rooms.length, rooms });
  } catch (get_rooms_err) {
    console.log("error getting rooms: ", get_rooms_err);
  }
});

app.post("/user/create", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await chatkit.createUser({
      id: email,
      name: email
    });
    res.send({ user });
  } catch (get_rooms_err) {
    console.log("error getting rooms: ", get_rooms_err);
  }
});

app.post("/room/create", async (req, res) => {
  const { creatorId, name } = req.body;
  try {
    const rooms = await chatkit.createRoom({
      creatorId,
      name
    });
    res.send({ rooms });
  } catch (get_rooms_err) {
    console.log("error getting rooms: ", get_rooms_err);
  }
});

app.post("/user/check", async (req, res) => {
  const { userId } = req.body;
  let users = [];
  try {
    users = await chatkit.getUser({
      id: userId
    });

    res.send({ success: true, users });
  } catch (get_user_error) {
    if (get_user_error.status === 404) {
      res.send({ success: false });
    }
  }
});

app.post("/room/check", async (req, res) => {
  const { name } = req.body;
  let rooms = [];
  try {
    rooms = await chatkit.getRooms();

    rooms.forEach(element => {
      if (element.name === name) {
        res.send({
          success: true,
          status: 200,
          room: element
        });
      }
    });

    res.send({ success: false, status: 404 });
  } catch (get_user_error) {
    if (get_user_error.status === 404) {
      res.send({ success: false });
    }
  }
});

app.post("/room/add/user", async (req, res) => {
  const { roomId, userIds } = req.body;
  let rooms = [];
  try {
    rooms = await chatkit.addUsersToRoom({
      roomId,
      userIds
    });

    res.send({ success: true, status: 200 });
  } catch (get_user_error) {
    if (get_user_error.status === 404) {
      res.send({ success: false, get_user_err });
    }
  }
});

app.post("/room/check/user", async (req, res) => {
  const { roomId } = req.body;
  let rooms = [];
  try {
    rooms = await chatkit.getRoom({
      roomId
    });

    res.send({ success: true, status: 200, rooms });
  } catch (get_user_error) {
    if (get_user_error.status === 404) {
      res.send({ success: false, get_user_error });
    }
  }
});

const PORT = 5000;
app.listen(PORT, err => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Running on ports ${PORT}`);
  }
});
