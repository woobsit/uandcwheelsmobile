// src/email/helpers.js
const handlebars = require('handlebars');
const { format } = require('date-fns');

handlebars.registerHelper('formatDate', date => {
    if (!date || new Date(date).toString() === 'Invalid Date') {
        return 'N/A';
    }
    return format(new Date(date), 'MMMM d, yyyy');
});

handlebars.registerHelper('formatTime', date => {
    if (!date || new Date(date).toString() === 'Invalid Date') {
        return 'N/A';
    }
    return format(new Date(date), 'h:mm a');
});

handlebars.registerHelper('formatCurrency', amount => {
    return `₦${Number(amount).toLocaleString('en-US')}`;
});

handlebars.registerHelper('join', array => {
    if (Array.isArray(array)) {
        return array.join(', ');
    }
    return '';
});

// We don't export anything, just run this file to register the helpers