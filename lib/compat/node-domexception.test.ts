import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The deprecated node-domexception package is replaced by the local stand-in in
// vendor/node-domexception (see the comment there). What each test pins:
// 1. package.json and package-lock.json wire it: root "file:" dependency, "overrides" entry
//    pointing at it, one link in the lockfile and no nested registry copy. This is the part
//    a clean `npm ci` reproduces.
// 2. In the installed tree, the project root and the two packages that require it
//    (formdata-node and fetch-blob) resolve to the stand-in, not to a registry copy.
// 3. The stand-in keeps the original contract for both require() and the ESM default import
//    that fetch-blob and formdata-node use: it exports the built-in DOMException class.
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const standIn = fs.realpathSync(path.join(projectRoot, "vendor", "node-domexception", "index.js"));

function readJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, file), "utf8"));
}

describe("node-domexception stand-in", () => {
  it("is wired in package.json and locked as a single link to vendor/", () => {
    const manifest = readJson("package.json");
    expect(manifest.dependencies["node-domexception"]).toBe("file:./vendor/node-domexception");
    expect(manifest.overrides["node-domexception"]).toBe("$node-domexception");

    const lockPackages = readJson("package-lock.json").packages as Record<string, { resolved?: string; link?: boolean }>;
    const entries = Object.keys(lockPackages).filter((key) => key.endsWith("node_modules/node-domexception"));
    expect(entries).toEqual(["node_modules/node-domexception"]);
    expect(lockPackages["node_modules/node-domexception"]).toMatchObject({ resolved: "vendor/node-domexception", link: true });
  });

  it.each(["formdata-node", "fetch-blob"])("resolves to the stand-in from %s, which requires it", (dependent) => {
    const fromDependent = createRequire(path.join(projectRoot, "node_modules", dependent, "package.json"));
    expect(fs.realpathSync(fromDependent.resolve("node-domexception"))).toBe(standIn);
  });

  it("resolves to the local stand-in from the project root, not to the deprecated registry package", () => {
    const fromRoot = createRequire(path.join(projectRoot, "package.json"));
    expect(fs.realpathSync(fromRoot.resolve("node-domexception"))).toBe(standIn);

    const manifest = fromRoot("node-domexception/package.json") as { private?: boolean; description?: string };
    expect(manifest.private).toBe(true);
    expect(manifest.description).toMatch(/^Local stand-in/);
  });

  it("exports the built-in DOMException class through require() and the ESM default import", async () => {
    const required = createRequire(import.meta.url)("node-domexception") as typeof DOMException;
    expect(required).toBe(globalThis.DOMException);

    const imported = (await import("node-domexception")) as { default: typeof DOMException };
    expect(imported.default).toBe(globalThis.DOMException);

    const error = new required("aborted", "AbortError");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AbortError");
    expect(error.message).toBe("aborted");
  });
});
