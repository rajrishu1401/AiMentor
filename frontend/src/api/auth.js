import { DEMO_MODE, DEMO_USER } from '../config/demoMode';

const API_BASE = "http://13.232.0.142/api/auth";

export async function signupUser(data) {
  // Demo mode - simulate successful signup
  if (DEMO_MODE) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("✅ Demo Mode: Signup successful");
        resolve({ message: "Signup successful" });
      }, 500);
    });
  }

  // Real API call
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      try {
        const json = await res.json();
        throw new Error(json.message || "Signup failed");
      } catch {
        throw new Error(`Signup failed with status ${res.status}`);
      }
    }

    const json = await res.json();
    return json;
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error("Backend server is not running. Please start the backend on port 5002.");
    }
    throw error;
  }
}

export async function loginUser(email, password) {
  // Demo mode - simulate successful login
  if (DEMO_MODE) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple demo validation
        if (email && password) {
          console.log("✅ Demo Mode: Login successful");
          resolve({
            token: DEMO_USER.token,
            user: DEMO_USER
          });
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500);
    });
  }

  // Real API call would go here
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return await res.json();
}
