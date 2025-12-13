async function testSignup() {
  const testUser = {
    email: `testuser${Date.now()}@nepal-auction.com`,
    phone: "9841234567",
    password: "TestPassword123",
    name: "Test User",
  };

  console.log("📝 Testing signup API with:", { email: testUser.email, phone: testUser.phone });

  try {
    const response = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testUser.email,
        phone: testUser.phone,
        password: testUser.password,
        name: testUser.name,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Signup successful!");
      console.log("User:", data.user);
      console.log("Token:", data.token ? "✓ JWT token generated" : "✗ No token");

      // Now test login with the same credentials
      console.log("\n🔐 Testing login API...");
      const loginResponse = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        console.log("✅ Login successful!");
        console.log("User:", loginData.user);
        console.log("Token:", loginData.token ? "✓ JWT token generated" : "✗ No token");
      } else {
        console.log("❌ Login failed:", loginData.error);
      }
    } else {
      console.log("❌ Signup failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testSignup();
