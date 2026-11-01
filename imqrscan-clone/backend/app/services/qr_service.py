import secrets
import string
import io
import segno


def generate_slug(length: int = 8) -> str:
    """Generate a URL-safe random slug (e.g. 'aB3xK9mQ')."""
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def generate_qr_bytes(url: str, fmt: str = "png") -> bytes:
    """
    Generate QR code and return as bytes.
    fmt: 'png' | 'svg'
    """
    qr = segno.make(url, error="h")
    buf = io.BytesIO()
    if fmt == "svg":
        qr.save(buf, kind="svg", scale=10, border=4)
    else:
        qr.save(buf, kind="png", scale=10, border=4)
    buf.seek(0)
    return buf.read()


def generate_qr_file(url: str, path: str, fmt: str = "png") -> None:
    """Save QR code to a file path."""
    qr = segno.make(url, error="h")
    if fmt == "svg":
        qr.save(path, kind="svg", scale=10, border=4)
    else:
        qr.save(path, kind="png", scale=10, border=4)
