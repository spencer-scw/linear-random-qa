# Linear QA Randomizer

A simple CLI tool to get a random issue from your Linear "Pending QA Issues" custom view.

## Setup

1. **Clone the repository** (or navigate to the project folder).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the project**:
   ```bash
   npm run build
   ```

## Configuration

The script requires a Linear API key. You can provide it in two ways:

1. **Environment Variable**:
   ```bash
   export LINEAR_API_KEY=your_api_key_here
   ```
2. **~/.linear-qa-randomizer.json**
   The script will prompt you to paste your API key if it's run without an API key and save it here.
3. **File**:
   Create an `apikey.txt` file in the project root containing only your API key.

You can obtain a key on Linear by going to Settings > Security and Access > Create new API key.

It only needs read access to run this application.

## Usage

Run the script using:
```bash
npm start
```

### Global Installation
You can install the tool globally to use it from anywhere:
```bash
npm install -g .
linear-qa-random
```

## How it works
- The script connects to the Linear API.
- It searches for a custom view named **"Pending QA Issues"** (case-insensitive).
- It pulls all issues from that view and prints a link to one chosen at random.
- If the view is not found, it lists available views to help you debug.
