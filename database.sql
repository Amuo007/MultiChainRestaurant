-- Drop tables in the correct order to avoid dependency issues
DROP TABLE IF EXISTS Employee CASCADE;
DROP TABLE IF EXISTS Position CASCADE;
DROP TABLE IF EXISTS Cashlog CASCADE;
DROP TABLE IF EXISTS Transaction CASCADE;
DROP TABLE IF EXISTS OrderItem CASCADE;
DROP TABLE IF EXISTS Orders CASCADE;
DROP TABLE IF EXISTS BranchMenu;
DROP TABLE IF EXISTS MenuItem CASCADE;
DROP TABLE IF EXISTS Category CASCADE;
DROP TABLE IF EXISTS Customer CASCADE;
DROP TABLE IF EXISTS Branch CASCADE;

CREATE TABLE Branch (
    branchID SERIAL PRIMARY KEY,
    address VARCHAR(100) NOT NULL,
    phonenumber VARCHAR(15) UNIQUE,
    accountnumber VARCHAR(20) UNIQUE,
    balance NUMERIC(15, 2) DEFAULT 1000 CHECK (balance >= 0)
);

CREATE TABLE Customer (
    customerID SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    accountnumber VARCHAR(20) UNIQUE,
    balance NUMERIC(15, 2) DEFAULT 200 CHECK (balance >= 0)
);

CREATE TABLE Category (
    categoryID SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE MenuItem (
    itemID SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    categoryID INT REFERENCES Category(categoryID) ON DELETE SET NULL,
    price NUMERIC(7, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    imageaddress TEXT  -- URL to store the item's image
);
 --------------------------
CREATE TABLE BranchMenu (
    branchID INT REFERENCES Branch(branchID) ON DELETE CASCADE,
    itemID INT REFERENCES MenuItem(itemID) ON DELETE CASCADE,
    availability BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (branchID, itemID)
);


CREATE TABLE Orders (
    orderID SERIAL PRIMARY KEY,
    orderdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customerID INT REFERENCES Customer(customerID) ON DELETE SET NULL,
    branchID INT REFERENCES Branch(branchID) ON DELETE CASCADE,
    total NUMERIC(10, 2) CHECK (total >= 0)
);

CREATE TABLE OrderItem (
    orderID INT NOT NULL REFERENCES Orders(orderID) ON DELETE CASCADE,
    itemID INT NOT NULL REFERENCES MenuItem(itemID) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    total NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
    PRIMARY KEY (orderID, itemID)
);
CREATE INDEX idx_itemID ON OrderItem(itemID);

CREATE TABLE Transaction (
    transactionID SERIAL PRIMARY KEY,
    branchID INT REFERENCES Branch(branchID) ON DELETE CASCADE,
    transactiontype VARCHAR(20) CHECK (transactiontype IN ('Card', 'Cash')),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    transactiondate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Cashlog (
    cashlogID SERIAL PRIMARY KEY,
    branchID INT REFERENCES Branch(branchID) ON DELETE CASCADE,
    transactionID INT REFERENCES Transaction(transactionID) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    logdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Position (
    positionID SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    salary NUMERIC(10, 2) NOT NULL CHECK (salary > 0)
);

CREATE TABLE Employee (
    employeeID SERIAL PRIMARY KEY,
    branchID INT REFERENCES Branch(branchID) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phonenumber VARCHAR(15) UNIQUE,
    positionID INT REFERENCES Position(positionID) ON DELETE SET NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Trigger to auto update cashlog if there is a transaction with type cash
CREATE OR REPLACE FUNCTION insert_cashlog()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert into Cashlog if the transaction type is 'Cash'
    IF NEW.transactiontype = 'Cash' THEN
        INSERT INTO Cashlog (branchID, transactionID, amount, logdate)
        VALUES (NEW.branchID, NEW.transactionID, NEW.amount, NEW.transactiondate);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_transaction_insert
AFTER INSERT ON Transaction
FOR EACH ROW
EXECUTE FUNCTION insert_cashlog();

CREATE OR REPLACE FUNCTION delete_unlinked_menu_items()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the itemID still exists in the BranchMenu table
    IF NOT EXISTS (SELECT 1 FROM BranchMenu WHERE itemID = OLD.itemID) THEN
        DELETE FROM MenuItem WHERE itemID = OLD.itemID;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_branch_menu_delete
AFTER DELETE ON BranchMenu
FOR EACH ROW
EXECUTE FUNCTION delete_unlinked_menu_items();


--Sample Data
-- Insert sample data
INSERT INTO Branch (address, phonenumber, accountnumber, balance) VALUES
('123 Main Street', '123-456-7890', 'BR001', 2000),
('456 Elm Street', '987-654-3210', 'BR002', 1500);

INSERT INTO Customer (name, email, accountnumber, balance) VALUES
('John Doe', 'john.doe@example.com', 'CU001', 100),
('Jane Smith', 'jane.smith@example.com', 'CU002', 200),
('Michael Lee', 'michael.lee@example.com', 'CU003', 150),
('Emily Davis', 'emily.davis@example.com', 'CU004', 300);

INSERT INTO Category (name) VALUES
('Appetizers'),
('Main Course'),
('Sides'),
('Beverages'),
('Desserts'),
('Pizza'),
('Salads');

INSERT INTO MenuItem (name, categoryID, price, description, imageaddress) VALUES
('Pepperoni Pizza', 6, 12.99, 'Classic pepperoni pizza.', 'https://www.simplyrecipes.com/thmb/2MQuChhZANaSSxdL1a0tA6nBgmQ=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/__opt__aboutcom__coeus__resources__content_migration__simply_recipes__uploads__2019__09__easy-pepperoni-pizza-lead-4-82c60893fcad4ade906a8a9f59b8da9d.jpg'),
('Caesar Salad', 7, 8.99, 'Crisp romaine lettuce.', 'https://www.allrecipes.com/thmb/FrsUbyGnvz1lYty6mPhXdc4Ke6E=/0x512/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/229063-Classic-Restaurant-Caesar-Salad-ddmfs-4x3-231-89bafa5e54dd4a8c933cf2a5f9f12a6f.jpg'),
('Chocolate Cake', 5, 6.50, 'Rich chocolate cake slice.', 'https://bluebowlrecipes.com/wp-content/uploads/2023/08/chocolate-truffle-cake-8844.jpg'),
('Coca-Cola', 4, 1.99, 'Chilled Coca-Cola can.', 'data:image/webp;base64,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'),
('Garlic Bread', 1, 4.99, 'Toasted bread with garlic butter.', 'https://www.ambitiouskitchen.com/wp-content/uploads/2023/02/Garlic-Bread-4-1064x1064.jpg'),
('Grilled Chicken Sandwich', 2, 9.99, 'Juicy grilled chicken with fresh lettuce and tomato.', 'https://www.cucinabyelena.com/wp-content/uploads/2024/03/Ultimate-Grilled-Chicken-Sandwich-Recipe-16-scaled.jpg'),
('French Fries', 3, 3.99, 'Crispy golden french fries.', 'https://www.recipetineats.com/tachyon/2022/09/Fries-with-rosemary-salt_1.jpg?resize=900%2C1125&zoom=0.86'),
('Lemonade', 4, 2.99, 'Freshly squeezed lemonade.', 'https://www.foodiecrush.com/wp-content/uploads/2022/06/Lemonade-foodiecrush.com-9-1.jpg'),
('Tiramisu', 5, 7.50, 'Italian dessert with coffee and mascarpone cheese.', 'https://handletheheat.com/wp-content/uploads/2023/12/best-tiramisu-recipe-SQUARE.jpg');

INSERT INTO BranchMenu (branchID, itemID, availability) VALUES
(1, 1, TRUE),
(1, 2, TRUE),
(1, 3, TRUE),
(2, 1, TRUE),
(2, 4, TRUE),
(1, 5, TRUE),
(1, 6, TRUE),
(1, 7, TRUE),
(2, 8, TRUE),
(2, 9, TRUE);

INSERT INTO Orders (customerID, branchID, total, orderdate) VALUES
(1, 1, 25.50, CURRENT_DATE - INTERVAL '6 days'),
(2, 2, 15.75, CURRENT_DATE - INTERVAL '5 days'),
(3, 1, 18.25, CURRENT_DATE - INTERVAL '4 days');

INSERT INTO OrderItem (orderID, itemID, quantity, price) VALUES
(1, 1, 1, 12.99),
(1, 3, 2, 6.50),
(2, 4, 3, 1.99),
(3, 2, 2, 8.99);


INSERT INTO Transaction (branchID, transactiontype, amount, transactiondate) VALUES
(1, 'Card', 25.50, CURRENT_DATE - INTERVAL '6 days'),
(2, 'Cash', 15.75, CURRENT_DATE - INTERVAL '5 days'),
(1, 'Card', 18.25, CURRENT_DATE - INTERVAL '4 days');

INSERT INTO Position (role, salary) VALUES
('Manager', 6000.00),
('Chef', 3500.00),
('Waiter', 1800.00);

INSERT INTO Employee (branchID, name, email, phonenumber, positionID, username, password) VALUES
(1, 'Alice Johnson', 'alice.johnson@example.com', '555-123-4567', 1, 'alice.j', 'securepass1'),
(1, 'Bob Williams', 'bob.williams@example.com', '555-765-4321', 2, 'bob.w', 'securepass2'),
(2, 'Charlie Brown', 'charlie.brown@example.com', '555-987-6543', 3, 'charlie.b', 'securepass3');