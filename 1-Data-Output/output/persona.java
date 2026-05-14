public class Persona {
    private String Nome;
    private int Eta;

    public Persona(String nome, int eta) {
        this.Nome = nome;
        this.Eta = eta;
    }

    public String getNome() { return Nome; }
    public void setNome(String nome) { this.Nome = nome; }

    public int getEta() { return Eta; }
    public void setEta(int eta) { this.Eta = eta; }

    public static void main(String[] args) {
        Persona p = new Persona("Alice", 30);
    }
}
