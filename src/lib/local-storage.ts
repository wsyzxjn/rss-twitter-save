import fs from "node:fs";
import path from "node:path";

export interface LocalStorageData {
  lastSavedAt: Date;
}

export class LocalStorage {
  private static JSON_PATH = path.join(process.cwd(), "data.json");

  constructor() {
    if (!fs.existsSync(LocalStorage.JSON_PATH)) {
      fs.writeFileSync(
        LocalStorage.JSON_PATH,
        JSON.stringify({
          lastSavedAt: new Date(0),
        } satisfies LocalStorageData)
      );
    }
  }

  private getData(): LocalStorageData {
    const data = fs.readFileSync(LocalStorage.JSON_PATH, "utf-8");
    return JSON.parse(data, (key, value) =>
      key === "lastSavedAt" ? new Date(value) : value
    );
  }

  get lastSavedAt() {
    return this.getData().lastSavedAt;
  }

  set lastSavedAt(date: Date) {
    const data = this.getData();
    data.lastSavedAt = date;
    fs.writeFileSync(LocalStorage.JSON_PATH, JSON.stringify(data));
  }
}
