import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const repository = resolve(import.meta.dirname, "..");
const pluginsRoot = resolve(process.env.CROWNLANDS_PLUGINS_ROOT || resolve(repository, "..", "MinecraftPlugins"));
const wrapper = process.platform === "win32"
  ? resolve(pluginsRoot, "CorporateCraft", "gradlew.bat")
  : resolve(pluginsRoot, "CorporateCraft", "gradlew");

if (!existsSync(wrapper)) {
  throw new Error(`CorporateCraft Gradle wrapper was not found at ${wrapper}. Set CROWNLANDS_PLUGINS_ROOT.`);
}

const result = spawnSync(wrapper, [
  "-p", resolve(repository, "shared-pack"),
  "clean", "crownlandsResourcePack",
  `-PpluginsRoot=${pluginsRoot}`,
  "--no-daemon",
  "--console=plain",
], { cwd: repository, stdio: "inherit", shell: process.platform === "win32" });

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
