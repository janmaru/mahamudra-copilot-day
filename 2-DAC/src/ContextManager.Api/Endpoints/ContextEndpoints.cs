using ContextManager.Api.Models;
using ContextManager.Api.Storage;

namespace ContextManager.Api.Endpoints;

public static class ContextEndpoints
{
    public static IEndpointRouteBuilder MapContextEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/contexts").WithTags("Contexts");

        group.MapPost("/", (CreateContextRequest req, IContextStore store) =>
        {
            var ctx = store.Create(req.Name, req.Description);
            return Results.Created($"/contexts/{ctx.Id}", ctx);
        });

        group.MapGet("/", (IContextStore store) => Results.Ok(store.List()));

        group.MapGet("/{id:guid}", (Guid id, IContextStore store) =>
            store.Get(id) is { } ctx ? Results.Ok(ctx) : Results.NotFound());

        group.MapPut("/{id:guid}", (Guid id, UpdateContextRequest req, IContextStore store) =>
            store.Update(id, req.Name, req.Description) is { } ctx ? Results.Ok(ctx) : Results.NotFound());

        group.MapDelete("/{id:guid}", (Guid id, IContextStore store) =>
            store.Delete(id) ? Results.NoContent() : Results.NotFound());

        return app;
    }
}
