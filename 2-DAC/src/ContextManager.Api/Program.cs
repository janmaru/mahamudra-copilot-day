using ContextManager.Api.Endpoints;
using ContextManager.Api.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddSingleton<IContextStore, InMemoryContextStore>();

var app = builder.Build();

app.MapOpenApi();

app.MapContextEndpoints();
app.MapSnippetEndpoints();

app.Run();
