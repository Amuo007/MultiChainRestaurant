// Query to get all menu items
const getMenuItems = 'SELECT itemID, name, price, imageaddress FROM menuitem';

const getBranchMenu = 
`
  SELECT mi.itemID, mi.name, mi.price, mi.description, mi.imageaddress 
  FROM MenuItem mi
  JOIN BranchMenu bm ON mi.itemID = bm.itemID
  WHERE bm.branchID = $1 AND bm.availability = TRUE
`

const checkAccountExists = "SELECT * FROM Customer WHERE accountnumber = $1;";

// Register a new customer
const registerCustomer = `
  INSERT INTO customer (name, email, accountnumber) 
  VALUES ($1, $2, $3) 
  RETURNING customerid;
`;

// Create an order
const createOrder = `
  INSERT INTO orders (customerid, branchid, total) 
  VALUES ($1, $2, $3)
  RETURNING orderid;
`;

// Get itemID and price by item name
const getItemByName = "SELECT itemid, price FROM menuitem WHERE menuitem.name = $1;";

// Add an item to OrderItems
const createOrderItem = `
  INSERT INTO orderitem (orderid, itemid, quantity, price) 
  VALUES ($1, $2, $3, $4);
`;

// Update Customer Bank Account balance
const updateCustomerBalance = `
  UPDATE customer
  SET balance = balance - $1 
  WHERE accountnumber = $2;
`;

// Update Restaurant Bank Account balance
const updateBranchBalance = `
  UPDATE branch 
  SET balance = balance + $1 
  WHERE branchid = $2;
`;

// Insert transaction record
const createTransaction = `
  INSERT INTO transaction (branchid, transactiontype, amount) 
  VALUES ($1, $2, $3);
`;




// ----------admin --------------

const fetchAllMenuItems = `
  SELECT 
    mi.itemID,
    mi.name AS item_name,
    mi.categoryID,
    c.name AS category_name,
    mi.price,
    mi.description,
    mi.imageaddress
  FROM 
    MenuItem mi
  LEFT JOIN 
    Category c ON mi.categoryID = c.categoryID;
`;

const addMenuItem = `
  INSERT INTO MenuItem (name, categoryID, price, description, imageaddress) 
  VALUES 
    ($1, $2, $3, $4, $5)
  RETURNING itemID;  -- This fetches the newly generated itemID
`;

const getCategories = `
SELECT name FROM Category;
`
const categoryQuery = `
     SELECT categoryID FROM Category WHERE name = $1;

`

const getBranches = `SELECT branchID, address FROM Branch;`

const branchMenuQuery = `
        SELECT bm.itemID, b.branchID, b.address
        FROM BranchMenu bm
        JOIN Branch b ON bm.branchID = b.branchID;
      `;

const getTransactions = `
            SELECT 
                t.transactionID, 
                t.transactiontype, 
                CAST(t.amount AS FLOAT) AS amount, 
                t.transactiondate, 
                b.address AS branchName 
            FROM Transaction t
            INNER JOIN Branch b ON t.branchID = b.branchID
        `;      

const getOrders = `
  SELECT 
    o.orderID,
    COALESCE(c.name, 'Guest') AS customerName,
    STRING_AGG(mi.name, ', ') AS itemNames,
    SUM(oi.price * oi.quantity) AS orderTotal,
    o.orderdate AS orderTime,
    b.address AS branchName
FROM Orders o
LEFT JOIN Customer c ON o.customerID = c.customerID
INNER JOIN OrderItem oi ON o.orderID = oi.orderID
INNER JOIN MenuItem mi ON oi.itemID = mi.itemID
INNER JOIN Branch b ON o.branchID = b.branchID
GROUP BY o.orderID, c.name, o.orderdate, b.address
ORDER BY o.orderdate;
    `;


    const getOrderDetails = `
    SELECT 
        o.orderID,
        COALESCE(c.name, 'Guest') AS customerName,
        COALESCE(c.email, 'N/A') AS customerEmail,
        b.address AS branchAddress,
        o.orderdate AS orderTime,
        STRING_AGG(mi.name || ' x ' || oi.quantity || ' ($' || oi.price || ')', ', ') AS itemsOrdered,
        SUM(oi.total) AS orderTotal,
        t.transactiontype AS paymentType,
        t.amount AS transactionAmount,
        t.transactiondate AS transactionTime
    FROM Orders o
    LEFT JOIN Customer c ON o.customerID = c.customerID
    INNER JOIN Branch b ON o.branchID = b.branchID
    INNER JOIN OrderItem oi ON o.orderID = oi.orderID
    INNER JOIN MenuItem mi ON oi.itemID = mi.itemID
    LEFT JOIN Transaction t ON t.branchID = o.branchID AND t.amount = o.total
    WHERE o.orderID = $1
    GROUP BY o.orderID, c.name, c.email, b.address, o.orderdate, t.transactiontype, t.amount, t.transactiondate;
`;


const weeklyPerformanceResult = `
            SELECT to_char(orderdate, 'MM/DD') AS day, COUNT(orderID) AS orders, SUM(total) AS revenue
            FROM Orders
            WHERE orderdate >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY day
            ORDER BY day;
        `
        const revenueDistributionResult = `
          SELECT c.name AS category, SUM(oi.total) AS revenue
          FROM OrderItem oi
          INNER JOIN MenuItem mi ON oi.itemID = mi.itemID
          INNER JOIN Category c ON mi.categoryID = c.categoryID
          GROUP BY c.name
          ORDER BY revenue DESC
          LIMIT 5;
      `

      const getEmployees = `
      SELECT 
          e.employeeID,
          e.name,
          e.email,
          e.phonenumber,
          b.address AS branchAddress,
          p.role,
          e.username
      FROM 
          Employee e
      LEFT JOIN 
          Branch b ON e.branchID = b.branchID
      LEFT JOIN 
          Position p ON e.positionID = p.positionID;
  `;
  const getEmployeeDetails = `
  SELECT 
      e.name,
      e.email,
      e.phonenumber,
      e.username,
      e.password,
      b.address AS branchAddress,
      p.role,
      p.salary
  FROM 
      Employee e
  LEFT JOIN 
      Branch b ON e.branchID = b.branchID
  LEFT JOIN 
      Position p ON e.positionID = p.positionID
  WHERE 
      e.employeeID = $1;
`;

const addEmployee = `
            INSERT INTO Employee (branchID, name, email, phonenumber, positionID, username, password)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
const pastorders = `SELECT o.orderID, o.orderdate, o.total, b.address AS branch
          FROM Orders o
          JOIN Branch b ON o.branchID = b.branchID
          WHERE o.customerID = $1
          ORDER BY o.orderdate DESC;`
const customers_transaction_history = ` SELECT t.transactionID, t.transactiontype, t.amount, t.transactiondate, b.address AS branch
          FROM Transaction t
          JOIN Branch b ON t.branchID = b.branchID
          WHERE t.branchID IN (
              SELECT branchID FROM Orders WHERE customerID = $1
          )
          ORDER BY t.transactiondate DESC;`

const customer_details = `SELECT customerID, name, email, accountnumber, balance
          FROM Customer
          WHERE customerID = $1;`

module.exports = {
    getMenuItems,
    checkAccountExists,
    registerCustomer,
    createOrder,
    getItemByName,
    createOrderItem,
    createTransaction,
    fetchAllMenuItems,
    addMenuItem,
    getCategories,
    categoryQuery,
    getBranches,
    getBranchMenu,
    updateBranchBalance,
    updateCustomerBalance,
    branchMenuQuery,
    getTransactions,
    getOrders,
    getOrderDetails,
    weeklyPerformanceResult,
    revenueDistributionResult,
    getEmployees,
    getEmployeeDetails,
    addEmployee,
    pastorders,
    customers_transaction_history,
    customer_details,
};
