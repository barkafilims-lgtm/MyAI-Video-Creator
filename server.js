import express from "express";
import multer from "multer";
import Replicate from "replicate";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

res.sendFile(path.join(__dirname, "index.html"));
app.use(express.static(__dirname));

const token = process.env.REPLICATE_API_TOKEN;
const model = process.env.REPLICATE_MODEL || "minimax/video-01";

const replicate = token ? new Replicate({ auth: token }) : null;

function asUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output[0] || null;
  if (typeof output.url === "function") return output.url().toString();
  if (output.url) return String(output.url);
  return null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, providerConfigured: Boolean(token), model });
});

app.post("/api/videos/generate", async (req, res) => {
  try {
    if (!replicate) {
      return res.status(503).json({
        error: "REPLICATE_API_TOKEN is not configured on the server."
      });
    }

    const {
      prompt,
      aspectRatio = "16:9",
      duration = 6,
      mode = "text"
    } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Please enter a video prompt." });
    }

    // The existing MiniMax Video-01 integration that was tested in the
    // user's project accepts a text prompt. Provider-specific options can
    // be added here without exposing the token to the browser.
    const input = { prompt: prompt.trim() };

    // Keep optional settings provider-neutral. Models that don't accept
    // these fields will simply use their own defaults.
    if (mode === "text") {
      if (aspectRatio) input.aspect_ratio = aspectRatio;
      if ([6, 15, 30, 60].includes(Number(duration))) {
        input.duration = Number(duration);
      }
    }

    const prediction = await replicate.predictions.create({
      model,
      input
    });

    res.json({
      id: prediction.id,
      status: prediction.status,
      output: asUrl(prediction.output)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error?.message || "Video generation failed."
    });
  }
});

app.get("/api/videos/:id", async (req, res) => {
  try {
    if (!replicate) {
      return res.status(503).json({ error: "Provider is not configured." });
    }

    const prediction = await replicate.predictions.get(req.params.id);
    res.json({
      id: prediction.id,
      status: prediction.status,
      output: asUrl(prediction.output),
      error: prediction.error || null
    });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Could not check video status." });
  }
});

// Simple image-to-video endpoint. Different Replicate video models use
// different image field names, so this is intentionally configurable.
app.post("/api/images/prepare", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded." });
  const mime = req.file.mimetype || "image/jpeg";
  const data = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
  res.json({ image: data });
});

app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`MyAI Video Creator running on port ${port}`));
