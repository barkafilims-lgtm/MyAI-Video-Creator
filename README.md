# MyAI Video Creator

A small, real AI-video web app for Replit.

## Required secret

In Replit Secrets, add:

`REPLICATE_API_TOKEN` = your Replicate token

Optional:

`REPLICATE_MODEL` = the Replicate video model you want to use.

The browser never receives the API token.

## Run

```bash
npm install
npm start
```

Replit should expose the app on its web preview.

## Important

Video models differ in their supported input fields, durations and aspect ratios. The server keeps the provider call in one place (`/api/videos/generate`) so the model can be swapped without rebuilding the UI.

The tested project previously used MiniMax Video-01 and successfully returned a real MP4. If your Replicate account/model uses a different model identifier or input schema, set `REPLICATE_MODEL` and adjust the `input` object in `server.js`.

Voice, subtitles and music are represented in the UI but require a separate audio/rendering pipeline. This starter intentionally does not fake those features.
