#!/usr/bin/env node
import { LinearClient } from "@linear/sdk";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import prompts from "prompts";

async function getApiKey(): Promise<string | null> {
  // 1. Check Environment Variable
  if (process.env.LINEAR_API_KEY) {
    return process.env.LINEAR_API_KEY;
  }

  // 2. Check Local File (Legacy/Simple)
  const localKeyPath = join(process.cwd(), "apikey.txt");
  if (existsSync(localKeyPath)) {
    return readFileSync(localKeyPath, "utf-8").trim();
  }

  // 3. Check User Config in Home Directory
  const configPath = join(homedir(), ".linear-qa-randomizer.json");
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, "utf-8"));
      if (config.apiKey) {
        return config.apiKey;
      }
    } catch (e) {
      // Ignore invalid config, will prompt
    }
  }

  // 4. Prompt User
  console.log("Linear API Key not found.");
  const response = await prompts({
    type: "password",
    name: "apiKey",
    message:
      "Please enter your Linear API Key.\nYou can get your API key in linear by going to Settings > Security and Access > Create new API key. It only needs read permissions.\nIt will be saved with locked permissions (read-only for you only) to ~/.linear-qa-randomizer.json.\n",
    validate: (value) => (value.length < 10 ? "API Key seems too short" : true),
  });

  if (response.apiKey) {
    const config = { apiKey: response.apiKey };
    try {
      writeFileSync(configPath, JSON.stringify(config, null, 2), {
        mode: 0o600,
      }); // Secure permissions
      console.log(`API Key saved to ${configPath}`);
      return response.apiKey;
    } catch (e) {
      console.error("Failed to save config file:", e);
      return response.apiKey; // Return it anyway for this session
    }
  }

  return null;
}

async function main() {
  try {
    const apiKey = await getApiKey();

    if (!apiKey) {
      console.error("Error: API Key is required to run this script.");
      process.exit(1);
    }

    const linearClient = new LinearClient({ apiKey });

    // 1. Find the "Pending QA Issues" view
    let allCustomViews: any[] = [];
    let hasNextPage = true;
    let after: string | undefined = undefined;

    // Use a simpler query or handle pagination carefully.
    // Fetching ALL views might be slow if there are thousands, but usually okay for CLI.
    while (hasNextPage) {
      const customViewsResponse = await linearClient.customViews({
        after,
        first: 50, // Fetch 50 at a time
      });
      allCustomViews = allCustomViews.concat(customViewsResponse.nodes);
      hasNextPage = customViewsResponse.pageInfo.hasNextPage;
      after = customViewsResponse.pageInfo.endCursor ?? undefined;
    }

    const targetName = "Pending QA Issues";
    const pendingQaView = allCustomViews.find(
      (view) => view.name.toLowerCase() === targetName.toLowerCase(),
    );

    if (!pendingQaView) {
      console.error(`Error: Custom view "${targetName}" not found.`);
      if (allCustomViews.length > 0) {
        console.log("Available custom views (first 10):");
        allCustomViews.slice(0, 10).forEach((v) => console.log(` - ${v.name}`));
        console.log(`... and ${allCustomViews.length - 10} more.`);
      } else {
        console.log("No custom views found in this workspace.");
      }
      process.exit(1);
    }

    // 2. Fetch issues from that view
    const viewIssues = await pendingQaView.issues();

    if (viewIssues.nodes.length === 0) {
      console.log("No issues found in 'Pending QA Issues' view.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * viewIssues.nodes.length);
    const randomIssue = viewIssues.nodes[randomIndex];

    console.log(`Random Pending QA Issue: ${randomIssue.url}`);
  } catch (error) {
    // Handle specific Linear errors if needed
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

main();
