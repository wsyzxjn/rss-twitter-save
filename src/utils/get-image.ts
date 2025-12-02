import he from "he";

export function getImageUrlsFromContent(content: string) {
  const regex = /<img[^>]*src="([^"]+)"/g;
  const matches = content.matchAll(regex);
  return Array.from(matches, match => he.decode(match[1])).filter(
    (url): url is string => Boolean(url)
  );
}
