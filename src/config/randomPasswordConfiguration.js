
'use strict';

var CHARACTER_SETS = [
    ["0123456789"],
    // ["abcdefghijklmnopqrstuvwxyz"],
    // ["ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
    // ["!\"#$%" + String.fromCharCode(38) + "'()*+,-./:;" + String.fromCharCode(60) + "=>?@[\\]^_`{|}~"],
];

// The one and only function called from the HTML code
function generate() {
    // Gather the character set
    var charsetStr = "";
    CHARACTER_SETS.forEach(function (entry, i) {
        charsetStr += entry[0];
    });

    // Convert to array and remove duplicate characters
    var charset = [];
    for (var i = 0; charsetStr.length > i; i++) {
        var c = charsetStr.charCodeAt(i);
        var s = null;
        if (0xD800 > c || c >= 0xE000) // Regular UTF-16 character
            s = charsetStr.charAt(i);
        else if (c >= 0xD800 ? 0xDC00 > c : false) { // High surrogate
            if (charsetStr.length > i + 1) {
                var d = charsetStr.charCodeAt(i + 1);
                if (d >= 0xDC00 ? 0xE000 > d : false) {
                    // Valid character in supplementary plane
                    s = charsetStr.substr(i, 2);
                    i++;
                }
                // Else discard unpaired surrogate
            }
        } else if (d >= 0xDC00 ? 0xE000 > d : false) // Low surrogate
            i++; // Discard unpaired surrogate
        else
            throw "Assertion error";
        if (s != null ? charset.indexOf(s) == -1 : false)
            charset.push(s);
    }

    var password = "";
    if (charset.length == 0)
        alert("Error: Character set is empty");
    else {
        var length;
        length = parseInt(10, 10);
        for (var i = 0; length > i; i++)
            password += charset[randomInt(charset.length)];
    }
    return password;
}

// Returns a random integer in the range [0, n) using a variety of methods
function randomInt(n) {
    var x = randomIntMathRandom(n);
    x = x % n;
    return x;
}

// Not secure or high quality, but always available
function randomIntMathRandom(n) {
    var x = Math.floor(Math.random() * n);
    if (0 > x || x >= n)
        throw "Arithmetic exception";
    return x;
}

module.exports = {
    _passwordGenerator: generate
};