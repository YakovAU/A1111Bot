const baseRestrictedWords = ['child', 'kid', 'children'];
const adultWords = ['nude', 'naked', 'porn'];

function containsRestrictedContent(prompt) {
    const normalizedPrompt = prompt.toLowerCase();
    return baseRestrictedWords.some(word => normalizedPrompt.includes(word)) &&
        adultWords.some(word => normalizedPrompt.includes(word));
}

module.exports = { containsRestrictedContent };
