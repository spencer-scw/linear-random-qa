#!/usr/bin/env node
import { LinearClient } from "@linear/sdk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
async function main() {
    const apiKeyPath = join(process.cwd(), "apikey.txt");
    let apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey && existsSync(apiKeyPath)) {
        apiKey = readFileSync(apiKeyPath, "utf-8").trim();
    }
    if (!apiKey) {
        console.error("Error: API key not found. Please provide it via LINEAR_API_KEY environment variable or apikey.txt in the current directory.");
        process.exit(1);
    }
    const linearClient = new LinearClient({ apiKey });
    try {
        let allCustomViews = [];
        let hasNextPage = true;
        let after = undefined;
        while (hasNextPage) {
            const customViewsResponse = await linearClient.customViews({
                after,
                first: 100,
            });
            allCustomViews = allCustomViews.concat(customViewsResponse.nodes);
            hasNextPage = customViewsResponse.pageInfo.hasNextPage;
            after = customViewsResponse.pageInfo.endCursor ?? undefined;
        }
        const targetName = "Pending QA Issues";
        const pendingQaView = allCustomViews.find((view) => view.name.toLowerCase() === targetName.toLowerCase());
        if (!pendingQaView) {
            console.error(`Error: Custom view "${targetName}" not found.`);
            if (allCustomViews.length > 0) {
                console.log("Available custom views (first 10):");
                allCustomViews.slice(0, 10).forEach((v) => console.log(` - ${v.name}`));
                console.log(`... and ${allCustomViews.length - 10} more.`);
            }
            else {
                console.log("No custom views found in this workspace.");
            }
            process.exit(1);
        }
        const viewIssues = await pendingQaView.issues();
        if (viewIssues.nodes.length === 0) {
            console.log("No issues found in 'Pending QA Issues' view.");
            return;
        }
        const randomIndex = Math.floor(Math.random() * viewIssues.nodes.length);
        const randomIssue = viewIssues.nodes[randomIndex];
        console.log(`Random Pending QA Issue: ${randomIssue.url}`);
    }
    catch (error) {
        console.error("An error occurred:", error);
        process.exit(1);
    }
}
main();
