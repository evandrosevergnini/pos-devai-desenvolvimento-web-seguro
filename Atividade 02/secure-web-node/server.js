require('dotenv').config();
const express = require('express');
const session = require('express-session');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Configurações do Express
const app = express();
const PORT = process.env.PORT || 5000;
const usersFilePath = './users.json';

// Função para carregar usuários do arquivo JSON
const loadUsers = () => {
    if (!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(usersFilePath));
};

// Função para salvar usuários no arquivo JSON
const saveUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Middleware para processar JSON, formulários e arquivos estáticos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views')); // Permite servir arquivos estáticos (CSS, JS, etc.)

// Configuração da sessão
app.use(session({
    secret: 'chave_super_secreta', // Troque por uma chave segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Alterar para true em produção com HTTPS
}));

// 🔹 Rota inicial (Home)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 🔹 Rota para exibir a página de registro
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// 🔹 Rota para exibir a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 🔹 Rota para exibir o dashboard (proteção para usuários logados)
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

// 🔹 Rota de Registro
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    let users = loadUsers();

    if (users.some(user => user.username === username)) {
        return res.send('<script>alert("Usuário já existe!"); window.location.href="/register";</script>');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Gera uma chave MFA secreta exclusiva para o usuário
    const mfaSecret = speakeasy.generateSecret({ length: 20 });

    users.push({
        username,
        password: hashedPassword,
        mfaSecret: mfaSecret.base32 // Armazena a chave secreta MFA no formato Base32
    });

    saveUsers(users);

    res.send('<script>alert("Usuário registrado com sucesso! Agora faça login."); window.location.href="/login";</script>');
});


// 🔹 Rota de Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    let users = loadUsers();

    const user = users.find(user => user.username === username);
    if (!user) {
        return res.send('<script>alert("Usuário ou senha incorretos!"); window.location.href="/login";</script>');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.send('<script>alert("Usuário ou senha incorretos!"); window.location.href="/login";</script>');
    }

    // Gera um código MFA temporário
    const token = speakeasy.totp({
        secret: user.mfaSecret,
        encoding: 'base32'
    });

    console.log(`Código MFA para ${username}:`, token); // Apenas para debug

    // Redireciona para a página de verificação MFA
    req.session.tempUser = username;
    res.send(`
        <html>
        <body>
            <h1>Digite o Código MFA</h1>
            <p>Use um aplicativo autenticador como o Google Authenticator para gerar o código MFA.</p>
            <form action="/verify-mfa" method="POST">
                <input type="hidden" name="username" value="${username}">
                <label for="token">Código MFA:</label>
                <input type="text" id="token" name="token" required>
                <br>
                <button type="submit">Verificar</button>
            </form>
        </body>
        </html>
    `);
});
// 🔹 Rota de verificação MFA
app.post('/verify-mfa', (req, res) => {
    const { username, token } = req.body;
    let users = loadUsers();

    const user = users.find(user => user.username === username);
    if (!user) {
        return res.send('<script>alert("Usuário não encontrado!"); window.location.href="/login";</script>');
    }

    // Verifica se o código MFA está correto
    const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: token,
        window: 1 // Permite um pequeno atraso no tempo
    });

    if (verified) {
        req.session.user = username;
        return res.redirect('/dashboard');
    } else {
        return res.send('<script>alert("Código MFA incorreto!"); window.location.href="/login";</script>');
    }
});

// 🔹 Rota de Logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('<script>alert("Logout realizado com sucesso!"); window.location.href="/";</script>');
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando na porta http://localhost:${PORT}`);
});

// 🔹 Teste do banco de dados
app.get('/test-db', (req, res) => {
    try {
        let users = loadUsers();
        res.json({ message: "Banco de dados carregado!", users });
    } catch (error) {
        res.status(500).json({ message: "Erro ao carregar o banco de dados!", error });
    }
});

// 🔹 Teste do carregamento de usuários
app.get('/debug-users', (req, res) => {
    let users = loadUsers();
    res.json(users);
});

// 🔹 Teste de criptografia
app.get('/test-bcrypt', async (req, res) => {
    const hash = "$2a$10$X9.ywhNwNH1XcWnFJEFuX.DxD.FXPiwQmBlvSxFbo4F4whmEIO8Hq"; // Hash salvo no JSON
    const senhaDigitada = "admin123"; // A senha que você está tentando usar

    const senhaCorreta = await bcrypt.compare(senhaDigitada, hash);

    if (senhaCorreta) {
        res.send("✅ A senha está correta!");
    } else {
        res.send("❌ A senha NÃO corresponde ao hash!");
    }
});
