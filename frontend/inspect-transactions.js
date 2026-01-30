
const transactions = require('@stacks/transactions');
console.log(Object.keys(transactions).filter(k => k.toLowerCase().includes('callreadonly')));
