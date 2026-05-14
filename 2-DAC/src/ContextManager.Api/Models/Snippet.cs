namespace ContextManager.Api.Models;

public sealed record Snippet(
    Guid Id,
    string Title,
    string Content,
    string[] Tags,
    DateTimeOffset CreatedAt);

public sealed record CreateSnippetRequest(string Title, string Content, string[] Tags);
