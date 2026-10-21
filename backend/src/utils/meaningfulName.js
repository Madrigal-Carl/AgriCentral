export const MEANINGFUL_NAME_ERROR = "Enter a meaningful name in proper case";

export function isMeaningfulName(value) {
    const text = value.trim();
    const letters = text.replace(/[^a-z]/gi, "");
    return letters.length >= 3 &&
        text !== text.toLowerCase() && text !== text.toUpperCase() &&
        /[aeiou]/i.test(letters) && !/^(.)\1+$/i.test(letters) &&
        !/^(abc|asdf|qwerty|test|testing|xyz|junk|sample|123)$/i.test(text);
}
