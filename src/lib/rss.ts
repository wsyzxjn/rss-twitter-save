import Parser from "rss-parser";

const parser = new Parser();

export async function getFeed(url: string) {
  const response = await fetch(url);
  if (response.status === 304) return null;
  return await parser.parseString(await response.text());
}

export function getListRssUrl(listId: string) {
  if (!process.env.RSS_BASE_URL) {
    throw new Error("RSS_BASE_URL is not set");
  }
  return new URL(`/twitter/list/${listId}`, process.env.RSS_BASE_URL);
}
