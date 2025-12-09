import { TerminalHandle } from "@/components/terminal";

interface CommandInstance {
  name: string;
  args?: string[];
}

interface PathResolution {
  path: string | null;
  error: string | null;
}

let terminalHandle: TerminalHandle | null = null;
let currentLocation: string = "~";
let onLocationChange: ((location: string) => void) | null = null;
let onFileView: ((filePath: string | null) => void) | null = null;

export function setTerminalHandle(handle: TerminalHandle) {
  terminalHandle = handle;
}

export function setLocationChangeHandler(handler: (location: string) => void) {
  onLocationChange = handler;
}

export function setFileViewHandler(handler: (filePath: string | null) => void) {
  onFileView = handler;
}

export function getCurrentLocation(): string {
  return currentLocation;
}

const resolvePath = (current: string, target: string): PathResolution => {
  if (!target) return { path: current, error: null };
  if (target === "~") return { path: "~", error: null };
  if (target.startsWith("~")) return { path: target, error: null }; // ~ or ~/path - treat as absolute
  if (target.startsWith("/")) return { path: null, error: "bash: cd: /: Permission denied" }; // Root path is illegal

  const parts = current === "~" ? [] : current.replace(/^~\//, "").split("/").filter(p => p);
  const targetParts = target.split("/").filter(p => p);

  for (const part of targetParts) {
    if (part === "..") {
      parts.pop();
    } else if (part === ".") {
      continue;
    } else {
      parts.push(part);
    }
  }

  if (parts.length === 0) return { path: "~", error: null };
  return { path: "~/" + parts.join("/"), error: null };
};

export function handleCommand(command: string): string | void {
  return commandResolver(command);
}

export function commandResolver(command: string): string | void {
  const cmd = extractCommand(command);

  switch (cmd.name.toLowerCase()) {
    case "cd":
      const target = cmd.args?.[0] || "~";
      const result = resolvePath(currentLocation, target);

      if (result.error) {
        return result.error;
      }

      if (result.path) {
        currentLocation = result.path;
        if (onLocationChange) {
          onLocationChange(currentLocation);
        }
        // Clear file view on navigation
        if (onFileView) {
          onFileView(null);
        }
      }
      return;

    case "cat":
      const fileTarget = cmd.args?.[0];
      if (!fileTarget) return "Usage: cat <filename>";

      const fileResult = resolvePath(currentLocation, fileTarget);
      if (fileResult.error) return fileResult.error;

      if (fileResult.path && onFileView) {
        onFileView(fileResult.path);
      }
      return;

    case "list":
      if (cmd.args?.[0] === "show") {
        const items = [
          "Item 1: Welcome to the list",
          "Item 2: This is a test list",
          "Item 3: Displayed on the right side",
          "Item 4: Can be toggled with commands",
          "Item 5: Example list item"
        ];
        terminalHandle?.showList(items);
        return "List displayed on the right.";
      } else if (cmd.args?.[0] === "hide") {
        terminalHandle?.hideList();
        return "List hidden.";
      }
      return "Usage: list show|hide";

    case "help":
      return "Available commands:\n  list show - Display a list on the right\n  list hide - Hide the list\n  help - Show this message";

    case "test":
      terminalHandle?.sendCommand("list show");
      return;
    default:
      return `Unknown command: ${cmd.name}`;
  }
}

function extractCommand(input: string): CommandInstance {
  const tokens: string[] = [];
  let currentToken = '';
  let inDoubleQuotes = false;
  let inSingleQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inDoubleQuotes) {
      if (char === '"') {
        inDoubleQuotes = false;
      } else {
        currentToken += char;
      }
    } else if (inSingleQuotes) {
      if (char === "'") {
        inSingleQuotes = false;
      } else {
        currentToken += char;
      }
    } else {
      if (char === '"') {
        inDoubleQuotes = true;
      } else if (char === "'") {
        inSingleQuotes = true;
      } else if (char === ' ') {
        if (currentToken.length > 0) {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }
  }
  if (currentToken.length > 0) {
    tokens.push(currentToken);
  }

  const name = tokens[0] || "";
  const args = tokens.slice(1);
  return { name, args };
}