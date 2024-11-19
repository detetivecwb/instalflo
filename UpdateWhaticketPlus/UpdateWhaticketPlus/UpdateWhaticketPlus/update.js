require('dotenv').config();

const express = require('express');
const { Client } = require('ssh2');

const app = express();
app.use(express.json());

app.post('/execute', (req, res) => {
    const { backendDomain } = req.body;
    const conn = new Client();

    let sentOption = false;
    let sentBackendDomain = false; 

    conn.on('ready', () => {
        console.log('Conexão SSH estabelecida.');

        conn.shell((err, stream) => {
            if (err) {
                console.error('Erro ao abrir o shell:', err);
                return res.status(500).send('Erro ao abrir o shell');
            }

            let stdout = '';

            stream.on('close', () => {
                console.log('Conexão SSH encerrada');
                conn.end();
                res.send('Execução concluída com sucesso');
            }).on('data', (data) => {
                const output = data.toString('utf8');
                stdout += output;
                console.log('STDOUT:', output);

                if (!sentOption && stdout.includes('💻 O que você precisa fazer?')) {
                    console.log('Selecionando a opção 1...');
                    stream.write('2\n');
                    sentOption = true; 
                }
    
                if (!sentBackendDomain && stdout.includes('💻 Digite o domínio da sua API (Backend):')) {
                    console.log('Enviando o domínio do backend...');
                    stream.write(`${backendDomain}\n`);
                    sentBackendDomain = true;
                }
            });

            
            stream.write('apt update && apt upgrade -y && apt install sudo git -y && sudo rm -rf WhaticketWorkflow && sudo git clone https://github.com/DEV7Kadu/WhaticketWorkflow.git && cd WhaticketWorkflow && sudo chmod +x ./whaticketplus && ./whaticketplus\n');
        });
    }).on('error', (err) => {
        console.error('Erro na conexão SSH:', err);
        res.status(500).send('Erro na conexão SSH');
    }).connect({
        host: process.env.SSH_HOST,
        port: process.env.SSH_PORT,
        username: process.env.SSH_USERNAME,
        password: process.env.SSH_PASSWORD
    });
});

const PORT = 9090;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
