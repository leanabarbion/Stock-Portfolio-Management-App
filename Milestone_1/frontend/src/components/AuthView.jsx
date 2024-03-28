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
  const [isLoginView, setIsLoginView] = useState(true);
  const toggleView = () => setIsLoginView(!isLoginView);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
          credentials: "include",
        }
      );

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

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }), // Include email for sign-up
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setIsLoginView(true); // Switch to login view
        setError(""); // Clear any existing errors
        // Optionally, set a success message or state to inform the user that they can now log in
        // For demonstration, we're using setError, but you might use a different state or method
        setError("Sign up successful. Please log in.");
      } else {
        setError(data.error || "Failed to sign up.");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to connect to the server.");
    }
  };

  return (
    <div>
      <h2>{isLoginView ? "Login" : "Sign Up"}</h2>
      <Form onSubmit={isLoginView ? handleLogin : handleSignUp}>
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
          {isLoginView ? "Login" : "Sign Up"}
        </Button>
        <Button variant="link" onClick={toggleView}>
          {isLoginView ? "Need an account? Sign Up" : "Have an account? Login"}
        </Button>
        {error && <Alert variant="danger">{error}</Alert>}
      </Form>
    </div>
  );
}

export default Login;
