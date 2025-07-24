const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const onboardingRoutes = require("./routes/onboarding");
const authRoutes = require("./routes/auth");
const inventoryRoutes = require("./routes/inventory");
const salesRoutes = require("./routes/transaction");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS check again"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

connectDB();

app.get("/test/hello", (req, res) => {
  console.log("api made");
  res.send("hello world");
});

app.get("/api/server/wakeup", (_, res) => {
  console.log("✅ Server received wake-up ping");
  res.status(204).send(); // No content
});

// Use onboarding routes
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.listen(PORT, () => {
  console.log("====================================");
  console.log(" 🚀  POS Server is up and running!  🚀");
  console.log("====================================");
  console.log(`🔥 Listening on: http://localhost:${PORT}`);
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("====================================\n");
});