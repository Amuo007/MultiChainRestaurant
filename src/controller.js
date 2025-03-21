const pool = require('../db');
const queries = require('./queries');

// Controller for getting menu items
const getMenuItems = async (req, res) => {
    try {
        const result = await pool.query(queries.getMenuItems);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: 'Database query error'});
    }
};

//Controller for getting branches
const getBranches = async (req, res) => {
    try {
        const result = await pool.query(queries.getBranches);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Failed to fetch branches' });
    }
};

// Controller for getting branchmenu
const getBranchMenu = async (req, res) => {
    const { branchID } = req.params;

    try {
        const result = await pool.query(queries.getBranchMenu, [branchID]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching branch menu:', error);
        res.status(500).json({ error: 'Failed to fetch branch menu' });
    }
};

// Controller for checking if an account exists
const checkAccountExists = async (req, res) => {
    // Trim the account number to remove any leading/trailing spaces
    const { accountNumber } = req.params;
    const trimmedAccountNumber = accountNumber.trim();

    try {
        const result = await pool.query(queries.checkAccountExists, [trimmedAccountNumber]);
        if (result.rows.length > 0) {
            res.json({
                exists: true,
                customerID: result.rows[0].customerid,
                balance: result.rows[0].balance
            });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        console.error('Error checking account:', err);
        res.status(500).json({ message: 'Error checking account' });
    }
};

// Controller for registering a new customer
const registerCustomer = async (req, res) => {
    const { name, email, accountnumber } = req.body;  // Include accountnumber here

    // Ensure accountnumber is provided and not empty
    if (!accountnumber) {
        return res.status(400).json({ error: 'Account number is required' });
    }

    try {
        // Update your query to include accountnumber
        const result = await pool.query(queries.registerCustomer, [name, email, accountnumber]);

        // If the query is successful, retrieve the customerId
        const customerId = result.rows[0].customerid;

        // Respond with the customerId
        res.json({ customerId });
    } catch (error) {
        console.error('Error during customer registration:', error);
        res.status(500).json({ error: 'Error registering customer' });
    }
};

// Controller for creating an order
const createOrder = async (req, res) => {
    const { customerId, total } = req.body;
    const result = await pool.query(queries.createOrder, [customerId, total]);
    const orderId = result.rows[0].orderid;
    res.json({ orderId });
};

// Controller for getting item by name
const getItemByName = async (req, res) => {
    const { name } = req.params;
    console.log('Requested item name:', name); // Log the item name being queried
    const result = await pool.query(queries.getItemByName, [name]);
    console.log('Query result:', result.rows); // Log the query result for debugging
    if (result.rows.length > 0) {
        const item = result.rows[0];
        res.json({ itemID: item.itemid, price: item.price });
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
};


// Controller for adding order item
const addOrderItem = async (req, res) => {
    const { orderid, itemid, quantity, price } = req.body;

    console.log('Received data:', { orderid, itemid, quantity, price });  // Log the incoming data

    try {
        await pool.query(queries.addOrderItem, [orderid, itemid, quantity, price]);
        res.status(200).json({ message: 'Order item added' });
    } catch (err) {
        console.error('Error adding order item:', err.message);
        res.status(500).json({ message: 'Error adding order item', error: err.message });
    }
};
// Controller for updating customer bank account
const updateCustomerBankAccount = async (req, res) => {
    const { customerID, amount } = req.body;
  
    try {
        await pool.query(queries.updateCustomerBankAccount, [customerID, amount]);
        res.status(200).json({ message: 'Customer bank account updated' });
    } catch (err) {
        console.error('Error updating customer bank account:', err);
        res.status(500).json({ message: 'Error updating customer bank account' });
    }
};

// Controller for updating restaurant bank account
const updateRestaurantBankAccount = async (req, res) => {
    const { branchID, amount } = req.body;
  
    try {
        await pool.query(queries.updateRestaurantBankAccount, [branchID, amount]);
        res.status(200).json({ message: 'Restaurant bank account updated' });
    } catch (err) {
        console.error('Error updating restaurant bank account:', err);
        res.status(500).json({ message: 'Error updating restaurant bank account' });
    }
};

// Controller for inserting transaction
const addTransaction = async (req, res) => {
    const {branch_id, amount } = req.body;
  
    try {
        await pool.query(queries.addTransaction, [branch_id, amount]);
        res.status(200).json({ message: 'Transaction recorded' });
    } catch (err) {
        console.error('Error adding transaction:', err);
        res.status(500).json({ message: 'Error adding transaction' });
    }
};

const processCardPayment = async (req, res) => {
    const { accountNumber, cartItems, totalAmount, name, email, branchID } = req.body;

    try {
        await pool.query('BEGIN');

        // Validate account number
        const account = await pool.query(queries.checkAccountExists, [accountNumber]);

        let customerId;
        if (account.rowCount === 0) {
            // Account does not exist, register new customer
            if (!name || !email) {
                await pool.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Account does not exist. Name and email are required to create a new account.',
                });
            }

            const newCustomer = await pool.query(queries.registerCustomer, [
                name,
                email,
                accountNumber,
            ]);
            customerId = newCustomer.rows[0].customerid;

            // Set initial balance for the new customer
            await pool.query(queries.updateCustomerBalance, [totalAmount, accountNumber]);
        } else {
            customerId = account.rows[0].customerid;
            const customerBalance = account.rows[0].balance;

            if (customerBalance < totalAmount) {
                await pool.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Insufficient balance.' });
            }
        }

        // Create order
        const orderResult = await pool.query(queries.createOrder, [
            customerId,
            branchID,
            totalAmount,
        ]);
        const orderId = orderResult.rows[0].orderid;

        // Insert order items
        for (const item of cartItems) {
            await pool.query(queries.createOrderItem, [
                orderId,
                item.itemid,
                item.quantity,
                item.price,
            ]);
        }

        // Update balances
        await pool.query(queries.updateCustomerBalance, [-totalAmount, accountNumber]); // Deduct from customer
        await pool.query(queries.updateBranchBalance, [totalAmount, branchID]); // Add to branch balance

        // Insert transaction record
        await pool.query(queries.createTransaction, [branchID, 'Card', totalAmount]);

        await pool.query('COMMIT');
        res.json({ success: true, message: 'Transaction completed successfully.' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error processing card payment:', error);
        res.status(500).json({ success: false, message: 'Transaction failed.' });
    }
};

const processCashPayment = async (req, res) => {
    const { accountNumber, cartItems, totalAmount, branchID } = req.body;

    try {
        await pool.query('BEGIN');

        // Validate if the account exists
        const accountResult = await pool.query(queries.checkAccountExists, [accountNumber]);

        // If account does not exist, return response indicating that
        if (accountResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Account does not exist. Please register.' });
        }

        const customerId = accountResult.rows[0].customerid;

        // Create order
        const orderResult = await pool.query(queries.createOrder, [
            customerId, // Use the customerID from the validated account
            branchID,   // Use the branchID passed in the request
            totalAmount,
        ]);
        const orderId = orderResult.rows[0].orderid;

        console.log("Original cartItems:", cartItems);

        // Filter out invalid items from cartItems
        const validCartItems = cartItems.filter(item => item !== null && item.itemid);

        console.log("Filtered cartItems:", validCartItems);

        // Insert order items
        for (const item of validCartItems) {
            await pool.query(queries.createOrderItem, [
                orderId,
                item.itemid,
                item.quantity,
                item.price, // Insert the price directly
            ]);
        }

        // Insert transaction record (cash type)
        await pool.query(queries.createTransaction, [branchID, 'Cash', totalAmount]); // Use the selected branchID

        // Update branch balance
        await pool.query(queries.updateBranchBalance, [totalAmount, branchID]);

        await pool.query('COMMIT');
        res.json({ success: true, message: 'Transaction completed successfully.' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error processing cash payment:', error);
        res.status(500).json({ success: false, message: 'Transaction failed.' });
    }
};


module.exports = {
    getMenuItems,
    checkAccountExists,
    registerCustomer,
    createOrder,
    getItemByName,
    addOrderItem,
    updateCustomerBankAccount,
    updateRestaurantBankAccount,
    addTransaction,
    getBranchMenu,
    getBranches,
    processCardPayment,
    processCashPayment,
};
