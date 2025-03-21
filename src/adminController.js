const pool = require('../db');
const queries = require('./queries');
const { processCardPayment, processCashPayment } = require('./controller'); // Import the payment functions




const getDeshboardData = async (req, res) => {


    
};


// Controller function to fetch menu items and render the menu page


const getmenuitem = async (req, res) => {
    try {
      // Fetch menu items
      const menuItemsQuery = queries.fetchAllMenuItems;
      const menuItemsResult = await pool.query(menuItemsQuery);
      const menuItems = menuItemsResult.rows || [];
      console.log('Menu Items:', menuItems);
  
      // Fetch categories
      const categories = (await pool.query(queries.getCategories)).rows || [];
      console.log('Categories:', categories);
  
      // Fetch branches
      const branches = (await pool.query(queries.getBranches)).rows || [];
      console.log('Branches:', branches);
  
      // Fetch branch-menu relationships
      const branchMenuQuery = queries.branchMenuQuery
      const branchMenuResult = await pool.query(branchMenuQuery);
      const branchMenu = branchMenuResult.rows || [];
      console.log('Branch-Menu Relationships:', branchMenu);
  
      // Group branches by menu item
      const branchMap = {};
      branchMenu.forEach((bm) => {
        if (!branchMap[bm.itemid]) {
          branchMap[bm.itemid] = [];
        }
        branchMap[bm.itemid].push(bm.address);
      });
  
      // Add branches to menu items
      const enrichedMenuItems = menuItems.map((item) => ({
        ...item,
        branches: branchMap[item.itemid] || [],
      }));
  
      // Render template
      res.render('pages/menu', {
        menuItems: enrichedMenuItems,
        categories,
        branches,
      });
    } catch (error) {
      console.error('Error fetching menu items:', error);
      res.status(500).send('Server Error');
    }
  };
  

  const uploadNewMenu = async (req, res) => {
    const { name, category, price, description, imageUrl, branchID } = req.body;
  
    try {
      console.log('Request Body:', req.body);
  
      // Handle multiple branch IDs
      const branchIDs = Array.isArray(branchID)
        ? branchID.map((id) => parseInt(id, 10))
        : [parseInt(branchID, 10)];
  
      // Validate branch IDs
      if (branchIDs.some((id) => isNaN(id))) {
        console.error('Invalid branchIDs:', branchIDs);
        return res.status(400).send('Invalid branch(es) selected');
      }
  
      // Fetch categoryID
      const categoryQuery = queries.categoryQuery;
      const categoryResult = await pool.query(categoryQuery, [category]);
  
      if (categoryResult.rows.length === 0) {
        console.error('Invalid category:', category);
        return res.status(400).send('Invalid category selected');
      }
  
      const categoryID = categoryResult.rows[0].categoryid;
  
      // Insert into MenuItem
      const menuQuery = queries.addMenuItem;
      const menuValues = [name, categoryID, price, description, imageUrl];
      const menuResult = await pool.query(menuQuery, menuValues);
  
      const itemID = menuResult.rows[0].itemid;
  
      // Insert into BranchMenu for each selected branch
      const branchMenuQuery = `
        INSERT INTO BranchMenu (branchID, itemID, availability)
        VALUES ($1, $2, TRUE);
      `;
      await Promise.all(
        branchIDs.map(async (id) => {
          await pool.query(branchMenuQuery, [id, itemID]);
        })
      );
  
      console.log('Menu item and branches added successfully');
      res.redirect('/admin/menu');
    } catch (error) {
      console.error('Error uploading menu item:', error);
      res.status(500).send('Server Error');
    }
  };

  const deleteMenuItem = async (req, res) => {
    const { itemID } = req.params; // Get itemID from the URL parameter

    try {
        // Delete the item from the BranchMenu table first (to maintain referential integrity)
        const deleteBranchMenuQuery = `DELETE FROM BranchMenu WHERE itemID = $1;`;
        await pool.query(deleteBranchMenuQuery, [itemID]);

        // Then delete the item from the MenuItem table
        const deleteMenuItemQuery = `DELETE FROM MenuItem WHERE itemID = $1;`;
        await pool.query(deleteMenuItemQuery, [itemID]);

        console.log(`Menu item with ID ${itemID} deleted successfully.`);
        res.redirect('/admin/menu'); // Redirect back to the menu page
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).send('Server Error');
    }
};






  // ---------------------- Branches --------------
  const getBranches = async (req, res) => {
    try {
      // Query the Branch table to fetch all branches
      const result = await pool.query('SELECT * FROM Branch');
  
      // Map the data into a format suitable for your EJS template
      const branches = result.rows.map(branch => ({
        id: branch.branchid, // Include branchID
        address: branch.address,
        phone: branch.phonenumber,
        altPhone: branch.accountnumber,
        amount: `$${Number(branch.balance).toFixed(2)}`, // Ensure balance is a number
        status: Number(branch.balance) > 0 ? 'Active' : 'Inactive',
    }));
  
      // Render the EJS template, passing the branches data
      res.render('pages/branches', { data: branches });
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).send('Server Error');
    }
  };

  const uploadBranches = async (req, res) => {
    const { address, phonenumber, accountnumber, balance, status } = req.body;
  
    try {
      // Validation (if needed, but HTML `required` attributes handle most cases)
      if (!address || !phonenumber || !accountnumber || !balance || !status) {
        return res.status(400).send('All fields are required.');
      }
  
      // Insert into the database
      const result = await pool.query(
        `INSERT INTO Branch (address, phonenumber, accountnumber, balance)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [address, phonenumber, accountnumber, parseFloat(balance)]
      );
  
      console.log('New branch added:', result.rows[0]);
  
      // Redirect or send a success response
      res.redirect('/admin/branches'); // Adjust the redirect URL as needed
    } catch (error) {
      console.error('Error adding branch:', error);
  
      // Handle unique constraint errors
      if (error.code === '23505') {
        return res.status(400).send('Phone number or account number already exists.');
      }
  
      // Send a generic error response
      res.status(500).send('Failed to add the branch.');
    }
  };


  const deleteBranch = async (req, res) => {
    const { id } = req.params;
  
    try {
      // Delete the branch from the database
      const result = await pool.query('DELETE FROM Branch WHERE branchID = $1', [id]);
  
      // Redirect back to the branches page
      res.redirect('/admin/branches');
    } catch (error) {
      console.error('Error deleting branch:', error);
      res.status(500).send('Failed to delete the branch.');
    }
  };



  //----------transaction table


  const getTransactions = async (req, res) => {
    try {
        const query = queries.getTransactions

        const result = await pool.query(query);

        // If no transactions exist, pass an empty array to the template
        const transactions = result.rows || [];
        res.render('pages/transactions', { transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).send('Server Error');
    }
};
  

//-------orders---------


const getOrders = async (req, res) => {
    try {
        const query = queries.getOrders

        const result = await pool.query(query);
        const orders = result.rows;
        console.log(orders[0])

        res.render('pages/orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server Error');
    }
};

const getOrderDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const query = queries.getOrderDetails

        const result = await pool.query(query, [id]);
        console.log(id[0])
        const orderDetails = result.rows[0]; // Fetch the order details

        console.log(orderDetails)

        if (!orderDetails) {
            return res.status(404).send('Order not found');
        }

        res.render('pages/orderDetails', { order: orderDetails });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Server Error');
    }
};


const getDashboardStats = async (req, res) => {
    try {
        const totalRevenueResult = await pool.query('SELECT SUM(total) AS totalRevenue FROM Orders');
        const totalOrdersResult = await pool.query('SELECT COUNT(orderID) AS totalOrders FROM Orders');
        const avgOrderValueResult = await pool.query('SELECT AVG(total) AS avgOrderValue FROM Orders');
        const activeLocationsResult = await pool.query('SELECT COUNT(branchID) AS activeLocations FROM Branch');

        const stats = {
            totalRevenue: totalRevenueResult.rows[0].totalrevenue || 0,
            totalOrders: totalOrdersResult.rows[0].totalorders || 0,
            avgOrderValue: avgOrderValueResult.rows[0].avgordervalue || 0,
            activeLocations: activeLocationsResult.rows[0].activelocations || 0,
        };

        console.log(stats)

        res.render('pages/overview', { stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).send('Failed to load dashboard');
    }
};

const getChartData = async (req, res) => {
    try {
        // Weekly Performance Data
        const weeklyPerformanceResult = await pool.query(queries.weeklyPerformanceResult);

        const weeklyLabels = weeklyPerformanceResult.rows.map(row => row.day);
        const weeklyOrders = weeklyPerformanceResult.rows.map(row => parseInt(row.orders, 10));
        const weeklyRevenue = weeklyPerformanceResult.rows.map(row => parseFloat(row.revenue));

        // Revenue Distribution Data
        const revenueDistributionResult = await pool.query(queries.revenueDistributionResult);

        const revenueLabels = revenueDistributionResult.rows.map(row => row.category);
        const revenueValues = revenueDistributionResult.rows.map(row => parseFloat(row.revenue));

        // Respond with JSON data
        res.json({
            weeklyLabels,
            weeklyOrders,
            weeklyRevenue,
            revenueLabels,
            revenueValues,
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
};



//------employeess 

const getEmployees = async (req, res) => {
    try {
        const query = queries.getEmployees;

        const query_getallBrachAdress = `SELECT branchID, address FROM Branch;`;
        const positionQuery = `SELECT positionID, role FROM Position;`;
        const positions = (await pool.query(positionQuery)).rows;
        
        const branches = (await pool.query(query_getallBrachAdress)).rows;
        const result = await pool.query(query);
        const employees = result.rows;
        console.log(employees[0])
        console.log(branches[0])

        res.render('pages/employees', { employees , branches , positions });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).send('Failed to fetch employees');
    }
};


const getEmployeeDetails = async (req, res) => {
    const { id } = req.params; // Employee ID from URL

    try {
        const query = queries.getEmployeeDetails;

        const result = await pool.query(query, [id]); 
        const employee = result.rows[0];

        if (!employee) {
            return res.status(404).send('Employee not found');
        }

        res.render('pages/employeeDetails', { employee }); // Render the EJS file with data
    } catch (error) {
        console.error('Error fetching employee details:', error);
        res.status(500).send('Failed to fetch employee details');
    }
};


const addEmployee = async (req, res) => {
    const { branchID, name, email, phonenumber, positionID, password } = req.body;

    try {
        // Insert the new employee into the Employee table
        const query = queries.addEmployee;

        // Generate a username based on the name (e.g., "alice.johnson" becomes "alice.j")
        const username = name.toLowerCase().split(' ').join('.');

        await pool.query(query, [branchID, name, email, phonenumber, positionID, username, password]);

        // Redirect to the employees list page
        res.redirect('/admin/employees');
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).send('Failed to add employee');
    }
};

const deleteEmployee = async (req, res) => { // not working right now 
    const { id } = req.params;

    try {
        const query = `
            DELETE FROM Employee
            WHERE employeeID = $1
        `;

        await pool.query(query, [id]);

        // Redirect back to the employees list page after deletion
        res.redirect('/admin/employees');
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).send('Failed to delete employee');
    }
};

// Simulate 100 transactions

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateTransactionData = () => {
  const customers = [
      { accountNumber: 'CU001', name: 'John Doe', email: 'john.doe@example.com' },
      { accountNumber: 'CU002', name: 'Jane Smith', email: 'jane.smith@example.com' },
      { accountNumber: 'CU003', name: 'Michael Lee', email: 'michael.lee@example.com' },
      { accountNumber: 'CU004', name: 'Emily Davis', email: 'emily.davis@example.com' }
  ];

  const menuItems = [
      { itemid: 1, name: 'Pepperoni Pizza', price: 12.99 },
      { itemid: 2, name: 'Caesar Salad', price: 8.99 },
      { itemid: 3, name: 'Chocolate Cake', price: 6.50 },
      { itemid: 4, name: 'Coca-Cola', price: 1.99 }
  ];

  const numberOfItems = getRandomNumber(1, 4);
  const availableItems = [...menuItems];
  const cartItems = [];

  for (let i = 0; i < numberOfItems; i++) {
      const randomIndex = getRandomNumber(0, availableItems.length - 1);
      const item = availableItems[randomIndex];
      cartItems.push({
          itemid: item.itemid,
          quantity: getRandomNumber(1, 3),
          price: item.price
      });
      availableItems.splice(randomIndex, 1);
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const customer = getRandomItem(customers);
  const branchID = getRandomNumber(1, 2);
  const paymentType = getRandomItem(['Card', 'Cash']);

  return {
      accountNumber: customer.accountNumber,
      name: customer.name,
      email: customer.email,
      cartItems,
      totalAmount,
      branchID,
      paymentType
  };
};

const processMultipleTransactions = async (numberOfTransactions) => {
  let processed = 0;
  let successCount = 0;
  let failureCount = 0;

  console.log(`Starting to process ${numberOfTransactions} transactions...`);

  while (processed < numberOfTransactions) {
      const transactionData = generateTransactionData();
      try {
          if (transactionData.paymentType === 'Card') {
              console.log(`Processing transaction ${processed + 1} (Card)...`);
              await new Promise((resolve, reject) => {
                  processCardPayment({
                      body: {
                          accountNumber: transactionData.accountNumber,
                          name: transactionData.name,
                          email: transactionData.email,
                          cartItems: transactionData.cartItems,
                          totalAmount: transactionData.totalAmount,
                          branchID: transactionData.branchID
                      }
                  }, {
                      json: resolve,
                      status: () => ({ json: reject })
                  });
              });
          } else {
              console.log(`Processing transaction ${processed + 1} (Cash)...`);
              await new Promise((resolve, reject) => {
                  processCashPayment({
                      body: {
                          accountNumber: transactionData.accountNumber,
                          cartItems: transactionData.cartItems,
                          totalAmount: transactionData.totalAmount,
                          branchID: transactionData.branchID
                      }
                  }, {
                      json: resolve,
                      status: () => ({ json: reject })
                  });
              });
          }
          successCount++;
      } catch (error) {
          console.error(`Transaction ${processed + 1} failed: ${error.message}`);
          failureCount++;
      }

      processed++;
      if (processed % 10 === 0) {
          console.log(`Processed ${processed} transactions...`);
      }
  }

  console.log('All transactions completed.');
  console.log(`Success: ${successCount}, Failed: ${failureCount}`);
  return successCount;
};



const test100 = async (req, res) => {
  try {
      const count  = await processMultipleTransactions(100);
      console.log(`Completed ${count} transactions`);

      // Send a success response
      res.status(200).json({
          success: true,
          message: `Successfully processed ${count} transactions. and failed to ${100-count}`,
      });
  } catch (error) {
      console.error('Error:', error);

      // Send an error response
      res.status(500).json({
          success: false,
          message: 'An error occurred while processing transactions.',
          error: error.message, // Include error details for debugging
      });
  }
};

const getCustomers = async (req, res) => {
  try {
      // Query to fetch all customers
      const query = `SELECT * FROM Customer;`;
      const result = (await pool.query(query)).rows;

      console.log(result)

      res.render('pages/customers', { result });
  } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).send('Server Error');
  }
};

const getCashLogs = async (req, res) => {
  try {
      // Fetch all cash logs along with associated branch information
      const query = `
          SELECT cl.cashlogid, b.address AS branchname, cl.transactionid, cl.amount, cl.logdate
          FROM Cashlog cl
          JOIN Branch b ON cl.branchid = b.branchid
          ORDER BY cl.logdate DESC;
      `;
      const result = await pool.query(query);
      const cashLogs = result.rows;


      res.render('pages/cashLogs', { cashLogs });
  } catch (error) {
      console.error('Error fetching cash logs:', error);
      res.status(500).send('Server Error');
  }
};

const getCustomerDetails = async (req, res) => {
  const { id } = req.params; // Customer ID from the URL

  try {
      // Fetch customer details
      const customerQuery = queries.customer_details;
      const customerResult = await pool.query(customerQuery, [id]);

      if (customerResult.rows.length === 0) {
          return res.status(404).send('Customer not found');
      }

      const customer = customerResult.rows[0];

      // Fetch customer's past orders
      const ordersQuery = queries.pastorders;
      const ordersResult = await pool.query(ordersQuery, [id]);
      const orders = ordersResult.rows;

      // Fetch order items for each order
      const orderItemsQuery = `
          SELECT oi.orderID, mi.name AS itemName, oi.quantity, oi.price, oi.total
          FROM OrderItem oi
          JOIN MenuItem mi ON oi.itemID = mi.itemID
          WHERE oi.orderID = ANY ($1);
      `;
      const orderIDs = orders.map(order => order.orderid);
      const orderItemsResult = await pool.query(orderItemsQuery, [orderIDs]);
      const orderItems = orderItemsResult.rows;

      // Combine order items into their respective orders
      orders.forEach(order => {
          order.items = orderItems.filter(item => item.orderid === order.orderid);
      });

      // Fetch customer's transaction history
      const transactionsQuery = queries.customers_transaction_history;
      const transactionsResult = await pool.query(transactionsQuery, [id]);
      const transactions = transactionsResult.rows;

      // Render the customer details page
      res.render('pages/customerDetails', { customer, orders, transactions });
  } catch (error) {
      console.error('Error fetching customer details:', error);
      res.status(500).send('Server Error');
  }
};

module.exports= {
    getDeshboardData,
    getmenuitem,
    uploadNewMenu,
    getBranches,
    deleteMenuItem,
    uploadBranches,
    deleteBranch,
    getTransactions,
    getOrders,
    getOrderDetails,
    getDashboardStats,
    getChartData,
    getEmployees,
    getEmployeeDetails,
    addEmployee,
    deleteEmployee,
    test100,
    getCustomers,
    getCashLogs,
    getCustomerDetails,
    
    
};