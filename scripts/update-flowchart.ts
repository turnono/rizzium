import { readFileSync, writeFileSync } from 'fs';
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

interface ComponentInfo {
  name: string;
  inputs: string[];
  outputs: string[];
  protected: boolean;
  route?: string;
}

async function analyzeComponents(): Promise<ComponentInfo[]> {
  const components: ComponentInfo[] = [];
  const componentFiles = await globPromise('apps/finescan/angular/src/app/pages/**/*.component.ts', {});
  const routeFiles = await globPromise('apps/finescan/angular/src/app/**/*.routes.ts', {});

  // Read all route configurations
  const routeConfigs = new Map<string, { path: string; protected: boolean }>();
  for (const routeFile of routeFiles as string[]) {
    const content = readFileSync(routeFile, 'utf-8');
    const sourceFile = ts.createSourceFile(routeFile, content, ts.ScriptTarget.Latest, true);

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isVariableStatement(node)) {
        const routes = node.declarationList.declarations.find(
          (d) => ts.isIdentifier(d.name) && d.name.text.includes('routes')
        );
        if (
          routes &&
          ts.isVariableDeclaration(routes) &&
          routes.initializer &&
          ts.isArrayLiteralExpression(routes.initializer)
        ) {
          routes.initializer.elements.forEach((element) => {
            if (ts.isObjectLiteralExpression(element)) {
              const path = element.properties.find(
                (p): p is ts.PropertyAssignment =>
                  ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'path'
              );
              const component = element.properties.find(
                (p): p is ts.PropertyAssignment =>
                  ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'component'
              );
              const guards = element.properties.find(
                (p): p is ts.PropertyAssignment =>
                  ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === 'canActivate'
              );

              if (path && component && ts.isStringLiteral(path.initializer)) {
                const componentName = component.initializer.getText().replace(/Component$/, '');
                routeConfigs.set(componentName, {
                  path: path.initializer.text,
                  protected: guards !== undefined && guards.initializer.getText().includes('AuthGuard'),
                });
              }
            }
          });
        }
      }
    });
  }

  // Analyze each component
  for (const file of componentFiles as string[]) {
    const content = readFileSync(file, 'utf-8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    let componentName = '';
    const inputs: string[] = [];
    const outputs: string[] = [];
    let isProtected = false;

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        const decorators = ts.canHaveDecorators(node) ? ts.getDecorators(node) : undefined;
        const componentDecorator = decorators?.find(
          (d) =>
            ts.isCallExpression(d.expression) &&
            ts.isIdentifier(d.expression.expression) &&
            d.expression.expression.text === 'Component'
        );

        if (componentDecorator && node.name) {
          componentName = node.name.text.replace(/Component$/, '');

          // Check if component is protected by looking up route config
          const routeConfig = routeConfigs.get(componentName);
          isProtected = routeConfig?.protected || false;

          // Get inputs and outputs
          node.members.forEach((member) => {
            if (ts.isPropertyDeclaration(member)) {
              const memberDecorators = ts.canHaveDecorators(member) ? ts.getDecorators(member) : undefined;

              if (memberDecorators) {
                const inputDecorator = memberDecorators.find(
                  (d) =>
                    ts.isCallExpression(d.expression) &&
                    ts.isIdentifier(d.expression.expression) &&
                    d.expression.expression.text === 'Input'
                );
                const outputDecorator = memberDecorators.find(
                  (d) =>
                    ts.isCallExpression(d.expression) &&
                    ts.isIdentifier(d.expression.expression) &&
                    d.expression.expression.text === 'Output'
                );

                if (inputDecorator && ts.isIdentifier(member.name)) {
                  inputs.push(member.name.text);
                }
                if (outputDecorator && ts.isIdentifier(member.name)) {
                  outputs.push(member.name.text);
                }
              }
            }
          });
        }
      }
    });

    if (componentName) {
      const routeConfig = routeConfigs.get(componentName);
      components.push({
        name: componentName.toUpperCase().replace(/-/g, '_'),
        inputs,
        outputs,
        protected: isProtected,
        route: routeConfig?.path,
      });
    }
  }

  return components;
}

function generateFlowchartXml(components: ComponentInfo[]): string {
  let nextStateId = 1;
  const states = components.map((comp) => ({
    id: `state-${nextStateId++}`,
    name: comp.name,
    inputs: comp.inputs,
    outputs: comp.outputs,
    protected: comp.protected,
    route: comp.route,
  }));

  // Generate transitions based on routes and component relationships
  const transitions: Transition[] = [];
  let edgeId = 1;

  // Add route transitions
  states.forEach((fromState) => {
    states.forEach((toState) => {
      if (fromState.id !== toState.id) {
        // Add route transitions
        if (toState.route) {
          transitions.push({
            from: fromState.id,
            to: toState.id,
            condition: `Route: /${toState.route}`,
          });
        }

        // Add auth-related transitions
        if (toState.protected && !fromState.protected) {
          transitions.push({
            from: fromState.id,
            to: 'state-2', // Assuming LOGIN is always state-2
            condition: 'Not Authenticated',
          });
        }
      }
    });
  });

  // Generate the XML
  const xml = `<mxfile host="65bd71144e">
    <diagram name="Finescan Flow" id="finescan-flow">
        <mxGraphModel dx="1225" dy="593" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
            <root>
                <mxCell id="0"/>
                <mxCell id="1" parent="0"/>
                ${states
                  .map(
                    (state) => `
                <mxCell id="${state.id}" value="${states.findIndex((s) => s.id === state.id) + 1}: ${
                      state.name
                    }&#10;&#10;IN: ${state.inputs.join(', ') || '-'}&#10;OUT: ${state.outputs.join(
                      ', '
                    )}" style="shape=process;whiteSpace=wrap;html=1;backgroundOutline=1;fillColor=#6610f2;strokeColor=#6f42c1;fontColor=#FFFFFF;align=center;verticalAlign=middle;spacing=8;spacingTop=0;${
                      state.protected ? 'dashed=1;' : ''
                    }" vertex="1">
                    <mxGeometry x="${30 + states.findIndex((s) => s.id === state.id) * 200}" y="${
                      30 + Math.floor(states.findIndex((s) => s.id === state.id) / 4) * 150
                    }" width="160" height="100" as="geometry"/>
                </mxCell>`
                  )
                  .join('\n')}

                ${transitions
                  .map(
                    (transition) => `
                <mxCell id="edge-${edgeId++}" value="${
                      transition.condition
                    }" style="edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;exitX=1;exitY=0.5;entryX=0;entryY=0.5;curved=1;" edge="1" parent="1" source="${
                      transition.from
                    }" target="${transition.to}">
                    <mxGeometry relative="1" as="geometry"/>
                </mxCell>`
                  )
                  .join('\n')}

                <mxCell id="auth-notice" value="Note: Dashed borders indicate&#10;AuthGuard protected states" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;" vertex="1">
                    <mxGeometry x="30" y="${
                      30 + (Math.floor(states.length / 4) + 1) * 150
                    }" width="160" height="40" as="geometry"/>
                </mxCell>
            </root>
        </mxGraphModel>
    </diagram>
</mxfile>`;

  return xml;
}

async function updateFlowchart() {
  try {
    // Analyze components
    console.log('Analyzing components...');
    const components = await analyzeComponents();

    // Generate new flowchart
    console.log('Generating flowchart...');
    const newFlowchart = generateFlowchartXml(components);

    // Write to file
    const flowchartPath = resolve(__dirname, '../docs/diagrams/finescan_flow.drawio');
    writeFileSync(flowchartPath, newFlowchart, 'utf-8');
    console.log('Flowchart updated successfully!');
  } catch (error) {
    console.error('Error updating flowchart:', error);
    process.exit(1);
  }
}

// Run update
updateFlowchart();
