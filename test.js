var aes256 = require ('aes256');
var passKey = "MRTECH";

let x = "testp";
let y = aes256.encrypt(passKey,x);

console.log (y);

let z = aes256.decrypt(passKey,y)
console.log (z)