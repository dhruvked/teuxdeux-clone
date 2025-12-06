import "dotenv/config";
import cors from "cors";
import express from "express";

import { ensureDefaultUser } from "@/routes/context.js";
import { router } from "@/routes/index.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

ensureDefaultUser().catch((err) => {
  console.error("Failed to ensure default user", err);
  process.exit(1);
});

app.use(router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
