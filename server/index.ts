import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { usersTable } from "./db/schema";
import { createClient } from "@libsql/client/.";
import { drizzle } from "drizzle-orm/libsql";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

app.use(cors());

require("dotenv").config();

export const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const db = drizzle(client);

// User type definition
interface User {
  username: string;
  password: string;
}

const users: User[] = []; // Simulate a simple in-memory "database"
const SECRET_KEY = "your-secret-key";

app.get("/turso-users", async (req: Request, res: Response) => {
  const data = await db.select().from(usersTable).all();
  res.json({ data: data });
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.json({ message: "User registered successfully" });
});

app.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  // find user in the "Database"
  const user = users.find((u: User) => u.username === username);

  // if the sign in details are correct
  if (user && (await bcrypt.compare(password, user.password))) {
    // create a JWT and send it in the response
    const token = jwt.sign(
      { username: user.username, role: "Admin" },
      SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});

app.get("/protected", (req: Request, res: Response) => {
  // check headers for token
  const token = req.headers["authorization"];

  // if token doesnt exist, dont continue
  if (!token) {
    res.status(401).json({ message: "Token required" });
    return;
  }

  // if token exists, verify it
  jwt.verify(token, SECRET_KEY, (err, decodedUser) => {
    // if not verified, dont continue
    if (err) {
      res.status(403).json({ message: "Invalid token" });
      return;
    }
    // cast decoded JWT to user type and send in response
    const user = decodedUser as User;
    res.json({ message: `Hello, ${user.username}`, user });
  });
});

app.post("/logout", (req: Request, res: Response) => {
  // just send a success message to the front end, to alert it to remove from state, storage, cookie, wherever
  // the token is stored
  res.json({ message: "Logged out successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
