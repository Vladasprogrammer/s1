const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql');

const URL = 'http://localhost:3000/';

app.use(express.static('public'));
app.use(bodyParser.json());

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'miskas'
});

con.connect(err => {
    if (err) {
        console.log('Klaida prisijungiant prie DB');
        return;
    }
    console.log('Prisijungimas prie DB buvo sėkmingas');
});


app.get('/klientai/:type', (req, res) => {

    // SELECT *
    // FROM Clients
    // INNER JOIN Phones
    // ON Clients.id = Phones.client_id;

    let jt = '';

    switch (req.params.type) {
        case 'inner':
            jt = 'INNER';
            break;
        case 'left':
            jt = 'LEFT';
            break;
        case 'right':
            jt = 'RIGHT';
            break;
        default:
            jt = 'INNER';
    }

    const sql = `
        SELECT c.id, name, p.id AS pid, number, client_id
        FROM clients AS c
        ${jt} JOIN phones AS p
        ON c.id = p.client_id
    `;

    con.query(sql, (err, result) => {
        if (err) {
            console.log('Klaida gaunant duomenis iš DB');
            res.status(400).json({ error: 'Klaida gaunant duomenis iš DB' });
            return;
        }
        res.json(result);
    });

});




app.get('/medziu-sarasas/:page', (req, res) => {

    // SELECT column1, column2, ...
    // FROM table_name;

    // SELECT column1, column2, ...
    // FROM table_name
    // WHERE columnN LIKE pattern;

    let sql;
    let params;
    const page = parseInt(req.params.page) || 1;
    const perPage = 3;
    const limit = (page - 1) * perPage;
    const q = req.query.q || '';


    if (!q) {
        sql = `
            SELECT id, name, height, type
            FROM trees
            -- WHERE type = 'Lapuotis' AND height > 10
            -- ORDER BY type DESC, height
            ORDER BY name
            LIMIT ?, ?
        `;
        params = [limit, perPage];
    } else {
        sql = `
            SELECT id, name, height, type
            FROM trees
            WHERE name LIKE ?
            ORDER BY name
            LIMIT ?, ?
        `;
        params = [`%${q}%`, limit, perPage];
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            console.log('Klaida gaunant duomenis iš DB');
            res.status(400).json({ error: 'Klaida gaunant duomenis iš DB' });
            return;
        }
        res.json(result);
    });
});

app.get('/medziu-skaicius', (req, res) => {

    // SELECT COUNT(column_name)
    // FROM table_name;

    let sql;
    let params;
    const q = req.query.q || '';

    if (!q) {
        sql = `
        SELECT COUNT(id) AS total
        FROM trees
    `;
        params = [];
    } else {
        sql = `
        SELECT COUNT(id) AS total
        FROM trees
        WHERE name LIKE ?
    `;
        params = [`%${q}%`];
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            console.log('Klaida gaunant duomenis iš DB');
            res.status(400).json({ error: 'Klaida gaunant duomenis iš DB' });
            return;
        }
        const perPage = 3;
        const pages = Math.ceil(result[0].total / perPage);
        res.json({ pages });
    });
});

app.post('/sodinti-medi', (req, res) => {

    const { name, height, type } = req.body;

    // INSERT INTO table_name 
    // (column1, column2, column3, ...)
    // VALUES (value1, value2, value3, ...);

    const sql = `
        INSERT INTO trees 
        (name, height, type)
        VALUES ('${name}', ${height}, '${type}')
    `;


    con.query(sql, (err, result) => {
        if (err) {
            console.log('Klaida įrašant duomenis į DB', err);
            res.status(400).json({ error: 'Klaida įrašant duomenis į DB' });
            return;
        }
        res.json({ success: 'Medis sėkmingai įrašytas į DB', result });
    });

});

app.delete('/iskasti-medi/:id', (req, res) => {

    const id = req.params.id;

    // DELETE FROM table_name 
    // WHERE condition;

    // const sql = `
    //     DELETE FROM trees
    //     WHERE id = ${id}
    // `;

    const sql = `
        DELETE FROM trees
        WHERE id = ?
    `;

    con.query(sql, [id], (err, result) => {
        if (err) {
            console.log('Klaida trinant duomenis iš DB', err);
            res.status(400).json({ error: 'Klaida trinant duomenis iš DB' });
            return;
        }
        res.json({ success: 'Medis sėkmingai iškastas iš DB', result });
    });

});

app.put('/persodinti-medi/:id', (req, res) => {

    // UPDATE table_name
    // SET column1 = value1, column2 = value2, ...
    // WHERE condition;

    const id = req.params.id;
    const { name, height, type } = req.body;

    const sql = `
        UPDATE trees
        SET name = ?, height = ?, type = ?
        WHERE id = ?
    `;

    con.query(sql, [name, height, type, id], (err, result) => {
        if (err) {
            console.log('Klaida atnaujinant duomenis DB', err);
            res.status(400).json({ error: 'Klaida atnaujinant duomenis DB' });
            return;
        }
        res.json({ success: 'Medis sėkmingai persodintas DB', result });
    });
});



// Start server

const port = 3000;
app.listen(port, () => {
    console.log(`Serveris pasiruošęs ir laukia ant ${port} porto!`);
});