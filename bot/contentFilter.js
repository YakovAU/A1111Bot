const restrictedWords = ['child', 'kid', 'children'];

function containsRestrictedContent(prompt) {
    const normalizedPrompt = prompt.toLowerCase();
    return restrictedWords.some(word => normalizedPrompt.includes(word));
}

module.exports = { containsRestrictedContent };
