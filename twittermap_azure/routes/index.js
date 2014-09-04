
/*
 * GET home page.
 */

exports.index = function (req, res) {
    res.render('index', { title: 'Twitter Map' });
};
exports.photos = function (req, res) {
    res.render('photos', { title: 'Twitter Photos' });
};
