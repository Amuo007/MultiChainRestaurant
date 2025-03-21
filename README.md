
# Fast Food Chain Website - Database Management System
**Course Project - DBMS Class**  
**Group 24: Amrinder Singh, Henri**

## Project Overview
This repository contains a prototype implementation of a database system for a fast food chain. The system manages branches, menus, customers, orders, and transactions through a well-structured relational database design implemented in PostgreSQL.

The system enables:
- Branch management with location tracking and financial reporting
- Menu management with support for branch-specific availability
- Customer account management with balance tracking
- Order processing with complete transaction history
- Employee management with role-based access

> **Note:** This represents a prototype version developed as part of our DBMS class project. Some aspects of the implementation may require further refinement for production use.

## 1. Database Architecture

### Core Tables
The database consists of the following main entities:

| Table       | Description                             | Key Fields                                                |
|-------------|-----------------------------------------|-----------------------------------------------------------|
| Branch      | Store locations and their information   | branchID, address, phoneNumber, accountNumber, balance    |
| Customer    | Customer profiles and account details   | customerID, name, email, accountNumber, balance           |
| Category    | Food categories (e.g., Burgers, Drinks) | categoryID, name                                          |
| MenuItem    | Individual food items with prices       | itemID, name, categoryID, price, description, imageAddress |
| BranchMenu  | Maps available items to branches        | branchID, itemID, availability                            |
| Orders      | Customer order information              | orderID, orderDate, customerID, branchID, total           |
| OrderItem   | Items within each order                 | orderID, itemID, quantity, price, total                   |
| Transaction | Payment records                         | transactionID, branchID, transactionType, amount, transactionDate |
| Cashlog     | Cash flow tracking                      | cashlogID, branchID, transactionID, amount, logDate       |
| Position    | Employee roles and positions            | positionID, role, salary                                  |
| Employee    | Staff information                       | employeeID, branchID, positionID, name, email, phoneNumber, username, password |

### Normalization
- All tables satisfy **3NF/BCNF** requirements
- Primary and composite keys are implemented where appropriate
- `OrderItem` utilizes a composite key formed by `orderID` and `itemID`
- `Transaction` uses `transactionID` as the primary key

### Database Diagrams

#### Database Schema
![ERD Diagram](images/erd_diagram.png)

#### UML Class Diagram
![UML Diagram](images/uml_diagram.png)

## 2. Relationship Design

### One-to-Many Relationships
- Branch → Order (One branch **handles** many orders)
- MenuItem → Category (Each item **belongs to** one category)
- Customer → Order (One customer **places** multiple orders)
- Order → OrderItem (One order **includes** multiple items)
- Branch → Transaction (One branch **processes** many transactions)
- Branch → Employee (One branch **employs** multiple staff)
- Position → Employee (One position **has** multiple employees)
- MenuItem → BranchMenu (One menu item is **listed in** multiple branch menus)
- Branch → BranchMenu (One branch **offers** multiple menu items)
- Transaction → Cashlog (One transaction **generates** one cashlog entry)

### Entity Relationships
- Branch is the central entity connecting employees, transactions, and orders
- Orders connect customers with branches and menu items
- MenuItem connects categories with order items through the menu system
- Each relationship incorporates proper foreign key constraints as shown in the schema diagram

## 3. Key SQL Queries

### Menu Item Availability
```sql
SELECT mi.itemID, mi.name, mi.price, mi.description, mi.imageaddress 
FROM MenuItem mi 
JOIN BranchMenu bm ON mi.itemID = bm.itemID 
WHERE bm.branchID = $1 AND bm.availability = TRUE;
```

### Order History Report
```sql
SELECT o.orderID, COALESCE(c.name, 'Guest') AS customerName,   
STRING_AGG(mi.name, ', ') AS itemNames, 
SUM(oi.price * oi.quantity) AS orderTotal, 
o.orderdate AS orderTime, b.address AS branchName
FROM Orders o
LEFT JOIN Customer c ON o.customerID = c.customerID
INNER JOIN OrderItem oi ON o.orderID = oi.orderID
INNER JOIN MenuItem mi ON oi.itemID = mi.itemID
INNER JOIN Branch b ON o.branchID = b.branchID
GROUP BY o.orderID, c.name, o.orderdate, b.address
ORDER BY o.orderdate;
```

## 4. Transaction Processing Logic

### Customer Registration Flow
```sql
DO $$
DECLARE
    customerId INT;
BEGIN
    SELECT customerid INTO customerId
    FROM Customer
    WHERE accountnumber = 'accountNumberPlaceholder';

    IF customerId IS NULL THEN
        INSERT INTO customer (name, email, accountnumber)
        VALUES ('namePlaceholder', 'emailPlaceholder', 'accountNumberPlaceholder')
        RETURNING customerid INTO customerId;

        UPDATE customer
        SET balance = 'initialBalancePlaceholder'
        WHERE accountnumber = 'accountNumberPlaceholder';
    END IF;
END $$;

COMMIT;
```

### Order Processing Workflow
1. Verify customer exists and has sufficient balance
2. Create new order record
3. Insert individual order items
4. Update customer and branch balances
5. Record transaction details

### Transaction Implementation
```sql
BEGIN;

-- Check if account exists and retrieve balance
DO $$
DECLARE
    customerId INT;
    customerBalance NUMERIC;
BEGIN
    SELECT customerid, balance INTO customerId, customerBalance
    FROM Customer
    WHERE accountnumber = 'accountNumberPlaceholder';

    IF customerId IS NULL THEN
        RAISE EXCEPTION 'Customer does not exist.';
    ELSIF customerBalance < 'totalAmountPlaceholder' THEN
        RAISE EXCEPTION 'Insufficient balance.';
    END IF;
END $$;

-- Create order and insert order items
DO $$
DECLARE
    orderId INT;
BEGIN
    INSERT INTO orders (customerid, branchid, total)
    VALUES (
        (SELECT customerid FROM Customer WHERE accountnumber = 'accountNumberPlaceholder'),
        'branchIDPlaceholder',
        'totalAmountPlaceholder'
    )
    RETURNING orderid INTO orderId;

    INSERT INTO orderitem (orderid, itemid, quantity, price)
    SELECT orderId, item.itemid, item.quantity, item.price
    FROM UNNEST('cartItemsPlaceholder'::jsonb) AS item(itemid, quantity, price);
END $$;

-- Update balances
UPDATE customer
SET balance = balance - 'totalAmountPlaceholder'
WHERE accountnumber = 'accountNumberPlaceholder';

UPDATE branch
SET balance = balance + 'totalAmountPlaceholder'
WHERE branchid = 'branchIDPlaceholder';

-- Record transaction
INSERT INTO transaction (branchid, transactiontype, amount)
VALUES ('branchIDPlaceholder', 'Card', 'totalAmountPlaceholder');

COMMIT;
```

## 5. Testing and Performance

### Test Framework
We implemented a "Test 100" feature that simulates 100 random transactions to validate functionality and system robustness.

### Test Scenarios
- **Random Orders**: Various combinations and sizes of orders
- **Transaction Consistency**: Ensuring correct balance updates
- **Concurrency**: Handling multiple transactions at once
- **Error Handling**: For insufficient balances and edge cases

## 6. User Interface

### Customer-Facing Interface
![Home Page](images/home_page.png)  
*Home page with menu browsing and ordering interface*

### Administrative Dashboard
![Restaurant Dashboard](images/restaurant_dashboard.png)  
*Administrative dashboard with sales analytics and order management*

## Technology Stack
- **Database**: PostgreSQL
- **Schema Design**: Structured SQL with foreign keys and constraints
- **Transaction Management**: ACID-compliant logic
- **Error Handling**: Handled with SQL `RAISE` exceptions

## Contributors
- **Amrinder Singh**
- **Henri**

---

*This project was developed as part of our Database Management Systems course.*
