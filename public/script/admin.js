// Function to fetch data from the backend and display in the table
async function fetchAndDisplayTableData(apiUrl, tableId) {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        const tableBody = document.querySelector(`#${tableId} tbody`);
        tableBody.innerHTML = ''; // Clear existing data

        data.forEach(row => {
            const tr = document.createElement('tr');
            for (const key in row) {
                const td = document.createElement('td');
                td.textContent = row[key];
                tr.appendChild(td);
            }
            tableBody.appendChild(tr);
        });
    } catch (error) {
        console.error(`Error fetching data from ${apiUrl}:`, error);
    }
}

// Fetch and display data for each table on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTableData('http://localhost:3000/api/branch', 'branch-table');
    fetchAndDisplayTableData('http://localhost:3000/api/customer', 'customer-table');
    fetchAndDisplayTableData('http://localhost:3000/api/category', 'category-table');
    fetchAndDisplayTableData('http://localhost:3000/api/menu-items', 'menu-items-table');
    fetchAndDisplayTableData('http://localhost:3000/api/orders', 'orders-table');
    fetchAndDisplayTableData('http://localhost:3000/api/order-items', 'order-items-table');
    fetchAndDisplayTableData('http://localhost:3000/api/transactions', 'transactions-table');
    fetchAndDisplayTableData('http://localhost:3000/api/restaurant-bank-account', 'restaurant-bank-account-table');
    fetchAndDisplayTableData('http://localhost:3000/api/customer-bank-account', 'customer-bank-account-table');
});
