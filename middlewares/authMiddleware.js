module.exports = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next(); // Proceed to the next middleware or route handler
    }
    res.redirect('/auth/login'); // Redirect to login if not authenticated
};