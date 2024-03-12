import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";

function AuthView({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    fetch(` http://127.0.0.1:5000/api/handle-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          onLoginSuccess();
        } else {
          setErrorMessage(data.error || "Failed to login");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMessage("Failed to login");
      });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    fetch(` http://127.0.0.1:5000/api/handle-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          onLoginSuccess();
        } else {
          setErrorMessage(data.error || "Failed to register");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setErrorMessage("Failed to register");
      });
  };

  return (
    <div>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={isRegistering ? handleRegister : handleLogin}>
        <Form.Group controlId="formBasicEmail">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formBasicPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          {isRegistering ? "Register" : "Login"}
        </Button>
        <Button variant="link" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </Button>
      </Form>
    </div>
  );
}

export default AuthView;
