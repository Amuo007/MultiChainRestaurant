document.addEventListener('DOMContentLoaded', () => {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const branchID = localStorage.getItem('branchID'); // Get the branch ID from localStorage
    const accountNumber = localStorage.getItem('accountNumber'); // Pre-stored account number
    let totalAmount = 0;

    const orderItemsList = document.querySelector('.orderItems');
    const totalDisplay = document.querySelector('.total');
    const transactionForm = document.getElementById('transactionForm');
    const customerModal = document.getElementById('customerModal');
    const customerForm = document.getElementById('customerForm');
    const messageDisplay = document.querySelector('.message');

    // Populate cart display
    cartItems.forEach(item => {
        if (item) {
            totalAmount += item.price * item.quantity;
            const listItem = document.createElement('li');
            listItem.textContent = `${item.name} - $${(item.price * item.quantity).toLocaleString()} (Qty: ${item.quantity})`;
            orderItemsList.appendChild(listItem);
        }
    });
    totalDisplay.textContent = `$${totalAmount.toLocaleString()}`;

    // Handle payment form submission
    transactionForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Ensure account number is available
        if (!accountNumber) {
            displayError('Account number is missing. Please register or try again.');
            return;
        }

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        if (!paymentMethod) {
            displayError('Please select a payment method.');
            return;
        }

        try {
            // Display confirmation popup
            if (!confirm(`Confirm ${paymentMethod.toUpperCase()} payment of $${totalAmount.toFixed(2)}?`)) {
                return;
            }

            const endpoint = paymentMethod === 'card' ? '/api/processCardPayment' : '/api/processCashPayment';

            const { data } = await axios.post(endpoint, {
                accountNumber, // Use pre-stored account number
                branchID,
                cartItems,
                totalAmount,
            });

            if (data.success) {
                displayMessage('Order successfully completed!');
                clearCart();
                setTimeout(() => {
                    window.location.href = 'menu.html'; // Redirect to menu.html
                }, 1150);
            } else if (data.message === 'Account does not exist. Please register.') {
                customerModal.style.display = 'block';
            } else {
                displayError(data.message || 'Error processing payment.');
            }
        } catch (error) {
            console.error(error);
            displayError('An error occurred. Please try again later.');
        }
    });

    // Handle new customer registration
    customerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const customerData = {
            name: document.getElementById('customerName').value.trim(),
            email: document.getElementById('customerEmail').value.trim(),
        };

        try {
            const { data } = await axios.post('/api/registerCustomer', customerData);
            if (data.success) {
                customerModal.style.display = 'none';
                displayMessage('Customer registered successfully! Please try your payment again.');
            } else {
                displayError(data.message || 'Error registering customer.');
            }
        } catch (error) {
            console.error(error);
            displayError('Error registering customer.');
        }
    });

    // Helper functions
    function displayMessage(message) {
        messageDisplay.textContent = message;
    }

    function displayError(message) {
        console.error(message);
        messageDisplay.textContent = message;
    }

    function clearCart() {
        localStorage.removeItem('cart');
        orderItemsList.innerHTML = '';
        totalDisplay.textContent = '0.00';
    }

    // Close modal when the user clicks the 'X' button
    document.querySelector('.close').addEventListener('click', () => {
        customerModal.style.display = 'none';
    });
});
