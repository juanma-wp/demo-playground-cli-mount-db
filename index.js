const { runCLI } = require("@wp-playground/cli");
const { readFileSync } = require("fs");
const { resolve } = require("path");

try {
const blueprint = JSON.parse(
    readFileSync(resolve("./blueprint.json"), "utf8")
);
console.log("Loaded blueprint:", JSON.stringify(blueprint, null, 2));

runCLI({
    command: "server",
    blueprint,
    mount: [
    {
        hostPath: resolve("./database/"),
        vfsPath: `/wordpress/wp-content/database/`,
    },
    ],
})
.then(() => {
    // Server started successfully
})
.catch((error) => {
    console.error("Error starting WP Playground server:", error);
    throw error;
});

} catch (error) {
console.error("Error starting WP Playground server:", error);
throw error;
}
