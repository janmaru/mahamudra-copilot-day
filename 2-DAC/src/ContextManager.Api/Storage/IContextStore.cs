using ContextManager.Api.Models;

namespace ContextManager.Api.Storage;

public interface IContextStore
{
    KnowledgeContext Create(string name, string description);
    IReadOnlyCollection<KnowledgeContext> List();
    KnowledgeContext? Get(Guid id);
    KnowledgeContext? Update(Guid id, string name, string description);
    bool Delete(Guid id);

    Snippet? AddSnippet(Guid contextId, string title, string content, string[] tags);
    IReadOnlyCollection<Snippet> Search(Guid contextId, string query);
}
