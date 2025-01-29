# **Desenvolvimento Web Seguro**  
### Semana 02 – Parte 1: Resolução de Problemas  
**Professor:** Jefferson O. Andrade  
**Aluno:** Evandro Canal Severgnini  
**Data:** 29/01/2025  



## **1️⃣ Introdução**  
Nesta atividade, analisamos a aplicação web proposta e identificamos possíveis vulnerabilidades.  
Após a identificação, aplicamos correções para aumentar a segurança do sistema.



## **2️⃣ Identificação de Vulnerabilidades**  
- 🔍 **Verificação do armazenamento de senhas no banco de dados.**  
- 🔍 **Análise das rotas e funções para controle de acesso.**  
- 🔍 **Testes de segurança, incluindo SQL Injection e força bruta.**  



## **3️⃣ Análise do Banco de Dados**  
✅ **As senhas estão armazenadas utilizando Scrypt (hash seguro).**  
✅ **Não há exposição de senhas em texto puro.**  
✅ **O armazenamento das credenciais segue boas práticas de segurança.**  



## **4️⃣ Controle de Acesso**  
✅ **O sistema bloqueia acesso a rotas protegidas para usuários não autenticados.**  
✅ **Tentativas de acesso não autenticado são redirecionadas para a tela de login.**  
✅ **Testes mostraram que não há exposição de dados sensíveis sem login.**  

---

## **5️⃣ Teste de SQL Injection**  
✅ **Foram realizados testes com tentativas de SQL Injection no campo de login.**  
✅ **O sistema demonstrou estar protegido contra ataques desse tipo.**  
✅ **Não foi possível burlar a autenticação utilizando injeção de SQL.**  

---

## **6️⃣ Teste de Força Bruta**  
❌ **Foram realizadas múltiplas tentativas de login com senhas incorretas.**  
❌ **O sistema não implementava limite de tentativas, permitindo ataques de força bruta.**  
❌ **Essa vulnerabilidade foi identificada como um risco de segurança.**  



## **7️⃣ Correção das Vulnerabilidades**  
✅ **Implementamos um sistema de limitação de tentativas de login usando Flask-Limiter.**  
✅ **Agora, o sistema bloqueia usuários após 5 tentativas consecutivas em 1 minuto.**  
✅ **Isso evita ataques de força bruta e melhora a segurança da autenticação.**  
✅ **A função `login()` foi modificada para incluir essa proteção.**  



## **8️⃣ Código Implementado para Proteção Contra Força Bruta**  

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.secret_key = 'chave_super_secreta'

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5 per minute"]  # Bloqueia após 5 tentativas por minuto
)

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("5 per minute")  # Máximo de 5 tentativas de login por minuto
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = c.fetchone()
        conn.close()
        
        if user and check_password_hash(user[2], password):  # Verificando hash da senha
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['role'] = user[3]
            return redirect(url_for('index'))
        
        return 'Login Failed', 403  # Retorna erro 403 para falha

    return render_template('login.html')
```



## **9️⃣ Conclusão**  
🔹 **A aplicação analisada apresentou boas práticas de segurança, como armazenamento seguro de senhas e proteção contra SQL Injection.**  
🔹 **No entanto, foi identificada uma vulnerabilidade em ataques de força bruta, a qual foi corrigida com uma solução eficaz usando Flask-Limiter.**  
🔹 **Agora, a aplicação está significativamente mais segura contra tentativas de login automatizadas.**  

