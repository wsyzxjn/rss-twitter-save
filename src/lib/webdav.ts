import path from "node:path";
import { Readable } from "node:stream";
import { createClient, type WebDAVClient } from "webdav";
import { getEnv } from "@/utils/env.js";

export class WebDAV {
  private client: WebDAVClient;

  constructor() {
    this.client = createClient(getEnv("WEBDAV_URL"), {
      username: getEnv("WEBDAV_USERNAME"),
      password: getEnv("WEBDAV_PASSWORD"),
    });
  }

  /**
   * 上传一个可读流到指定远端路径。
   *
   * @param stream Node.js Readable 流（可由 fetch 响应转换而来）。
   * @param remotePath 目标文件路径。
   */
  async uploadStream(stream: Readable, remotePath: string) {
    const normalizedRemotePath = this.normalizeRemotePath(remotePath);
    const remoteDir = path.posix.dirname(normalizedRemotePath);
    await this.ensureRemoteDirectory(remoteDir);
    await this.client.putFileContents(normalizedRemotePath, stream, {
      overwrite: true,
    });
  }

  /**
   * 将远端路径统一成 POSIX 形式，避免出现反斜杠。
   *
   * @param target 传入的原始路径。
   * @returns 去除反斜杠后的 POSIX 路径，空值返回根目录。
   */
  private normalizeRemotePath(target: string) {
    if (!target) return "/";
    const normalized = target.replace(/\\/g, "/");
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  /**
   * 确保远端目录存在，忽略已存在导致的 405/409 错误。
   *
   * @param remoteDir 远端目录路径。
   */
  private async ensureRemoteDirectory(remoteDir: string) {
    if (!remoteDir || remoteDir === ".") return;
    try {
      await this.client.createDirectory(remoteDir, { recursive: true });
    } catch (error) {
      const err = error as Error & { status?: number };
      if (err.status !== 405 && err.status !== 409) {
        throw error;
      }
    }
  }
}
