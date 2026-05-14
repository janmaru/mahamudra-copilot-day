namespace ContextManager.Api.Models;

public sealed record KnowledgeContext(
    Guid Id,
    string Name,
    string Description,
    List<Snippet> Snippets,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record CreateContextRequest(string Name, string Description);

public sealed record UpdateContextRequest(string Name, string Description);
