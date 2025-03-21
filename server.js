const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./src/routes');
const expressLayouts = require('express-ejs-layouts');
const pool = require('./db');
const adminRoutes = require('./src/adminRoutes'); // Import the routes
const session = require('express-session');


const app = express();
const port = 3000;

// EJS setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');
app.set("layout extractScripts", true);







// Middleware to set current page
app.use((req, res, next) => {
    res.locals.currentPage = req.path.substring(1) || 'overview';
    next();
});



const staticPath = path.join(__dirname, 'public'); // Adjust as needed

const bodyParser = require('body-parser');




// Set up sessions
app.use(session({
    secret: 'your-secret-key', // Replace with a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 60 * 1000 } // Session lasts 30 minutes
}));






app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
app.use(cors());
app.use(express.json());
app.use(express.static(staticPath));



//--------------------------me 

// Use Admin Routes
app.use('/admin' , require('./middlewares/authMiddleware'),  adminRoutes);


// Use Admin Routes
app.use('/', routes);


// app.get('/overview', (req, res) => {
//     res.render('pages/overview');
// });

// app.get('/orders', (req, res) => {
//     res.render('pages/orders');
// });

// app.get('/menu', (req, res) => {
//     res.render('pages/menu');
// });

// app.get('/transactions', (req, res) => {
//     res.render('pages/transactions');
// });

// app.get('/branches', (req, res) => {
//     res.render('pages/branches');
// });



//--------------------------me 


app.get("/", (req, res) => 
    res.sendFile(path.join(staticPath, 'menu.html')) // Change 'index.html' to your actual HTML file name
);

app.get("/", (req, res) => {
    res.status(200).send("Hey, you in my backend!");
});

app.use('/api', routes);

// Define routes to fetch data from each table
app.get('/api/branch', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Branch');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/customer', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Customer');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/category', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Category');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/menu-items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM MenuItems');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Orders');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/order-items', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM OrderItems');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Transactions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/restaurant-bank-account', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM RestaurantBankAccount');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/customer-bank-account', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM CustomerBankAccount');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => console.log(`App listening on port ${port}`));