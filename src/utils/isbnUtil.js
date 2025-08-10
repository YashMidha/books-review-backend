export function isbn13to10(isbn13) {
    if (!isbn13 || typeof isbn13 !== "string") return null;

    isbn13 = isbn13.replace(/[-\s]/g, "");

    if (isbn13.length === 10){
        return isbn13;
    }

    if (!/^\d{13}$/.test(isbn13) || !isbn13.startsWith("978")) {
        return null;
    }

    const core = isbn13.substring(3, 12);

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += (10 - i) * parseInt(core[i], 10);
    }
    let check = 11 - (sum % 11);
    if (check === 10) check = "X";
    else if (check === 11) check = "0";

    return core + check;
}

export function isbn10to13(isbn10) {
    if (!isbn10 || typeof isbn10 !== "string") return null;

    const cleanIsbn = isbn10.replace(/[-\s]/g, '');

    if (cleanIsbn.length === 13 && /^\d{13}$/.test(cleanIsbn)) {
        return cleanIsbn;
    }

    if (!/^\d{9}[\dX]$/i.test(cleanIsbn)) {
        return null;
    }

    const core = cleanIsbn.substring(0, 9);
    const isbn13WithoutCheckDigit = '978' + core;

    let sum = 0;
    for (let i = 0; i < isbn13WithoutCheckDigit.length; i++) {
        const digit = parseInt(isbn13WithoutCheckDigit[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    const remainder = sum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;

    return isbn13WithoutCheckDigit + checkDigit;
}
