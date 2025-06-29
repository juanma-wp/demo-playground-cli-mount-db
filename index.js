import { runCLI } from "@wp-playground/cli";
import { readFileSync } from "fs";
import { resolve } from "path";

console.log("😅 Getting WP Playground handler for the first time...");
try {
const blueprint = JSON.parse(
    readFileSync(resolve("./blueprint.json"), "utf8")
);
console.log("Loaded blueprint:", JSON.stringify(blueprint, null, 2));

await runCLI({
    command: "server",
    blueprint,
    mount: [
    {
        hostPath: resolve("./database/"),
        vfsPath: `/wordpress/wp-content/database/`,
    },
    ],
});

} catch (error) {
console.error("Error starting WP Playground server:", error);
throw error;
}
