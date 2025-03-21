document.getElementById('registrationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const customerData = {
        name: document.getElementById('customerName').value.trim(),
        email: document.getElementById('customerEmail').value.trim(),
        accountnumber: document.getElementById('accountNumber').value.trim(),
    };

    try {
        // Step 1: Check if the account number already exists
        const checkResponse = await axios.get(`/checkAccountExists/${customerData.accountnumber}`);
        
        if (checkResponse.data.exists) {
            // Account exists, proceed to the next phase
            localStorage.setItem('accountNumber', customerData.accountnumber);

            document.querySelector('.message').textContent = 'Account already exists. Proceeding to the next phase...';

            // Redirect to order.html immediately
            setTimeout(() => {
                window.location.href = 'order.html';
            }, 1150);

            return; // Skip registration
        }

        // Step 2: Register the customer if account does not exist
        const registerResponse = await axios.post('/api/registerCustomer', customerData);

        if (registerResponse) {
            // Save account number to localStorage
            localStorage.setItem('accountNumber', customerData.accountnumber);

            document.querySelector('.message').textContent = 'Customer registered successfully!';

            // Redirect to order.html page
            setTimeout(() => {
                window.location.href = 'order.html';
            }, 2000);
        } else {
            document.querySelector('.message').textContent = registerResponse.data.message || 'Error registering customer.';
        }
    } catch (error) {
        console.error(error);
        document.querySelector('.message').textContent = 'An error occurred. Please try again.';
    }
});
