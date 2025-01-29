# **Desenvolvimento Web Seguro**  
### Semana 02 – Parte 2: Resolução de Problemas  
**Professor:** Jefferson O. Andrade  
**Aluno:** Evandro Canal Severgnini  
**Data:** 30/01/2025  

Este projeto implementa uma aplicação web segura usando **Node.js e Express.js**. 

O foco principal é garantir um sistema de **autenticação robusto** com **MFA (Autenticação Multifator)**, além de **controle de acesso adequado**.

---

## 📌 **1. Requisitos Atendidos**
A aplicação atende aos seguintes requisitos do trabalho:

✅ **Configuração do Ambiente**  
   - Uso de **Node.js** com o framework **Express.js**.  
   - Gerenciamento de sessões com `express-session`.  

✅ **Autenticação**  
   - Registro de usuários com **senhas hashadas** (`bcryptjs`).  
   - Implementação de **Autenticação Multifator (MFA)** usando `speakeasy`.  

✅ **Autorização (Controle de Acesso)**  
   - Proteção de rotas (`/dashboard` só pode ser acessado por usuários autenticados).  
   - Redirecionamento adequado para `/login` caso o usuário não esteja autenticado.  

---

## 📌 **2. Tecnologias Utilizadas**
| Tecnologia    | Descrição |
|--------------|-----------|
| **Node.js**  | Plataforma de execução JavaScript no backend |
| **Express.js** | Framework web para criar a aplicação |
| **bcryptjs** | Biblioteca para hash de senhas |
| **speakeasy** | Geração de códigos MFA |
| **express-session** | Gerenciamento de sessões |
| **qrcode** | Criação de QR Codes para MFA |

---

## 📌 **3. Estrutura do Projeto**
```
secure-web-node/
│── views/                # Páginas HTML (login, registro, dashboard)
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│── users.json            # Banco de dados simulado
│── server.js             # Código principal do servidor
│── package.json          # Dependências do projeto
│── README.md             # Documentação do projeto
│── node_modules/         # Bibliotecas instaladas pelo npm (não é enviado no repositório)
```

---

## 📌 **4. Fluxo de Funcionamento**
### **🔹 4.1 Registro de Usuário**
1. O usuário acessa **/register** e cria uma conta.
2. A senha é armazenada de forma segura com **bcrypt**.
3. Um código **MFA secreto** é gerado e armazenado.

### **🔹 4.2 Login**
1. O usuário acessa **/login** e insere suas credenciais.
2. Se a senha estiver correta, um **código MFA** é gerado.
3. O usuário insere o código MFA e, se estiver correto, é redirecionado ao **/dashboard**.

### **🔹 4.3 Proteção de Rotas**
- **Se um usuário não autenticado tentar acessar `/dashboard`, ele será redirecionado para `/login`**.

---

## 📌 **5. Código Principal (`server.js`)**
Aqui estão os principais trechos do código:

### **🔹 5.1 Configuração do Servidor**
```javascript
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 5000;
const usersFilePath = './users.json';

// Middleware para processar JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views')); // Servir arquivos estáticos (CSS, JS, etc.)

// Configuração da sessão
app.use(session({
    secret: 'chave_super_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Alterar para true em produção com HTTPS
}));
```

---

### **🔹 5.2 Registro de Usuário**
```javascript
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    let users = loadUsers();

    if (users.some(user => user.username === username)) {
        return res.send('<script>alert("Usuário já existe!"); window.location.href="/register";</script>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const mfaSecret = speakeasy.generateSecret({ length: 20 });

    users.push({
        username,
        password: hashedPassword,
        mfaSecret: mfaSecret.base32 // Salva o segredo MFA no formato Base32
    });

    saveUsers(users);
    res.send('<script>alert("Usuário registrado! Faça login."); window.location.href="/login";</script>');
});
```

---

### **🔹 5.3 Login com Verificação MFA**
```javascript
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    let users = loadUsers();

    const user = users.find(user => user.username === username);
    if (!user) return res.send('<script>alert("Usuário ou senha incorretos!"); window.location.href="/login";</script>');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.send('<script>alert("Usuário ou senha incorretos!"); window.location.href="/login";</script>');

    const token = speakeasy.totp({ secret: user.mfaSecret, encoding: 'base32' });
    console.log(`Código MFA para ${username}:`, token);

    req.session.tempUser = username;
    res.send(`
        <html>
        <body>
            <h1>Digite o Código MFA</h1>
            <form action="/verify-mfa" method="POST">
                <input type="hidden" name="username" value="${username}">
                <label for="token">Código MFA:</label>
                <input type="text" id="token" name="token" required>
                <button type="submit">Verificar</button>
            </form>
        </body>
        </html>
    `);
});
```

---

## 📌 **6. Conclusão**
Este projeto atende **todos os requisitos da Parte 2 do Trabalho** e implementa:
✅ **Autenticação segura com bcrypt**  
✅ **Autenticação Multifator (MFA) com `speakeasy`**  
✅ **Proteção de rotas e gerenciamento de sessões**  
