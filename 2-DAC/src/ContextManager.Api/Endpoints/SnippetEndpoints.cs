using ContextManager.Api.Models;
using ContextManager.Api.Storage;

namespace ContextManager.Api.Endpoints;

public static class SnippetEndpoints
{
    public static IEndpointRouteBuilder MapSnippetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/contexts/{contextId:guid}").WithTags("Snippets");

        group.MapPost("/snippets", (Guid contextId, CreateSnippetRequest req, IContextStore store) =>
        {
            var snippet = store.AddSnippet(contextId, req.Title, req.Content, req.Tags);
            return snippet is null
                ? Results.NotFound()
                : Results.Created($"/contexts/{contextId}/snippets/{snippet.Id}", snippet);
        });

        group.MapGet("/search", (Guid contextId, string? q, IContextStore store) =>
        {
            if (store.Get(contextId) is null)
                return Results.NotFound();
            return Results.Ok(store.Search(contextId, q ?? string.Empty));
        });

        return app;
    }
}
