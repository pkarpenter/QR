import secrets
import string
import io
import segno


def generate_slug(length: int = 8) -> str:
    """Generate a URL-safe random slug (e.g. 'aB3xK9mQ')."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_qr_bytes(url: str, fmt: str = "png", label: str = "") -> bytes:
    """
    Generate QR code and return as bytes.
    fmt: 'png' | 'svg'
    label: optional text to print below the QR image
    """
    qr = segno.make(url, error="h")
    buf = io.BytesIO()

    if fmt == "svg":
        qr.save(buf, kind="svg", scale=10, border=4)
        buf.seek(0)
        svg_bytes = buf.read()
        if label:
            svg_bytes = _add_label_to_svg(svg_bytes, label)
        return svg_bytes
    else:
        qr.save(buf, kind="png", scale=10, border=4)
        buf.seek(0)
        if label:
            return _add_label_to_png(buf, label)
        return buf.read()


def _add_label_to_png(png_buf: io.BytesIO, label: str) -> bytes:
    """Use Pillow to add a text label below a PNG QR code image."""
    from PIL import Image, ImageDraw, ImageFont

    qr_img = Image.open(png_buf).convert("RGBA")
    qr_w, qr_h = qr_img.size

    # Font sizing — try to load a bundled TTF, fall back to default bitmap
    font_size = max(22, qr_w // 14)
    try:
        import os
        font_candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "arial.ttf",
        ]
        font = None
        for fc in font_candidates:
            if os.path.exists(fc):
                font = ImageFont.truetype(fc, font_size)
                break
        if font is None:
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    # Measure text size
    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    bbox = dummy.textbbox((0, 0), label, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    padding_top = 10
    padding_bottom = 14
    label_area_h = text_h + padding_top + padding_bottom

    # New canvas: QR + label strip below
    new_w = max(qr_w, text_w + 20)
    new_h = qr_h + label_area_h
    canvas = Image.new("RGBA", (new_w, new_h), (255, 255, 255, 255))

    # Paste QR image (centered horizontally if canvas is wider)
    qr_x = (new_w - qr_w) // 2
    canvas.paste(qr_img, (qr_x, 0))

    # Draw label
    draw = ImageDraw.Draw(canvas)
    text_x = (new_w - text_w) // 2
    text_y = qr_h + padding_top
    # Shadow for readability
    draw.text((text_x + 1, text_y + 1), label, font=font, fill=(0, 0, 0, 60))
    draw.text((text_x, text_y), label, font=font, fill=(30, 30, 30, 255))

    out = io.BytesIO()
    canvas.convert("RGB").save(out, format="PNG")
    out.seek(0)
    return out.read()


def _add_label_to_svg(svg_bytes: bytes, label: str) -> bytes:
    """Inject a <text> element at the bottom of an SVG QR code."""
    import re
    svg_str = svg_bytes.decode("utf-8")

    # Extract viewBox or width/height to position text
    vb_match = re.search(r'viewBox=["\']([^"\']+)["\']', svg_str)
    if vb_match:
        parts = vb_match.group(1).split()
        try:
            vb_h = float(parts[3])
            vb_w = float(parts[2])
        except Exception:
            vb_h, vb_w = 400, 400
    else:
        vb_h, vb_w = 400, 400

    # Add extra height for label
    extra = 36
    escaped_label = label.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    label_svg = (
        f'<text x="{vb_w / 2}" y="{vb_h + extra - 8}" '
        f'font-family="DejaVu Sans, Arial, sans-serif" '
        f'font-size="18" font-weight="bold" '
        f'text-anchor="middle" fill="#1e1e1e">{escaped_label}</text>'
    )

    # Expand the SVG height
    svg_str = re.sub(
        r'(viewBox=["\'])([^"\']+)(["\'])',
        lambda m: f'{m.group(1)}{m.group(2).rsplit(" ", 1)[0]} {vb_h + extra}{m.group(3)}',
        svg_str,
        count=1,
    )
    svg_str = re.sub(
        r'height=["\'][^"\']*["\']',
        f'height="{int(vb_h + extra)}"',
        svg_str,
        count=1,
    )

    # Inject before </svg>
    svg_str = svg_str.replace("</svg>", f"{label_svg}\n</svg>")
    return svg_str.encode("utf-8")


def generate_qr_file(url: str, path: str, fmt: str = "png") -> None:
    """Save QR code to a file path."""
    qr = segno.make(url, error="h")
    if fmt == "svg":
        qr.save(path, kind="svg", scale=10, border=4)
    else:
        qr.save(path, kind="png", scale=10, border=4)
