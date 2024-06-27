import { spawnSync } from "bun";

const { resourceUsage } = spawnSync(["bun", "src/index.ts"]);

console.log(resourceUsage);
