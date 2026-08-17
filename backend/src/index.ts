import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import "./types";

import authRoutes from "./routes/auth";
import objectRoutes from "./routes/objects";

dotenv.config();

async function main() {
  const app = express();
  app.set("trust proxy", 1); // required for secure cookies behind Render's proxy
  const PORT = process.env.PORT || 5000;

  app.use(express.json());

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );

  let sessionStore: session.Store | undefined = undefined;

  if (process.env.REDIS_URL) {
    const { RedisStore } = await import("connect-redis");
    const { createClient } = await import("redis");

    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => console.error("Redis Client Error", err));
    await redisClient.connect();

    sessionStore = new RedisStore({ client: redisClient, prefix: "sess:" });
    console.log("Using Redis session store");
  } else {
    console.log("No REDIS_URL set — using default in-memory session store (dev only)");
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 8, //8hrs
      },
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/objects", objectRoutes);

  app.get("/", (_req, res) => {
    res.send("Salesforce CRUD backend is running.");
  });

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});