import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as ts from 'typescript';
import { glob } from 'glob';
import { promisify } from 'util';

const globPromise = promisify(glob);

interface State {
  id: string;
  name: string;
  inputs: string[];
  outputs: string[];
  protected: boolean;
}

interface Transition {
  from: string;
  to: string;
  condition?: string;
}

interface FlowchartData {
  states: State[];
  transitions: Transition[];
}

function parseFlowchart(xmlContent: string): FlowchartData {
  const states: State[] = [];
  const transitions: Transition[] = [];

  // Parse states
  const stateRegex = /id="state-(\d+)"\s+value="(\d+):\s*([^\\n]+)\\n\\nIN:\s*([^\\n]+)\\nOUT:\s*([^\\n]+)/g;
  let match;

  while ((match = stateRegex.exec(xmlContent)) !== null) {
    const [, , , name, inputs, outputs] = match;
    const stateId = match[1];
    const isDashed = xmlContent.includes(`id="state-${stateId}"`) && xmlContent.includes('dashed=1');

    states.push({
      id: `state-${stateId}`,
      name: name.trim(),
      inputs: inputs
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i !== '-'),
      outputs: outputs.split(',').map((o) => o.trim()),
      protected: isDashed,
    });
  }

  // Parse transitions
  const transitionRegex = /id="edge-([^"]+)"\s+value="([^"]+)"\s+.*source="([^"]+)"\s+target="([^"]+)"/g;

  while ((match = transitionRegex.exec(xmlContent)) !== null) {
    const [, , label, source, target] = match;
    transitions.push({
      from: source,
      to: target,
      condition: label.trim(),
    });
  }

  return { states, transitions };
}

async function validateAgainstCode(): Promise<string[]> {
  const errors: string[] = [];

  // Read flowchart
  const flowchartPath = resolve(__dirname, '../docs/diagrams/finescan_flow.drawio');
  const flowchartContent = readFileSync(flowchartPath, 'utf-8');
  const flowchart = parseFlowchart(flowchartContent);

  // Find all component files
  const componentFiles = await globPromise('apps/finescan/angular/src/app/pages/**/*.component.ts');

  // Validate each state has a corresponding component
  for (const state of flowchart.states) {
    const stateNameKebab = state.name.toLowerCase().replace(/_/g, '-');
    const matchingFiles = await globPromise('apps/finescan/angular/src/app/pages/**/*.component.ts');
    const hasComponent = matchingFiles.some(
      (file) =>
        file.toLowerCase().includes(`/${stateNameKebab}/`) ||
        file.toLowerCase().includes(`/${stateNameKebab}.component.ts`)
    );

    if (!hasComponent) {
      errors.push(`State "${state.name}" has no corresponding component file`);
    }
  }

  // Validate routes
  const routeFiles = await globPromise('apps/finescan/angular/src/app/**/*.routes.ts');
  for (const routeFile of routeFiles) {
    const content = readFileSync(routeFile, 'utf-8');

    // Check route definitions match transitions
    for (const transition of flowchart.transitions) {
      const routeLabel = transition.condition?.match(/Route: \/([^\s\\n]+)/)?.[1];
      if (routeLabel && !content.includes(`path: '${routeLabel}'`)) {
        errors.push(
          `Route "/${routeLabel}" from transition ${transition.from} -> ${transition.to} not found in routes`
        );
      }
    }

    // Validate auth guards
    for (const state of flowchart.states) {
      if (state.protected) {
        const stateNameKebab = state.name.toLowerCase().replace(/_/g, '-');
        if (
          !content.includes(`canActivate: [AuthGuard]`) &&
          (content.includes(`/${stateNameKebab}`) || content.includes(`${stateNameKebab}.component`))
        ) {
          errors.push(`Protected state "${state.name}" missing AuthGuard in routes`);
        }
      }
    }
  }

  // Validate component inputs/outputs
  for (const componentFile of componentFiles) {
    const content = readFileSync(componentFile, 'utf-8');
    const sourceFile = ts.createSourceFile(componentFile, content, ts.ScriptTarget.Latest, true);

    // Find component name
    let componentName = '';
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        const decorator = decorators?.find(
          (d) =>
            ts.isCallExpression(d.expression) &&
            ts.isIdentifier(d.expression.expression) &&
            d.expression.expression.text === 'Component'
        );
        if (decorator && node.name) {
          componentName = node.name.text;
        }
      }
    });

    // Find corresponding state
    const state = flowchart.states.find(
      (s) =>
        s.name.toLowerCase().replace(/_/g, '-') ===
        componentName
          .toLowerCase()
          .replace(/component$/, '')
          .replace(/([a-z])([A-Z])/g, '$1-$2')
    );

    if (state) {
      // Validate inputs
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          node.members.forEach((member) => {
            if (ts.isPropertyDeclaration(member)) {
              const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;
              const decorator = decorators?.find(
                (d) =>
                  ts.isCallExpression(d.expression) &&
                  ts.isIdentifier(d.expression.expression) &&
                  d.expression.expression.text === 'Input'
              );
              if (decorator && ts.isIdentifier(member.name)) {
                const inputName = member.name.text;
                if (!state.inputs.some((i) => i.toLowerCase().includes(inputName.toLowerCase()))) {
                  errors.push(
                    `Component "${componentName}" has Input "${inputName}" not represented in flowchart state "${state.name}"`
                  );
                }
              }
            }
          });
        }
      });

      // Validate outputs
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isClassDeclaration(node)) {
          node.members.forEach((member) => {
            if (ts.isPropertyDeclaration(member)) {
              const decorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;
              const decorator = decorators?.find(
                (d) =>
                  ts.isCallExpression(d.expression) &&
                  ts.isIdentifier(d.expression.expression) &&
                  d.expression.expression.text === 'Output'
              );
              if (decorator && ts.isIdentifier(member.name)) {
                const outputName = member.name.text;
                if (!state.outputs.some((o) => o.toLowerCase().includes(outputName.toLowerCase()))) {
                  errors.push(
                    `Component "${componentName}" has Output "${outputName}" not represented in flowchart state "${state.name}"`
                  );
                }
              }
            }
          });
        }
      });
    }
  }

  return errors;
}

// Run validation
validateAgainstCode().then((errors) => {
  if (errors.length > 0) {
    console.error('Flowchart validation failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  } else {
    console.log('Flowchart validation passed!');
    process.exit(0);
  }
});
