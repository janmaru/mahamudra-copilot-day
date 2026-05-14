"""Genera geographic_data.{pdf,xlsx,jpg} dagli stessi dati."""
from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

DATA: list[tuple[str, str, str, str]] = [
    ("City", "Country", "Continent", "Population (approx)"),
    ("Tokyo", "Japan", "Asia", "14,000,000"),
    ("Paris", "France", "Europe", "2,141,000"),
    ("New York", "USA", "North America", "8,419,000"),
    ("Rio de Janeiro", "Brazil", "South America", "6,710,000"),
    ("Cairo", "Egypt", "Africa", "9,845,000"),
    ("Sydney", "Australia", "Oceania", "5,312,000"),
]

OUT_DIR = Path(__file__).resolve().parent.parent / "data"


def build_pdf(path: Path) -> None:
    doc = SimpleDocTemplate(str(path), pagesize=A4, title="Geographic Data")
    styles = getSampleStyleSheet()
    story = [Paragraph("Geographic Data", styles["Title"]), Spacer(1, 12)]
    table = Table(DATA, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (3, 1), (3, -1), "RIGHT"),
    ]))
    story.append(table)
    doc.build(story)


def build_xlsx(path: Path) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Geographic Data"
    for row in DATA:
        ws.append(row)
    for col_idx, header in enumerate(DATA[0], start=1):
        ws.column_dimensions[ws.cell(row=1, column=col_idx).column_letter].width = max(15, len(header) + 4)
    wb.save(path)


def build_jpg(path: Path) -> None:
    """Renderizza la tabella come immagine JPEG (~800×320 px)."""
    cell_w = [160, 110, 160, 200]
    row_h = 36
    padding = 16
    width = sum(cell_w) + 2 * padding
    height = row_h * len(DATA) + 2 * padding + 30

    img = Image.new("RGB", (width, height), color="white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        font_bold = ImageFont.truetype("arialbd.ttf", 14)
        font_title = ImageFont.truetype("arialbd.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
        font_bold = font
        font_title = font

    draw.text((padding, padding // 2), "Geographic Data", fill="black", font=font_title)

    y0 = padding + 30
    for r, row in enumerate(DATA):
        x = padding
        for c, value in enumerate(row):
            is_header = r == 0
            bg = (220, 220, 220) if is_header else "white"
            draw.rectangle([x, y0, x + cell_w[c], y0 + row_h], fill=bg, outline="black")
            text_font = font_bold if is_header else font
            draw.text((x + 6, y0 + 9), str(value), fill="black", font=text_font)
            x += cell_w[c]
        y0 += row_h

    img.save(path, format="JPEG", quality=85)


if __name__ == "__main__":
    build_pdf(OUT_DIR / "geographic_data.pdf")
    build_xlsx(OUT_DIR / "geographic_data.xlsx")
    build_jpg(OUT_DIR / "geographic_data.jpg")
    print(
        "Generated:",
        OUT_DIR / "geographic_data.pdf",
        OUT_DIR / "geographic_data.xlsx",
        OUT_DIR / "geographic_data.jpg",
    )
