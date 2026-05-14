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
