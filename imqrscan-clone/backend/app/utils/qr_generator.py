import io
import segno


def generate_qr_png(url: str, path: str) -> None:
    """Save QR as PNG to file path."""
    qr = segno.make(url, error="h")
    qr.save(path, kind="png", scale=10, border=4)


def generate_qr_svg(url: str, path: str) -> None:
    """Save QR as SVG to file path."""
    qr = segno.make(url, error="h")
    qr.save(path, kind="svg", scale=10, border=4)


def generate_qr_bytes(url: str, fmt: str = "png") -> bytes:
    """Return QR code as raw bytes (PNG or SVG)."""
    qr = segno.make(url, error="h")
    buf = io.BytesIO()
    if fmt == "svg":
        qr.save(buf, kind="svg", scale=10, border=4)
    else:
        qr.save(buf, kind="png", scale=10, border=4)
    buf.seek(0)
    return buf.read()
