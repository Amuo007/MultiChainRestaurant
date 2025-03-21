// Selectors
let openShopping = document.querySelector('.shopping');
let closeShopping = document.querySelector('.closeShopping');
let list = document.querySelector('.list');
let listCard = document.querySelector('.listCard');
let body = document.querySelector('body');
let total = document.querySelector('.total');
let quantity = document.querySelector('.quantity');
let branchSelect = document.getElementById('branchSelect'); // Branch dropdown

// Event Listeners
openShopping.addEventListener('click', () => {
    body.classList.add('active');
});
closeShopping.addEventListener('click', () => {
    body.classList.remove('active');
});

// State variables
let products = [];
let listCards = JSON.parse(localStorage.getItem('cart')) || [];

// Fetch products from the selected branch
async function fetchProducts(branchID) {
    try {
        const response = await axios.get(`http://localhost:3000/api/branchmenu/${branchID}`);
        products = response.data.map(item => ({
            ...item,
            id: item.itemid, // Rename itemid to id
            price: parseFloat(item.price), // Parse price as float
            image: item.imageaddress // Use image address directly
        }));
        initApp();
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Populate branch dropdown
async function fetchBranches() {
    try {
        const response = await axios.get('http://localhost:3000/api/branches');
        branchSelect.innerHTML = ''; // Clear existing options

        response.data.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch.branchid;
            option.textContent = branch.address; // Use branch name for display
            branchSelect.appendChild(option);
        });

        // Fetch products for the first branch by default
        if (response.data.length > 0) {
            fetchProducts(response.data[0].branchid);
        }
    } catch (error) {
        console.error("Error fetching branches:", error);
    }
}

// Initialize products in the DOM
function initApp() {
    list.innerHTML = '';
    products.forEach((value, key) => {
        let newDiv = document.createElement('div');
        newDiv.classList.add('item');
        newDiv.innerHTML = `
            <img src="${value.image}" alt="${value.name}">
            <div class="title">${value.name}</div>
            <div class="price">$${value.price.toLocaleString()}</div>
            <button onclick="addToCard(${key})">Add To Cart</button>`;
        list.appendChild(newDiv);
    });
}

// Add item to cart
function addToCard(key) {
    const existingItem = listCards.find(item => item?.id === products[key].id);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        listCards.push({ ...products[key], quantity: 1 });
    }

    reloadCard();
}

// Change item quantity
function changeQuantity(key, newQuantity) {
    if (newQuantity <= 0) {
        listCards = listCards.filter((_, index) => index !== key);
    } else {
        listCards[key].quantity = newQuantity;
    }

    reloadCard();
}

// Reload cart and update the DOM
function reloadCard() {
    listCard.innerHTML = '';
    let count = 0;
    let totalPrice = 0;

    listCards.forEach((value, key) => {
        if (value) {
            totalPrice += value.price * value.quantity;
            count += value.quantity;

            let newDiv = document.createElement('li');
            newDiv.innerHTML = `
                <div><img src="${value.image}" alt="${value.name}"></div>
                <div>${value.name}</div>
                <div>$${value.price.toLocaleString()}</div>
                <div>
                    <button onclick="changeQuantity(${key}, ${value.quantity - 1})">-</button>
                    <div class="count">${value.quantity}</div>
                    <button onclick="changeQuantity(${key}, ${value.quantity + 1})">+</button>
                </div>`;
            listCard.appendChild(newDiv);
        }
    });

    total.innerText = `$${totalPrice.toLocaleString()}`;
    quantity.innerText = count;

    // Save the updated cart to local storage
    localStorage.setItem('cart', JSON.stringify(listCards));
}

// Clear cart
function clearCart() {
    listCards = [];
    reloadCard();
}

// Event listener for branch selection
branchSelect.addEventListener('change', (event) => {
    const branchID = event.target.value;
    fetchProducts(branchID);
});

// Load data on page load
window.addEventListener('load', () => {
    fetchBranches();
    reloadCard();
});

// Proceed to Checkout function
function proceedToCheckout() {
    if (listCards.length === 0) {
        alert('Your cart is empty! Please add some items before proceeding to checkout.');
        return;
    }

    // Save the branch ID to localStorage before redirecting
    const branchID = branchSelect.value;
    localStorage.setItem('branchID', branchID); // Store branchID in localStorage

    // Redirect to transaction.html
    window.location.href = 'transaction.html';
}