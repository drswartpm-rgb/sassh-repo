import { Dropbox } from "dropbox";

let cachedClient: Dropbox | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Dropbox token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return data.access_token;
}

export async function getDropboxClient(): Promise<Dropbox> {
  if (cachedClient && Date.now() < tokenExpiry) {
    return cachedClient;
  }

  const accessToken = await getAccessToken();
  cachedClient = new Dropbox({ accessToken });
  return cachedClient;
}

const ROOT_PATH = () => process.env.DROPBOX_ROOT_PATH || "/Apps/SASSH";

export async function listCategoryFolders(): Promise<
  { name: string; path: string }[]
> {
  const dbx = await getDropboxClient();
  const res = await dbx.filesListFolder({ path: ROOT_PATH() });

  return res.result.entries
    .filter((e) => e[".tag"] === "folder")
    .map((e) => ({ name: e.name, path: e.path_lower! }));
}

export async function downloadFile(path: string): Promise<Buffer> {
  const dbx = await getDropboxClient();
  const res = await dbx.filesDownload({ path });
  // The Dropbox SDK adds fileBinary to the result for Node.js
  const blob = (res.result as any).fileBinary as Buffer;
  return Buffer.from(blob);
}

export interface ArticleMetadata {
  filename: string;
  title: string;
  description: string;
  imageFilename?: string;
}

export async function getMetadata(
  folderPath: string
): Promise<ArticleMetadata[]> {
  const raw = await downloadFile(`${folderPath}/metadata.json`);
  return JSON.parse(raw.toString("utf-8"));
}
