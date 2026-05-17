"""Genera un grafico a torta da un CSV tabellare."""
from __future__ import annotations

import argparse
import csv
import math
from collections import OrderedDict
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT / "data" / "geographic_data.csv"
DEFAULT_OUTPUT = ROOT / "data" / "geographic_data_pie.png"

COLORS = [
    "#4F46E5",
    "#0EA5E9",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#14B8A6",
    "#F97316",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv_path", nargs="?", type=Path, default=DEFAULT_CSV)
    parser.add_argument(
        "--label-column",
        default="Continent",
        help="Colonna usata per le etichette del grafico.",
    )
    parser.add_argument(
        "--value-column",
        default="Population (approx)",
        help="Colonna numerica usata per i valori del grafico.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Percorso del file PNG in output.",
    )
    parser.add_argument(
        "--title",
        default="Population by Continent",
        help="Titolo del grafico.",
    )
    return parser.parse_args()


def parse_number(raw_value: str) -> float:
    normalized = raw_value.replace(",", "").replace("_", "").strip()
    if not normalized:
        raise ValueError("Valore numerico vuoto.")
    return float(normalized)


def load_data(csv_path: Path, label_column: str, value_column: str) -> OrderedDict[str, float]:
    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("CSV senza intestazione.")
        missing = [column for column in (label_column, value_column) if column not in reader.fieldnames]
        if missing:
            raise ValueError(f"Colonne mancanti nel CSV: {', '.join(missing)}")

        grouped: OrderedDict[str, float] = OrderedDict()
        for row in reader:
            label = (row.get(label_column) or "").strip()
            if not label:
                raise ValueError(f"Riga con etichetta vuota nella colonna '{label_column}'.")
            value = parse_number(row.get(value_column) or "")
            grouped[label] = grouped.get(label, 0.0) + value

    if not grouped:
        raise ValueError("CSV senza righe dati.")
    return grouped


def load_fonts() -> tuple[ImageFont.ImageFont, ImageFont.ImageFont, ImageFont.ImageFont]:
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 24)
        legend_font = ImageFont.truetype("arial.ttf", 16)
        legend_bold = ImageFont.truetype("arialbd.ttf", 16)
        return title_font, legend_font, legend_bold
    except OSError:
        fallback = ImageFont.load_default()
        return fallback, fallback, fallback


def draw_pie_chart(data: OrderedDict[str, float], output_path: Path, title: str) -> None:
    width, height = 980, 620
    pie_box = (40, 110, 500, 570)
    legend_x = 560
    legend_y = 150
    line_gap = 56
    swatch_size = 24

    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    title_font, legend_font, legend_bold = load_fonts()

    draw.text((40, 40), title, fill="#111827", font=title_font)

    total = sum(data.values())
    start_angle = -90.0
    items = list(data.items())
    for idx, (label, value) in enumerate(items):
        color = COLORS[idx % len(COLORS)]
        fraction = value / total
        end_angle = start_angle + fraction * 360
        draw.pieslice(pie_box, start=start_angle, end=end_angle, fill=color, outline="white", width=2)

        mid_angle = math.radians((start_angle + end_angle) / 2)
        center_x = (pie_box[0] + pie_box[2]) / 2
        center_y = (pie_box[1] + pie_box[3]) / 2
        radius = (pie_box[2] - pie_box[0]) / 2
        label_x = center_x + math.cos(mid_angle) * radius * 0.62
        label_y = center_y + math.sin(mid_angle) * radius * 0.62
        pct_text = f"{fraction * 100:.1f}%"
        bbox = draw.textbbox((0, 0), pct_text, font=legend_bold)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        draw.text((label_x - text_w / 2, label_y - text_h / 2), pct_text, fill="white", font=legend_bold)

        legend_top = legend_y + idx * line_gap
        draw.rectangle(
            [legend_x, legend_top, legend_x + swatch_size, legend_top + swatch_size],
            fill=color,
            outline=color,
        )
        draw.text((legend_x + 40, legend_top - 2), label, fill="#111827", font=legend_bold)
        draw.text(
            (legend_x + 40, legend_top + 20),
            f"{int(value):,} ({fraction * 100:.1f}%)",
            fill="#374151",
            font=legend_font,
        )

        start_angle = end_angle

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG")


def main() -> None:
    args = parse_args()
    data = load_data(args.csv_path, args.label_column, args.value_column)
    draw_pie_chart(data, args.output, args.title)
    print(f"Generated: {args.output}")


if __name__ == "__main__":
    main()
