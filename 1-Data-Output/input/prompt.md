# Code Generation Prompt — Persona class

## Reference (C#)

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

// Usage
var p = new Persona("Alice", 30);
```

## Task

Produce the **equivalent** of the snippet above in each of the following languages:

1. **C#** — keep it identical to the reference.
2. **Java**
3. **Rust**
4. **F#**
5. **Haskell**

## Rules

- Idiomatic for each language. Use the natural construct (class, struct, record, data type) — do not force OOP onto functional languages.
- Include the **type/class definition** with the two fields `Nome` (string) and `Eta` (int/i32).
- Include a **constructor or equivalent** that sets both fields.
- Include a **usage line** that instantiates the value `Alice, 30`.
- **No comments** in the code.
- **No surrounding prose** — only the code block per language.
- Use the same field names (`Nome`, `Eta`) regardless of language convention.

## Output format

For each language, write a separate file in `output/` with the following names:

- `output/persona.cs`
- `output/persona.java`
- `output/persona.rs`
- `output/persona.fs`
- `output/persona.hs`

Each file must contain **only** the code for that language — no headers, no markdown fences, no comments.
