import React, { useState } from "react";
import {
  Button,
  Form,
  FormGroup,
  FormControl,
  FormLabel,
  Alert,
} from "react-bootstrap";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        // Assuming credentials are handled securely on the backend
      });

      const data = await response.json();

      if (response.ok) {
        // Assuming the backend correctly creates a session and/or returns a relevant response
        onLoginSuccess(); // Signal parent component that login was successful
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (error) {
      console.log(error);
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <Form onSubmit={handleLogin}>
        <FormGroup>
          <FormLabel htmlFor="username">Username:</FormLabel>
          <FormControl
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel htmlFor="password">Password:</FormLabel>
          <FormControl
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormGroup>
        <Button variant="primary" type="submit">
          Login
        </Button>
        {error && <Alert variant="danger">{error}</Alert>}
      </Form>
    </div>
  );
}

export default Login;
