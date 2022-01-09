const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;
const dbPath = path.join(__dirname, "userData.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running http://localhost3000/");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
// API 1

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
    select * from user 
    where 
    username = "${username}";`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    if (password.length >= 5) {
      const createUser = `
           INSERT INTO user 
           (username,name,password,gender,location) 
           values (
            "${username}",
             "${name}",
             "${hashPassword}",
             "${gender}",
             "${location}");`;
      const createQuery = await db.run(createUser);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// API 2
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getLoginQuery = `
    select * from user 
    where 
    username = "${username}";`;
  const dbData = await db.get(getLoginQuery);
  if (dbData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordEqual = await bcrypt.compare(password, dbData.password);
    if (isPasswordEqual === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashPassword = await bcrypt.hash(newPassword, 10);
  const getLoginQuery = `
    select * from user 
    where 
    username = "${username}";`;
  const dbDate = await db.get(getLoginQuery);
  if (dbDate === undefined) {
    response.status(400);
    response.send("Invalid password");
  } else {
    const isPasswordMatch = await bcrypt.compare(oldPassword, dbDate.password);
    if (isPasswordMatch === true) {
      if (newPassword.length >= 5) {
        const updatePasswordQuery = `
               UPDATE user 
               SET password = "${hashPassword}"
               where 
               username = "${username}"`;
        const updatePassword = await db.run(updatePasswordQuery);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
