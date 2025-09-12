const mongoose = require('mongoose');

const cashInChequesaSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    customer: {
        type: String,
        required: true
    },
    product: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    paymentType: {
        type: String,
        required: true,
        default: 'Cheque'
    },
    paymentNote: String,
    transactionId: {
        type: String,
        unique: true,
        required: true,
        default: function() {
            return `${this.orderId}-${Date.now()}`;
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CashInChequesa', cashInChequesaSchema); 