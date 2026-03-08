const API_BASE = "http://localhost:5002/api/auth";

export async function signupUser(data) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Signup failed");
  }

  return json;
}
