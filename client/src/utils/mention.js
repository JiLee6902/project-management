export function renderMentions(text) {
  if (!text) return text;
  return text.replace(
    /@(\w+)/g,
    '<span class="text-blue-500 font-medium">@$1</span>'
  );
}

export function extractMentions(text) {
  if (!text) return [];
  const regex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const username = match[1].toLowerCase();
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }

  return mentions;
}
