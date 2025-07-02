import redis from "../../../redis-client.js"; // ✅ Use default import

function getSessionKey(token) {
  return `session:${token}`;
}

export async function GET(request) {
  if (!redis) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Redis client not initialized",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => {
        const index = c.indexOf("=");
        if (index < 0) return [];
        return [c.slice(0, index).trim(), c.slice(index + 1).trim()];
      })
      .filter((pair) => pair.length === 2)
  );

  const sessionToken = cookies.session;

  if (!sessionToken) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "No session cookie found",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const email = await redis.get(getSessionKey(sessionToken));

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid or expired session",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Redis error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}