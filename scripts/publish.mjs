// Publish helper for CI. The ipm CLI only reads credentials from the system
// keyring and falls into an interactive `ipm configure` prompt when it is
// empty, so the workflow drives the core library directly; it honours
// INKDROP_ACCESS_KEY_ID / INKDROP_SECRET_ACCESS_KEY.
//
//   node scripts/publish.mjs check     # print the registry's latest version, or "none"
//   node scripts/publish.mjs dry-run   # full publish flow without uploading
//   node scripts/publish.mjs publish
import { readFile } from "node:fs/promises";
import { IPM } from "@inkdropapp/ipm";

const mode = process.argv[2] ?? "publish";
const pkg = JSON.parse(await readFile("package.json", "utf8"));
const ipm = new IPM({ appVersion: process.env.INKDROP_VERSION || "6.0.0" });

if (mode === "check") {
  let latest = "none";
  try {
    const info = await ipm.registry.getPackageInfo(pkg.name, {
      ignoreCompatibility: true,
    });
    latest = info?.releases?.latest ?? "none";
  } catch (error) {
    if (error?.response?.status !== 404) throw error;
  }
  process.stdout.write(`${latest}\n`);
} else if (mode === "dry-run" || mode === "publish") {
  if (
    !process.env.INKDROP_ACCESS_KEY_ID ||
    !process.env.INKDROP_SECRET_ACCESS_KEY
  ) {
    console.error(
      "INKDROP_ACCESS_KEY_ID and INKDROP_SECRET_ACCESS_KEY must be set",
    );
    process.exit(1);
  }
  await ipm.publish({ dryrun: mode === "dry-run" });
} else {
  console.error(`unknown mode "${mode}": use check, dry-run or publish`);
  process.exit(1);
}
