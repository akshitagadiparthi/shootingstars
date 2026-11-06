#!/usr/bin/env bash
# Turns your exported reels into small, web-ready files for the website.
#
#   ./tools/prepare-reels.sh path/to/exports/*.mp4
#
# For each video it writes, into assets/reels/:
#   <name>.mp4  720×1280, H.264, about 2–5 MB, starts playing instantly
#   <name>.jpg  a cover frame (taken at 1 second)
# Then add "assets/reels/<name>.mp4" (and .jpg) to the reel's row in the Sheet:
#   column "Video file URL (MP4, optional)" and "Poster image URL (optional)".
#
# Needs ffmpeg: macOS `brew install ffmpeg` · Windows `winget install ffmpeg`.
set -euo pipefail
out="$(dirname "$0")/../assets/reels"
mkdir -p "$out"
for f in "$@"; do
  name="$(basename "${f%.*}" | tr '[:upper:] ' '[:lower:]-')"
  ffmpeg -y -loglevel error -i "$f" \
    -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,fps=30" \
    -c:v libx264 -preset veryfast -crf 26 -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 128k -movflags +faststart "$out/$name.mp4"
  ffmpeg -y -loglevel error -ss 1 -i "$out/$name.mp4" -frames:v 1 -q:v 4 "$out/$name.jpg"
  echo "✓ $name.mp4 ($(du -h "$out/$name.mp4" | cut -f1)) + $name.jpg"
done
