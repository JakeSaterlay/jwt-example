import { useState } from "react";
import axios from "axios";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState<any>(null);

  const register = async () => {
    try {
      await axios.post("http://localhost:3000/register", {
        username,
        password,
      });
      alert("User registered successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const login = async () => {
    try {
      const response = await axios.post("http://localhost:3000/login", {
        username,
        password,
      });
      console.log("TOKEN", response.data.token);
      setToken(response.data.token);
      setMessage("Logged in successfully");
    } catch (error) {
      setMessage("Login failed");
      console.error(error);
    }
  };

  const accessProtected = async () => {
    try {
      const response = await axios.get("http://localhost:3000/protected", {
        headers: { Authorization: token },
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage("Access denied");
      console.error(error);
    }
  };

  const logout = async () => {
    setToken(null);
    setMessage("Logged Out");
  };

  const getUsersFromDb = async () => {
    const response = await axios.get("http://localhost:3000/turso-users");
    setUsers(response.data.data);
  };

  return (
    <div className="p-10">
      <h1>JWT Authentication Example</h1>
      <div className="flex gap-1 mb-2">
        <input
          className="border-solid border-2 border-sky-500"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border-solid border-2 border-sky-500"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col items-start gap-1">
        <button className="bg-gray-500 text-white p-2" onClick={register}>
          Register
        </button>
        <button className="bg-gray-500 text-white p-2" onClick={login}>
          Login
        </button>
        <button className="bg-gray-500 text-white p-2" onClick={logout}>
          Logout
        </button>
        <button
          className="bg-gray-500 text-white p-2"
          onClick={accessProtected}
        >
          Access Protected Route
        </button>
        <button className="bg-gray-500 text-white p-2" onClick={getUsersFromDb}>
          Get users from DB
        </button>
      </div>
      <p className="text-red-500">{message}</p>
      {users && users.map((user: any) => <div>{user.name}</div>)}
    </div>
  );
}

export default App;
