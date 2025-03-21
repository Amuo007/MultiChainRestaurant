
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const admincontroller = require('./adminController');



//----ADMIN---ROUTES------

router.get('/', (req, res) => {
    res.redirect('admin/overview')
});

router.get('/overview', admincontroller.getDashboardStats)

// Add the API route
router.get('/api/chart-data', admincontroller.getChartData);

router.get('/orders',admincontroller.getOrders)

router.get('/orders/details/:id', admincontroller.getOrderDetails);


router.get('/menu', admincontroller.getmenuitem)

router.post('/upload/menu',admincontroller.uploadNewMenu)

// Delete menu item
router.get('/menu/delete/:itemID',admincontroller.deleteMenuItem); // not working 





router.get('/transactions', admincontroller.getTransactions)

router.get('/branches', admincontroller.getBranches)

router.post('/branches/add', admincontroller.uploadBranches);

// Route to delete a branch
router.post('/branches/delete/:id', admincontroller.deleteBranch); // not working 






// Add employee route
router.post('/employees/add', admincontroller.addEmployee);


router.get('/employees', admincontroller.getEmployees)

router.get('/employees/details/:id', admincontroller.getEmployeeDetails); // not working 

router.post('/employees/delete/:id', admincontroller.deleteEmployee); // not working 

router.get('/customers',admincontroller.getCustomers);

router.get('/cashLogs',admincontroller.getCashLogs)

router.get('/customers/details/:id', admincontroller.getCustomerDetails);
 



module.exports = router;
