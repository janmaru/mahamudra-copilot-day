"""Token cost benchmark for the Persona code-generation experiment.

Tokenizes the input prompt and every generated output file with
`tiktoken cl100k_base` (consistent with 0-Data-Input). Produces a ranked
Markdown table on stdout.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import tiktoken

ROOT = Path(__file__).resolve().parent.parent
INPUT_FILE = ROOT / "input" / "prompt.md"
OUTPUT_DIR = ROOT / "output"

ENCODING = tiktoken.get_encoding("cl100k_base")

LANGUAGE_NAMES: dict[str, str] = {
    ".cs": "C#",
    ".java": "Java",
    ".rs": "Rust",
    ".fs": "F#",
    ".hs": "Haskell",
}


@dataclass
class Measurement:
    label: str
    path: Path
    bytes_: int
    chars: int
    tokens: int

    @property
    def chars_per_token(self) -> float:
        return self.chars / self.tokens if self.tokens else 0.0


def measure(path: Path, label: str) -> Measurement:
    text = path.read_text(encoding="utf-8")
    return Measurement(
        label=label,
        path=path,
        bytes_=path.stat().st_size,
        chars=len(text),
        tokens=len(ENCODING.encode(text)),
    )


def collect_outputs() -> list[Measurement]:
    rows: list[Measurement] = []
    for path in sorted(OUTPUT_DIR.iterdir()):
        if not path.is_file():
            continue
        label = LANGUAGE_NAMES.get(path.suffix.lower(), path.suffix)
        rows.append(measure(path, label))
    rows.sort(key=lambda m: m.tokens)
    return rows


def format_table(prompt: Measurement, outputs: list[Measurement]) -> str:
    lines: list[str] = []
    lines.append("# Output Token Benchmark — Persona generation")
    lines.append("")
    lines.append(
        f"**Prompt (input)**: `{prompt.path.name}` — {prompt.bytes_} bytes, "
        f"{prompt.chars} chars, **{prompt.tokens} tokens** "
        f"({prompt.chars_per_token:.2f} chars/token)."
    )
    lines.append("")
    lines.append("## Output ranking (ascending by tokens)")
    lines.append("")
    lines.append("| Rank | Language | File | Bytes | Chars | **Tokens** | vs. cheapest | Chars/token |")
    lines.append("|-----:|:---------|:-----|------:|------:|-----------:|-------------:|------------:|")

    cheapest = outputs[0].tokens if outputs else 1
    for idx, m in enumerate(outputs, start=1):
        ratio = m.tokens / cheapest if cheapest else 0
        ratio_str = "1.0×" if idx == 1 else f"{ratio:.2f}×"
        lines.append(
            f"| {idx} | {m.label} | `{m.path.name}` | {m.bytes_} | "
            f"{m.chars} | **{m.tokens}** | {ratio_str} | "
            f"{m.chars_per_token:.2f} |"
        )

    lines.append("")
    total_output_tokens = sum(m.tokens for m in outputs)
    lines.append(
        f"**Total output tokens (all 5 languages)**: {total_output_tokens}"
    )
    lines.append(
        f"**Prompt + total output**: {prompt.tokens + total_output_tokens} tokens "
        f"(input {prompt.tokens} + output {total_output_tokens})."
    )
    return "\n".join(lines)


def main() -> None:
    prompt = measure(INPUT_FILE, "prompt")
    outputs = collect_outputs()
    print(format_table(prompt, outputs))


if __name__ == "__main__":
    main()
