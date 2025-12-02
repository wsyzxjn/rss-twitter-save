import { getListRssUrl, getFeed } from "@/lib/rss.js";
import { getImageUrlsFromContent } from "@/utils/get-image.js";
import { getEnv } from "@/utils/env.js";
import { LocalStorage } from "@/lib/local-storage.js";
import { WebDAV } from "@/lib/webdav.js";
import path from "node:path";
import { Readable } from "node:stream";
import { extension } from "mime-types";

const localStorage = new LocalStorage();

const webdav = new WebDAV();

interface ImageUrlsMap {
  [key: string]: [url: string, publishedAt: string][];
}

async function getImageUrlsMap(): Promise<ImageUrlsMap> {
  const listId = getEnv("LIST_ID");
  const filterTime = Math.floor(
    (Date.now() - localStorage.lastSavedAt.getTime()) / 1000
  );
  const url = getListRssUrl(listId);
  url.searchParams.set("onlyMedia", "true");
  url.searchParams.set("filter_time", filterTime.toString());

  console.log(`开始获取列表RSS -> ${url.href}`);
  const feed = await getFeed(url.href).catch(err => {
    console.error("获取列表RSS失败");
    console.error(err);
    process.exit(1);
  });

  const itemsWihoutRT = feed.items.filter(
    ({ content }) =>
      !content?.startsWith("RT") &&
      !content?.includes('<div class="rsshub-quote">')
  );

  const imagesMap: ImageUrlsMap = {};
  for (const {
    content,
    creator,
    isoDate = new Date().toISOString(),
  } of itemsWihoutRT) {
    if (!content) continue;
    const imageUrls = getImageUrlsFromContent(content);
    if (imageUrls.length === 0) continue;
    if (!creator) continue;
    const userImages = (imagesMap[creator] ??= []);
    for (const imageUrl of imageUrls) {
      userImages.push([imageUrl, isoDate]);
    }
  }

  return imagesMap;
}

async function saveImages(imagesMap: ImageUrlsMap) {
  console.log("开始保存图片");
  const userNames = Object.keys(imagesMap);
  console.log(
    `检测到 ${userNames.join(", ")} 更新，共 ${userNames.length} 个作者`
  );
  for (const [creator, imageUrls] of Object.entries(imagesMap)) {
    console.log(`开始处理 ${creator}，共 ${imageUrls.length} 张图片`);
    for (const [imageUrl, publishedAt] of imageUrls) {
      console.log(`准备流式传输: ${imageUrl}`);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.warn(`下载失败: ${imageUrl}`);
        continue;
      }
      if (!response.body) {
        console.warn(`响应无内容: ${imageUrl}`);
        continue;
      }
      const contentType = response.headers.get("content-type") ?? undefined;
      const inferredExt = contentType ? extension(contentType) : undefined;
      const extWithDot = inferredExt
        ? `.${inferredExt}`
        : path.extname(imageUrl) || ".png";
      const safePublishedAt = publishedAt.replace(/[^a-zA-Z0-9-_]/g, "-");
      const remotePath = path.posix.join(
        "twitter",
        creator,
        `${safePublishedAt}${extWithDot}`
      );
      console.log(`开始写入 WebDAV -> ${remotePath}`);
      const nodeStream = Readable.fromWeb(response.body);
      await webdav.uploadStream(nodeStream, remotePath);
      console.log(`完成流式上传 -> ${remotePath}`);
    }
    console.log(`作者 ${creator} 处理完成`);
  }
  console.log("所有图片处理完成");
}

async function checkAndSave() {
  const imagesMap = await getImageUrlsMap();
  if (Object.keys(imagesMap).length === 0) {
    console.log("未发现新内容，跳过保存");
    return;
  }
  await saveImages(imagesMap);
  localStorage.lastSavedAt = new Date();
}

async function main() {
  await checkAndSave();
  setInterval(
    () => checkAndSave().catch(err => console.error("执行失败", err)),
    60 * 60 * 6 * 1000
  );
}

main();
