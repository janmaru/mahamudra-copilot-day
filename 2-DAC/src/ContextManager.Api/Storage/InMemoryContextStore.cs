using System.Collections.Concurrent;
using ContextManager.Api.Models;

namespace ContextManager.Api.Storage;

public sealed class InMemoryContextStore : IContextStore
{
    private readonly ConcurrentDictionary<Guid, KnowledgeContext> _store = new();

    public KnowledgeContext Create(string name, string description)
    {
        var now = DateTimeOffset.UtcNow;
        var ctx = new KnowledgeContext(Guid.NewGuid(), name, description, [], now, now);
        _store[ctx.Id] = ctx;
        return ctx;
    }

    public IReadOnlyCollection<KnowledgeContext> List() => _store.Values.ToArray();

    public KnowledgeContext? Get(Guid id) => _store.GetValueOrDefault(id);

    public KnowledgeContext? Update(Guid id, string name, string description)
    {
        if (!_store.TryGetValue(id, out var existing))
            return null;

        var updated = existing with
        {
            Name = name,
            Description = description,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        _store[id] = updated;
        return updated;
    }

    public bool Delete(Guid id) => _store.TryRemove(id, out _);

    public Snippet? AddSnippet(Guid contextId, string title, string content, string[] tags)
    {
        if (!_store.TryGetValue(contextId, out var ctx))
            return null;

        var snippet = new Snippet(Guid.NewGuid(), title, content, tags, DateTimeOffset.UtcNow);
        var updated = ctx with
        {
            Snippets = [.. ctx.Snippets, snippet],
            UpdatedAt = DateTimeOffset.UtcNow
        };
        _store[contextId] = updated;
        return snippet;
    }

    public IReadOnlyCollection<Snippet> Search(Guid contextId, string query)
    {
        if (!_store.TryGetValue(contextId, out var ctx))
            return [];

        if (string.IsNullOrWhiteSpace(query))
            return ctx.Snippets;

        var q = query.Trim();
        return ctx.Snippets
            .Where(s =>
                s.Title.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.Content.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                s.Tags.Any(t => t.Contains(q, StringComparison.OrdinalIgnoreCase)))
            .ToArray();
    }
}
