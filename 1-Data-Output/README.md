# Data Output — Code Generation Token Benchmark

How expensive is it, in **output tokens**, to ask an LLM to produce the *same trivial class* in different programming languages? This experiment generates a `Persona` (name + age, plus an `Alice, 30` usage line) in five languages and measures the cost of each emitted file.

Companion to `0-Data-Input` (which benchmarks the cost of **feeding** data to an LLM). This folder benchmarks the cost of **receiving** code from an LLM.

## Table of Contents

1. [Experiment](#experiment)
2. [Methodology](#methodology)
3. [Results](#results)
4. [Observations](#observations)
5. [Per-Language Notes](#per-language-notes)
6. [How to Reproduce](#how-to-reproduce)
7. [Folder Layout](#folder-layout)

---

## Experiment

**Reference snippet (C#)** — the spec given to the LLM:

```csharp
public class Persona
{
    public string Nome { get; set; }
    public int Eta { get; set; }

    public Persona(string nome, int eta)
    {
        Nome = nome;
        Eta = eta;
    }
}

var p = new Persona("Alice", 30);
```

**Prompt** (`input/prompt.md`) asks for the idiomatic equivalent in:

1. C# (identical to the reference)
2. Java
3. Rust
4. F#
5. Haskell

Constraints in the prompt: idiomatic per language, no comments, include the `Alice, 30` instantiation line, output one file per language with no markdown fences and no surrounding prose.

**Generation** was delegated to a separate LLM subagent that received only the prompt content — not this conversation's context. The five output files in `output/` are exactly what that subagent produced. They are then tokenized by `artifacts/benchmark_output_tokens.py`.

---

## Methodology

- **Tokenizer**: `tiktoken` with `cl100k_base` encoding (GPT-4 family). Consistent with `0-Data-Input`. Estimates remain within <10% of Claude's tokenizer.
- **Inputs measured**: the prompt file (`input/prompt.md`) and each generated source file (`output/persona.*`).
- **Metrics per file**: bytes (file size), chars (UTF-8 character count), tokens (`tiktoken` count), chars/token ratio.
- **Generation**: single run per language by a `general-purpose` subagent with isolated context. No retries, no averaging.

---

## Results

### Prompt cost (input side)

| File          | Bytes | Chars | **Tokens** | Chars/token |
|---------------|------:|------:|-----------:|------------:|
| `prompt.md`   | 1380  | 1370  | **356**    | 3.85        |

### Output cost per language (ranked ascending by tokens)

| Rank | Language | File              | Bytes | Chars | **Tokens** | vs. cheapest | Chars/token |
|-----:|:---------|:------------------|------:|------:|-----------:|-------------:|------------:|
| 1    | F#       | `persona.fs`      |    80 |    80 |     **28** |        1.00× |        2.86 |
| 2    | Haskell  | `persona.hs`      |   109 |   109 |     **31** |        1.11× |        3.52 |
| 3    | C#       | `persona.cs`      |   224 |   224 |     **62** |        2.21× |        3.61 |
| 4    | Rust     | `persona.rs`      |   218 |   218 |     **64** |        2.29× |        3.41 |
| 5    | Java     | `persona.java`    |   467 |   467 |    **119** |        4.25× |        3.92 |

- **Total output tokens (all 5 languages)**: 304
- **Prompt + total output**: 660 tokens (356 input + 304 output)

---

## Observations

- **F# is the cheapest** at 28 tokens — a single-line record type plus a single-line literal. Functional languages with concise record syntax pay almost nothing for this kind of data class.
- **Haskell is a close second** at 31 tokens — same record-type advantage, with slightly more punctuation (`::`, `data ... = ...`).
- **C# and Rust are roughly tied** in the middle (62 vs. 64 tokens). C# pays for property syntax (`{ get; set; }`), Rust pays for an `impl` block and the `String::from` ceremony in the usage line.
- **Java is the outlier** at 119 tokens — **4.25× more expensive than F#** for the same logical content. The subagent emitted the full idiomatic Java boilerplate: private fields, explicit `this.`, getters, setters, and a `main` method.
- **Chars/token ratio is fairly stable** across languages (2.86 → 3.92), unlike the format comparison in `0-Data-Input` where it ranged from 2.50 to 4.12. Code tokenization is more uniform than data-format tokenization.
- **Bytes ≈ chars** for all files because the generated code is pure ASCII. This makes file size a *reasonable* proxy for token cost here — unlike the data-format benchmark, where bytes were misleading.
- **The prompt costs more than all five outputs combined** (356 vs. 304 tokens). Prompt engineering dominates the budget when outputs are this small.

---

## Per-Language Notes

### F# (28 tokens — cheapest)

```fsharp
type Persona = { Nome: string; Eta: int }

let p = { Nome = "Alice"; Eta = 30 }
```

Record type + record literal. No constructor boilerplate. No `class`, no `new`, no `impl`. The runner-up for terseness in this comparison.

### Haskell (31 tokens)

```haskell
data Persona = Persona { nome :: String, eta :: Int }

p :: Persona
p = Persona { nome = "Alice", eta = 30 }
```

ADT with record syntax. Slightly more punctuation than F# (`::` type annotations, `data ... = Constructor`), but conceptually the same: a record type and a literal.

### C# (62 tokens)

The reference snippet, kept identical by the subagent. Pays for property syntax (`{ get; set; }`), explicit constructor body, and the `var p = new Persona(...)` instantiation.

### Rust (64 tokens)

```rust
struct Persona {
    nome: String,
    eta: i32,
}

impl Persona {
    fn new(nome: String, eta: i32) -> Self {
        Persona { nome, eta }
    }
}

fn main() {
    let p = Persona::new(String::from("Alice"), 30);
}
```

Idiomatic Rust requires an `impl` block to attach a `new` constructor, plus a `main` for the usage line. `String::from("Alice")` costs extra tokens compared to a bare string literal in other languages.

### Java (119 tokens — most expensive)

The subagent produced full idiomatic Java: private fields, getters, setters, and a `main` method. This is what a Java developer would write — but it costs 4.25× the F# equivalent for the same logical content. If the prompt had asked for a Java 16+ `record`, the cost would have collapsed closer to F#/Haskell territory.

---

## How to Reproduce

```bash
# 1. (Optional) Re-generate the output files via an LLM subagent.
#    The Claude Code subagent was invoked with the contents of input/prompt.md.

# 2. Run the token benchmark.
python artifacts/benchmark_output_tokens.py
```

Dependencies: `tiktoken`.

The script reads `input/prompt.md` and every file in `output/`, then prints a Markdown table to stdout. Re-running it after editing any file refreshes the numbers immediately.

---

## Folder Layout

```
1-Data-Output/
├── README.md                          ← this file
├── input/
│   └── prompt.md                      ← spec given to the LLM
├── output/
│   ├── persona.cs                     ← C# (62 tokens)
│   ├── persona.java                   ← Java (119 tokens)
│   ├── persona.rs                     ← Rust (64 tokens)
│   ├── persona.fs                     ← F# (28 tokens)
│   └── persona.hs                     ← Haskell (31 tokens)
└── artifacts/
    └── benchmark_output_tokens.py     ← tokenizer & ranking script
```
