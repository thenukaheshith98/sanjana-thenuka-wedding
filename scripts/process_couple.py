from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SRC = ASSETS / "couple-original.png"


def grade(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(0.92)
    rgb = ImageEnhance.Contrast(rgb).enhance(0.94)
    rgb = ImageEnhance.Brightness(rgb).enhance(1.04)
    ivory = Image.new("RGB", rgb.size, (245, 237, 220))
    rgb = Image.blend(rgb, ivory, 0.14)
    gold = Image.new("RGB", rgb.size, (210, 185, 122))
    return Image.blend(rgb, gold, 0.05)


def rounded_mask(size, inset, radius, blur) -> Image.Image:
    w, h = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    l, t, r, b = inset
    draw.rounded_rectangle((l, t, w - r, h - b), radius=radius, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(radius=blur))


def bottom_fade(size, start_ratio=0.68) -> Image.Image:
    w, h = size
    fade = Image.new("L", size, 255)
    draw = ImageDraw.Draw(fade)
    start = int(h * start_ratio)
    for y in range(start, h):
        t = (y - start) / max(1, h - start)
        draw.line([(0, y), (w, y)], fill=int(255 * (1 - t) ** 1.25))
    return fade


def compose(rgb: Image.Image, mask: Image.Image) -> Image.Image:
    out = Image.new("RGBA", rgb.size, (0, 0, 0, 0))
    out.paste(rgb.convert("RGBA"), mask=mask)
    return out


def save_webp(im: Image.Image, path: Path) -> None:
    im.save(path, "WEBP", quality=88, method=6)
    print(f"wrote {path.name} {path.stat().st_size} bytes {im.size}")


def main() -> None:
    src = Image.open(SRC)
    print("source", src.size, src.mode)
    rgb = grade(src)
    w, h = rgb.size

    hero_mask = ImageChops.multiply(
        rounded_mask((w, h), (int(w * 0.03), int(h * 0.025), int(w * 0.03), int(h * 0.08)), int(min(w, h) * 0.075), 28),
        bottom_fade((w, h), 0.68),
    )
    save_webp(compose(rgb, hero_mask), ASSETS / "couple-hero.webp")

    story_mask = rounded_mask(
        (w, h),
        (int(w * 0.02), int(h * 0.02), int(w * 0.02), int(h * 0.02)),
        int(min(w, h) * 0.06),
        16,
    )
    save_webp(compose(rgb, story_mask), ASSETS / "couple-story.webp")


if __name__ == "__main__":
    main()
