import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import { usersTable } from "./db/schema";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

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

const authoriseUser = (token: string | undefined) => {
  // if token doesnt exist, dont continue
  if (!token) {
    console.log("NO TOKENNNNN");
    throw new Error(`Token verification failed NO TOKENNNNNN`);
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded; // Returns the decoded token payload
  } catch (error) {
    throw new Error(`Token verification failed: ${error}`);
  }
};

app.get("/turso-users", async (req: Request, res: Response) => {
  try {
    const token = req.headers["authorization"];
    authoriseUser(token); // Verify the token
    const data = await db.select().from(usersTable).all(); // Fetch data
    res.json({ data });
  } catch (error) {
    res.status(401).json({ error: error }); // Unauthorized access
  }
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
  const decodedUser = authoriseUser(token);
  const user = decodedUser as User;
  res.json({ message: `Hello, ${user.username}`, user });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
