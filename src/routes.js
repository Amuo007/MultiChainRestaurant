const express = require('express');
const router = express.Router();
const controller = require('./controller');
const admincontroller = require('./adminController');
const pool = require('../db');

// Define route to get menu items
router.get('/menuitems', controller.getMenuItems);

router.get('/checkAccountExists/:accountNumber', controller.checkAccountExists);

// Register a new customer
router.post('/registerCustomer', controller.registerCustomer); 

// Create an order
router.post('/createOrder', controller.createOrder);

// Get item by name
router.get('/getItemByName/:name', controller.getItemByName); 

// Add an order item
router.post('/addOrderItem', controller.addOrderItem); 

// Update customer bank account
router.put('/updateCustomerBankAccount', controller.updateCustomerBankAccount);

// Update restaurant bank account
router.put('/updateRestaurantBankAccount', controller.updateRestaurantBankAccount);

// Insert a transaction
router.post('/addTransaction', controller.addTransaction);




// //----ADMIN---ROUTES------

// router.get('/', (req, res) => {
//     res.redirect('admin/overview')
// });

// router.get('/overview', admincontroller.getDashboardStats)

// // Add the API route
// router.get('/api/chart-data', admincontroller.getChartData);

// router.get('/orders',admincontroller.getOrders)

// router.get('/orders/details/:id', admincontroller.getOrderDetails);


// router.get('/menu', admincontroller.getmenuitem)

// router.post('/upload/menu',admincontroller.uploadNewMenu)

// // Delete menu item
// router.get('/menu/delete/:itemID',admincontroller.deleteMenuItem);





// router.get('/transactions', admincontroller.getTransactions)

// router.get('/branches', admincontroller.getBranches)

// router.post('/branches/add', admincontroller.uploadBranches);

// // Route to delete a branch
// router.post('/branches/delete/:id', admincontroller.deleteBranch);


// router.get('/auth/login', (req, res) => {
//     res.render('auth/login',{ layout: false });
// });

// router.get('/auth/register', (req, res) => {
//     res.render('auth/register',{ layout: false });
// });



// // Add employee route
// router.post('/employees/add', admincontroller.addEmployee);


// router.get('/employees', admincontroller.getEmployees)

// router.get('/employees/details/:id', admincontroller.getEmployeeDetails);

// router.post('/employees/delete/:id', admincontroller.deleteEmployee);





router.get('/auth/login', (req, res) => {
    res.render('auth/login',{ layout: false });
});

// Handle Login
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {console.log(email,password)
        const query = 'SELECT * FROM Employee WHERE email = $1 AND password = $2';
        const result = await pool.query(query, [email, password]);

        console.log(result[0])

        if (result.rows.length > 0) {
            // Log success
            console.log('Login successful:', email);
            req.session.isAuthenticated = true;
            req.session.employee = result.rows[0];

            // Redirect to admin overview
            return res.redirect('/admin/overview');
        } else {
            // Log failed login attempt
            console.log('Login failed: Invalid email or password for', email);
            res.render('auth/login', { layout: false, error: 'Invalid email or password' });
        }
    } catch (err) {
        // Log error
        console.error('Error during login attempt:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Handle Logout
router.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});




router.get('/auth/register', (req, res) => {
    res.render('auth/register',{ layout: false });
});


// Route to fetch menu items for a specific branch
router.get('/api/branchmenu/:branchID', controller.getBranchMenu);

// Route to fetch all branches
router.get('/api/branches', controller.getBranches);

router.post('/api/processCardPayment', controller.processCardPayment);
router.post('/api/processCashPayment', controller.processCashPayment);

router.get('/test',admincontroller.test100);


module.exports = router;
