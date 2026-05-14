# Data Input — Format & Token Benchmark

How expensive is it, in tokens, to feed the **same dataset** to an LLM in different file formats? This folder answers that question with a measured benchmark on `tiktoken`, plus a short guide on when to pick each format for project specifications.

The numbers in this README are **measured**, not estimated — except where explicitly flagged (`document mode`, `vision mode`), which depend on provider-side pricing not observable offline.

## Table of Contents

1. [Dataset](#dataset)
2. [Format Guide](#format-guide)
3. [Methodology](#methodology)
4. [Results](#results)
5. [Key Observations](#key-observations)
6. [Per-Format Notes](#per-format-notes)
7. [Why "Character Count" Is Not a Reliable Proxy](#why-character-count-is-not-a-reliable-proxy)
8. [Operational Conclusions](#operational-conclusions)
9. [How to Reproduce](#how-to-reproduce)
10. [Folder Layout](#folder-layout)

---

## Dataset

Identical content across every file: **6 records × 4 columns**.

| City           | Country   | Continent     | Population (approx) |
|:---------------|:----------|:--------------|--------------------:|
| Tokyo          | Japan     | Asia          | 14,000,000          |
| Paris          | France    | Europe        | 2,141,000           |
| New York       | USA       | North America | 8,419,000           |
| Rio de Janeiro | Brazil    | South America | 6,710,000           |
| Cairo          | Egypt     | Africa        | 9,845,000           |
| Sydney         | Australia | Oceania       | 5,312,000           |

Files in `data/`: `csv`, `md`, `txt`, `xml`, `html`, `pdf`, `xlsx`, `jpg`.

---

## Format Guide

Quick rules for choosing a format **before** writing your specs.

### Markdown / TXT — best for general specs
- Lightweight, no hidden formatting, LLMs read them directly.
- Markdown adds clear hierarchy (`#`, `-`, `**`) without PDF's complexity.
- TXT wins on raw simplicity (logs, console output, quick notes).

### XML / JSON — best for rigid structure
- XML: explicit hierarchy, schema-validatable (XSD), Claude handles it natively.
- JSON: ubiquitous parser support, lighter than XML, ideal for configuration and APIs.
- Anthropic recommends XML tags (e.g. `<spec>...</spec>`) to separate instructions, context, and constraints.

### CSV / Excel — best for tabular data
- CSV: most compact and most token-efficient tabular format.
- Excel: multi-sheet, formulas, formatting — but binary, requires extraction, and creates parsing noise. Prefer CSV unless multi-sheet or formulas are essential.

### PDF — heaviest
- Text-based PDFs are acceptable; scanned PDFs require OCR and are error-prone.
- Avoid PDF for content that will be frequently updated or AI-processed. Use it for final deliverables, contracts, and frozen specs.

### Summary table

| Use case                       | Recommended    | Alternative          |
|--------------------------------|----------------|----------------------|
| Project specs                  | **Markdown**   | TXT, XML             |
| Complex structured data        | **XML / JSON** | Markdown with tags   |
| Single simple table            | **CSV**        | Excel (1 sheet)      |
| Multiple related tables        | **Excel**      | Multiple CSVs + MD   |
| Data with formulas             | **Excel**      | CSV with calc values |
| Final documentation            | **Markdown**   | PDF (text-based)     |
| Configurations                 | **JSON / XML** | YAML                 |
| Quick notes                    | **TXT**        | Markdown             |

**Golden rule:** prefer plain text formats (Markdown, TXT, XML, JSON, CSV) over binary or layout-heavy formats (PDF, DOCX, complex Excel). LLMs process them faster, cheaper, and with fewer errors.

---

## Methodology

- **Tokenizer**: `tiktoken` with `cl100k_base` encoding (GPT-4). Standard proxy; estimates remain consistent for Claude within <10%.
- **Text-based formats** (`csv`, `md`, `txt`, `xml`, `html`): raw file content read directly.
- **Binary formats** (`pdf`, `xlsx`):
  - `extracted text` → text extracted locally with `pypdf` / `openpyxl` before passing to the LLM.
  - `raw bytes (latin-1)` → file bytes decoded 1:1 with `latin-1` (lossless), as if pasted into the prompt.
  - `document mode` (PDF only) → estimate of cost when the PDF is sent as a native *document* (Anthropic PDF support / Files API): text + each page rendered as image. Public average estimate: ~2250 tokens/page. **Not measured offline.**
- **Image formats** (`jpg`):
  - `raw bytes (latin-1)` → JPEG bytes decoded 1:1 (degenerate case).
  - `vision mode` (Anthropic) → image sent as a vision attachment. Public estimate: ~`(W × H) / 750` tokens. **Not measured offline.** Local OCR excluded to avoid heavy dependencies (Tesseract).
- **Human readability**: how much of the original structure survives in the payload that reaches the model. Scale: `excellent` (hierarchy, delimiters, or tags preserved → tables and relations reconstructible); `good` (structure per row but formatting lost, e.g. extracted XLSX); `poor` (linear text, tables and layout dissolved, e.g. extracted PDF); `none` (uninterpretable byte sequence).

---

## Results

All scenarios, sorted by token count (ascending).

| Rank | Format | Scenario                            | File bytes | **Tokens** | vs. best | Human readability | Notes |
|-----:|:-------|:------------------------------------|-----------:|-----------:|---------:|:-----------------:|:------|
| 1    | `csv`  | raw text                            |        243 |     **80** |     1.0× | excellent         | file content read directly |
| 2    | `pdf`  | extracted text (pypdf / openpyxl)   |       2138 |     **97** |     1.2× | poor              | text pre-extracted locally before prompt |
| 3    | `xlsx` | extracted text (pypdf / openpyxl)   |       5161 |     **98** |     1.2× | good              | text pre-extracted locally before prompt |
| 4    | `txt`  | raw text                            |        321 |    **104** |     1.3× | good              | file content read directly |
| 5    | `md`   | raw text                            |        613 |    **145** |     1.8× | excellent         | file content read directly |
| 6    | `jpg`  | vision mode (Anthropic, estimate)   |      37089 |    **277** |     3.5× | excellent         | 662×314 px → (W×H)/750 |
| 7    | `xml`  | raw text                            |       1061 |    **279** |     3.5× | excellent         | file content read directly |
| 8    | `html` | raw text                            |       1457 |    **394** |     4.9× | excellent         | file content read directly |
| 9    | `pdf`  | raw bytes (latin-1)                 |       2138 |   **1120** |    14.0× | none              | bytes pasted into the prompt, no transformation |
| 10   | `pdf`  | document mode (Anthropic, estimate) |       2138 |   **2250** |    28.1× | excellent         | 1 page × ~2250 tok (text + img) |
| 11   | `xlsx` | raw bytes (latin-1)                 |       5161 |   **5554** |    69.4× | none              | bytes pasted into the prompt, no transformation |
| 12   | `jpg`  | raw bytes (latin-1)                 |      37089 |  **43217** |   540.2× | none              | bytes pasted into the prompt, no transformation |

> Best: `csv raw text` at **80 tokens**. Worst: `jpg raw bytes (latin-1)` at **43,217 tokens** — ~540× more expensive than the best.

---

## Key Observations

- **PDF**: raw bytes cost 1120 tok, ~12× the extracted text (97 tok). PDF headers and text streams are already ASCII, so `tiktoken` copes — but extraction is still much cheaper.
- **XLSX**: raw bytes cost 5554 tok, ~57× the extracted text (98 tok). XLSX is a zip archive: every byte is a non-ASCII pseudo-random sequence that the tokenizer shatters into many subwords.
- **Bytes ≠ tokens**: the PDF weighs 2.1 KB and the CSV 243 bytes, yet once extracted the PDF costs only 97 tokens vs. 80 for the CSV. File size in bytes is a **poor** predictor of LLM cost.
- **JPEG raw bytes are pathological**: 43,217 tokens for a 37 KB image. Vision mode is ~156× cheaper for the same image.

---

## Per-Format Notes

### `csv`
Pure tabular: one header row, one row per record, comma separators. Zero structural overhead. Tokenizes extremely efficiently because many values (numbers, proper nouns) are single tokens and separators add no noise.

### `pdf`
Binary file. Three realistic modes: (a) **local pre-extraction** with `pypdf` → you pay only for extracted text; (b) **raw bytes** in the prompt → ASCII headers tokenize decently, but still ~12× the text; (c) **document mode** (Anthropic) → the model sees text + page image, ~2250 tokens/page, useful when layout matters.

### `xlsx`
Binary zip-compressed file (internal XMLs). **Always pre-extract**: no mainstream provider offers native document mode for XLSX. Sending raw bytes is pure waste because zip compression makes bytes hostile to the tokenizer. Once extracted via `openpyxl`, cost is comparable to CSV.

### `txt`
Free-form text with `Label: value` prefixes. More verbose than CSV because it repeats labels on every row, but still lightweight. Good compromise when the data must be readable without a header.

### `md`
Markdown table with `|` and separator rows. Higher token cost than CSV because of formatting characters (`|`, `:---:`) and alignment padding. Great for human readability, less so for token efficiency.

### `xml`
Every field wrapped in opening and closing tags (`<name>Tokyo</name>`). High structural verbosity: cost grows linearly with the number of fields. Pick it only when a rigid schema or validation (XSD) is required.

### `html`
Same verbosity as XML plus document structure tags (`<html>`, `<head>`, `<table>`, `<tr>`, `<td>`). Typically the most expensive text-based format for tabular data.

### `jpg`
Raster image. Two realistic modes: (a) **vision mode** → the image is sent as an attachment and the model "sees" it; estimated cost ~`(W×H)/750` tokens (Anthropic), independent of KB weight. (b) **raw bytes** → tokenizing the JPEG as a string is useless: the payload is a compressed sequence unreadable by both humans and the model. **Local OCR** (Tesseract) would be a third option, excluded here to avoid heavy dependencies.

---

## Why "Character Count" Is Not a Reliable Proxy

Early reports often claim "fewer characters → fewer tokens." Real measurement on `cl100k_base` shows this is only a **rough directional signal**.

Single-row comparison (`Tokyo, Japan, Asia, 14,000,000`):

| Format   | Chars | Real tokens (cl100k) | Chars/token |
|----------|------:|---------------------:|------------:|
| CSV      |    25 |                   10 |        2.50 |
| TXT      |    42 |                   15 |        2.80 |
| MD table |    66 |                   16 |        4.12 |
| JSON     |    75 |                   20 |        3.75 |
| XML      |   102 |                   28 |        3.64 |

Take-aways:

1. **CSV remains #1** — both by characters and by real tokens.
2. **JSON is heavier than expected**: structural sequences like `{"`, `":"`, `","` *are* single tokens, but every key name still costs a full token per field. JSON's overhead is real, not just cosmetic.
3. **Markdown ranks better than character count suggests**: padded whitespace in MD cells gets compressed into single whitespace tokens. MD beats both compact JSON and XML at multi-row scale.
4. **The chars/token ratio is inconsistent** (2.50 → 4.12), proving character count is a poor predictor when comparing across formats.
5. **Pretty-printed JSON is the worst** for tabular data — worse than XML.

Two additional considerations the character-count framing ignores:

- **Self-describing vs. opaque**: CSV (`Tokyo,Japan,Asia,14000000`) needs an extra header or instruction to explain what `14000000` means. Those instruction tokens add back to the total. JSON is self-describing — the overhead partially pays for itself.
- **Output tokens matter too**: if the LLM emits CSV, output is cheaper than emitting JSON or XML. The input-only framing misses half the cost.

### Final ranking (full 6-row file)

| Position | Format              | Tokens |
|----------|---------------------|-------:|
| 1st      | CSV                 |     79 |
| 2nd      | TXT                 |    103 |
| 3rd      | MD table            |    145 |
| 4th      | JSON (compact)      |    167 |
| 5th      | XML                 |    204 |
| 6th      | JSON (pretty-print) |    216 |

---

## Operational Conclusions

1. **Absolute winner**: `csv` as `raw text` — **80 tokens**.
2. **Absolute worst**: `jpg` as `raw bytes (latin-1)` — ~43,217 tokens (~540× the best).
3. **For binaries, preference order is clear**: `extracted text` ≪ `document mode` (PDF only, when layout matters) ≪ `raw bytes`.
4. **Practical rule**: if the data exists as text, send text. Reserve binaries for cases where visual rendering is part of the content.
5. **Avoid pretty-printed JSON** for token-sensitive tasks.
6. **Avoid XML** unless schema validation is required.

> **Note on base64**: the `inline base64` scenario is excluded because it is not a realistic use case. Base64 is just a *transport encoding* used by APIs to ship binary bytes inside JSON request bodies (`data:application/pdf;base64,...`): the provider decodes it server-side and applies `document mode`. Nobody tokenizes the base64 string as text — it would be pure waste with no semantic value.

---

## How to Reproduce

```bash
# 1. Generate binary files (pdf, xlsx, jpg) from the canonical dataset
python artifacts/_generate_pdf_xlsx.py

# 2. Run the token benchmark across all scenarios
python artifacts/benchmark_tokens.py
```

The second script writes its full Markdown report to stdout-equivalent and updates the in-memory table. Adjust constants at the top of `benchmark_tokens.py` if the Anthropic pricing assumptions (`ANTHROPIC_PDF_TOKENS_PER_PAGE = 2250`, `ANTHROPIC_VISION_DIVISOR = 750`) change.

Dependencies: `tiktoken`, `pypdf`, `openpyxl`, `Pillow`, `reportlab`.

---

## Folder Layout

```
0-Data-Input/
├── README.md                       ← this file
├── artifacts/
│   ├── _generate_pdf_xlsx.py       ← generates pdf/xlsx/jpg from the dataset
│   └── benchmark_tokens.py         ← runs the token benchmark across all scenarios
└── data/
    ├── geographic_data.csv
    ├── geographic_data.html
    ├── geographic_data.jpg
    ├── geographic_data.md
    ├── geographic_data.pdf
    ├── geographic_data.txt
    ├── geographic_data.xlsx
    └── geographic_data.xml
```

---

## Related: Caveman — token-efficient output

[Caveman](https://github.com/juliusbrussee/caveman) is a Claude Code skill that cuts AI **output** tokens by ~65% while keeping technical accuracy.

It instructs the model to answer in a concise "caveman" style: short sentence fragments, no filler words, substance over elaboration. Users trigger it with `/caveman` or by asking for "caveman mode".

- **Compression levels**: `lite`, `full`, `ultra`, plus a classical Chinese variant (`wenyan`).
- **Specialized commands**: commit messages, PR reviews, token usage stats, memory-file compression.
- **Multi-agent support**: Claude Code, Cursor, Windsurf, Cline, Copilot, and 25+ other tools.
- **MCP middleware** (`caveman-shrink`): compresses tool descriptions for any MCP server.

**Why it's relevant here**: this benchmark focuses on **input** token efficiency (picking the cheapest format to feed the model). Caveman is the complementary lever on the **output** side — same goal, opposite end of the pipeline.

Tagline: *"why use many token when few token do trick"*.
