"""
Generate Android launcher icons matching the splash screen design:
- Background: #2D6A4F (primary green)
- Rounded corners (radius = 23% of size)
- 🌾 emoji centered
"""
from PIL import Image, ImageDraw, ImageFont
import os

SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

BG_COLOR = (45, 106, 79)   # #2D6A4F
EMOJI = "🌾"
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
RES_DIR = os.path.join(os.path.dirname(__file__), "../android/app/src/main/res")

# Render at large canvas then scale down for crisp results
RENDER_SIZE = 512

def make_icon_large() -> Image.Image:
    size = RENDER_SIZE
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(size * 0.23)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=BG_COLOR)

    # Try progressively larger font sizes until the emoji fills ~62% of the canvas
    target = int(size * 0.62)
    font = None
    for font_px in [109, 256, 512, 1024]:
        try:
            f = ImageFont.truetype(EMOJI_FONT, font_px)
            bbox = draw.textbbox((0, 0), EMOJI, font=f, embedded_color=True)
            w = bbox[2] - bbox[0]
            if w >= target:
                font = f
                break
            font = f  # keep last valid
        except Exception:
            pass

    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), EMOJI, font=font, embedded_color=True)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    x = (size - w) / 2 - bbox[0]
    y = (size - h) / 2 - bbox[1]
    draw.text((x, y), EMOJI, font=font, embedded_color=True)
    return img.convert("RGBA")

large = make_icon_large()

for folder, size in SIZES.items():
    out_path = os.path.join(RES_DIR, folder, "ic_launcher.png")
    icon = large.resize((size, size), Image.LANCZOS)
    icon.save(out_path)
    print(f"✓ {folder}/ic_launcher.png  ({size}x{size})")

print("Done.")
