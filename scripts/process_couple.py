from io import BytesIO
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SRC = ASSETS / "couple-original.png"
IVORY = (245, 237, 220)
IVORY_WARM = (251, 245, 230)
GOLD_WASH = (242, 230, 201)


def ivory_backdrop(size: tuple[int, int]) -> Image.Image:
    w, h = size
    bg = Image.new("RGB", size, IVORY_WARM)
    wash = Image.new("RGB", size, GOLD_WASH)
    mask = Image.linear_gradient("L").resize((1, h)).resize(size)
    return Image.composite(wash, bg, mask)


def rembg_cutout(src: Image.Image) -> Image.Image:
    buf = BytesIO()
    src.convert("RGB").save(buf, "PNG")
    session = new_session("u2net")
    return Image.open(BytesIO(remove(buf.getvalue(), session=session))).convert("RGBA")


def expand_subject_mask(cut: Image.Image) -> Image.Image:
    alpha = cut.getchannel("A")
    solid = alpha.point(lambda p: 255 if p > 24 else 0)
    bbox = solid.getbbox()
    if not bbox:
        return alpha

    left, top, right, bottom = bbox
    w, h = cut.size
    grown = Image.new("L", cut.size, 0)
    draw = ImageDraw.Draw(grown)
    pad_x = int(w * 0.03)
    lower = min(h - 8, int(h * 0.94))
    draw.rounded_rectangle(
        (max(0, left - pad_x), top + int((bottom - top) * 0.22), min(w, right + int(w * 0.02)), lower),
        radius=int(min(w, h) * 0.14),
        fill=255,
    )
    draw.ellipse(
        (int(w * 0.08), int(h * 0.46), int(w * 0.44), int(h * 0.82)),
        fill=255,
    )

    merged = ImageChops.lighter(solid, grown)
    merged = merged.filter(ImageFilter.MaxFilter(11))
    merged = merged.filter(ImageFilter.GaussianBlur(radius=3.5))
    return merged


def grade_subject(rgb: Image.Image, mask: Image.Image) -> Image.Image:
    graded = rgb.convert("RGB")
    graded = ImageEnhance.Color(graded).enhance(0.97)
    graded = ImageEnhance.Contrast(graded).enhance(0.98)
    ivory = Image.new("RGB", graded.size, IVORY)
    graded = Image.blend(graded, ivory, 0.06)
    out = graded.convert("RGBA")
    out.putalpha(mask)
    return out


def edge_ivory_wash(size: tuple[int, int]) -> Image.Image:
    w, h = size
    keep = Image.new("L", size, 0)
    draw = ImageDraw.Draw(keep)
    draw.rounded_rectangle(
        (int(w * 0.06), int(h * 0.04), w - int(w * 0.06), h - int(h * 0.08)),
        radius=int(min(w, h) * 0.16),
        fill=255,
    )
    keep = keep.filter(ImageFilter.GaussianBlur(radius=28))
    return keep


def compose(src: Image.Image, cut: Image.Image) -> Image.Image:
    mask = expand_subject_mask(cut)
    subject = grade_subject(src, mask)
    bg = ivory_backdrop(src.size).convert("RGBA")
    merged = Image.alpha_composite(bg, subject)
    keep = edge_ivory_wash(src.size)
    return Image.composite(merged.convert("RGB"), ivory_backdrop(src.size), keep)


def save_webp(im: Image.Image, path: Path) -> None:
    im.convert("RGB").save(path, "WEBP", quality=90, method=6)
    print(f"wrote {path.name} {path.stat().st_size} bytes {im.size}")


def main() -> None:
    src = Image.open(SRC).convert("RGB")
    print("source", src.size)
    cut = rembg_cutout(src)
    print("cutout", cut.mode)
    out = compose(src, cut)
    save_webp(out, ASSETS / "couple-hero.webp")
    save_webp(out, ASSETS / "couple-story.webp")


if __name__ == "__main__":
    main()
