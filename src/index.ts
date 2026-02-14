#!/usr/bin/env node

import * as p from "@clack/prompts";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import pc from "picocolors";

async function main() {
  console.clear();

  p.intro(pc.bgCyan(pc.black(" create-vixy ")));

  const projectName = await p.text({
    message: "What is your project name?",
    placeholder: "my-vixy-app",
    validate: (value) => {
      if (!value) return "Project name is required";
      if (!/^[a-z0-9-_]+$/i.test(value))
        return "Project name can only contain letters, numbers, dashes and underscores";
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  const projectPath = join(process.cwd(), projectName as string);

  if (existsSync(projectPath)) {
    p.cancel(pc.red(`Directory "${projectName}" already exists`));
    process.exit(1);
  }

  const spinner = p.spinner();
  spinner.start("Creating your Vixy project");

  try {
    // Create project directory
    mkdirSync(projectPath, { recursive: true });

    // Fetch latest vixy version from npm
    let vixyVersion = "latest";
    try {
      const response = await fetch("https://registry.npmjs.org/vixy/latest");
      const data = (await response.json()) as { version: string };
      vixyVersion = `^${data.version}`;
    } catch (error) {
      // Fallback to latest if fetch fails
      vixyVersion = "latest";
    }

    // Create package.json
    const packageJson = {
      name: projectName,
      scripts: {
        dev: "bun run --hot src/index.ts",
      },
      dependencies: {
        vixy: vixyVersion,
      },
      devDependencies: {
        "@types/bun": "latest",
      },
    };

    writeFileSync(
      join(projectPath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Create .gitignore
    const gitignore = `node_modules/
`;

    writeFileSync(join(projectPath, ".gitignore"), gitignore);

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        lib: ["ESNext"],
        target: "ESNext",
        module: "ESNext",
        moduleDetection: "force",
        jsx: "react-jsx",
        allowJs: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        noFallthroughCasesInSwitch: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noPropertyAccessFromIndexSignature: false,
      },
    };

    writeFileSync(
      join(projectPath, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2)
    );

    // Create README.md
    const readme = `# ${projectName}

A web application built with [Vixy](https://github.com/vixyjs/vixy).

## Getting Started

Install dependencies:

\`\`\`bash
bun install
\`\`\`

Run the development server:

\`\`\`bash
bun dev
\`\`\`

Open [http://localhost:8000](http://localhost:8000) in your browser.

## Documentation

For more information about Vixy, visit [https://vixyjs.github.io/docs](https://vixyjs.github.io/docs)
`;

    writeFileSync(join(projectPath, "README.md"), readme);

    // Create src directory and index.ts
    mkdirSync(join(projectPath, "src"), { recursive: true });

    const indexTs = `import Vixy from "vixy";

const app = new Vixy();

app.get("/", (c) => {
  return c.res.json({ message: "Hello, Vixy!" });
});

app.listen()
`;

    writeFileSync(join(projectPath, "src", "index.ts"), indexTs);

    spinner.stop(pc.green("✓ Project created successfully!"));

    p.note(
      `${pc.cyan("cd")} ${projectName}\n${pc.cyan("bun install")}\n${pc.cyan("bun dev")}`,
      "Next steps"
    );

    p.outro(
      pc.green("Happy coding! 🚀") +
        "\n" +
        pc.dim("Learn more at https://vixyjs.github.io/docs")
    );
  } catch (error) {
    spinner.stop(pc.red("✗ Failed to create project"));
    p.cancel(pc.red((error as Error).message));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(pc.red("Error:"), error);
  process.exit(1);
});
