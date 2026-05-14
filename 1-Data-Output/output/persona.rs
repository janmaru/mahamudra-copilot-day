struct Persona {
    nome: String,
    eta: i32,
}

impl Persona {
    fn new(nome: String, eta: i32) -> Self {
        Persona { nome, eta }
    }
}

fn main() {
    let p = Persona::new(String::from("Alice"), 30);
}
