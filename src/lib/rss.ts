import Parser from "rss-parser";

const parser = new Parser();

export async function getFeed(url: string) {
  return await parser.parseURL(url);
}

export function getListRssUrl(listId: string) {
  if (!process.env.RSS_BASE_URL) {
    throw new Error("RSS_BASE_URL is not set");
  }
  return new URL(`/twitter/list/${listId}`, process.env.RSS_BASE_URL);
}
