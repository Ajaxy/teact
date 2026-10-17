import { LIBRARIES, type Library, type LibraryId } from './libraries';
import { type Scenario, SCENARIOS } from './scenarios';
import { median } from './stats';

// Before each library's run, so that the previous run's garbage does not land in it
const PAUSE_MS = 1000;
// Every few renders, so that one run does not block the page for long
const SHORT_PAUSE_MS = 100;
const RENDERS_BETWEEN_PAUSES = 5;
const BASELINE: LibraryId = 'react';

// Medians in milliseconds, by scenario and library; `undefined` when the run failed
const results = new Map<string, Map<LibraryId, number | undefined>>();

const table = document.getElementById('results') as HTMLTableElement;
const statusElement = document.getElementById('status')!;
const controls = document.getElementById('controls')!;
const container = document.getElementById('root')!;

let isRunning = false;

setUp();
void run(LIBRARIES);

function setUp() {
  document.getElementById('dev-warning')!.hidden = !import.meta.env.DEV;

  for (const element of document.querySelectorAll('[data-iterations]')) {
    const scenario = SCENARIOS.find(({ id }) => id === (element as HTMLElement).dataset.iterations)!;
    element.textContent = String(scenario.iterations);
  }

  const headRow = table.tHead!.rows[0];
  for (const library of LIBRARIES) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.append(library.name, document.createElement('br'));
    const version = document.createElement('small');
    version.textContent = library.version;
    cell.append(version);
    headRow.append(cell);
  }

  const body = table.tBodies[0];
  for (const scenario of SCENARIOS) {
    const row = body.insertRow();
    row.dataset.scenario = scenario.id;

    const nameCell = document.createElement('th');
    nameCell.scope = 'row';
    nameCell.textContent = scenario.name;
    row.append(nameCell);

    for (const library of LIBRARIES) {
      const cell = row.insertCell();
      cell.dataset.library = library.id;
      cell.textContent = '…';
    }
  }

  const runAllButton = document.createElement('button');
  runAllButton.type = 'button';
  runAllButton.textContent = 'Run again';
  runAllButton.addEventListener('click', () => void run(LIBRARIES));
  controls.append(runAllButton);

  for (const library of LIBRARIES) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `Run ${library.name} again`;
    button.addEventListener('click', () => void run([library]));
    controls.append(button);
  }
}

async function run(libraries: Library[]) {
  if (isRunning) return;

  isRunning = true;
  setButtonsDisabled(true);

  try {
    for (const scenario of SCENARIOS) {
      for (const library of libraries) {
        setStatus(`${scenario.name}: ${library.name}…`);
        showResult(scenario, library, 'running');
        await pause(PAUSE_MS);

        let result: number | undefined;
        try {
          result = await measure(library, scenario);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`${library.name}, ${scenario.name}:`, error);
        }

        getScenarioResults(scenario).set(library.id, result);
        updateRow(scenario);
      }
    }

    setStatus('Done.');
  } finally {
    isRunning = false;
    setButtonsDisabled(false);
  }
}

async function measure(library: Library, scenario: Scenario) {
  const App = scenario.createApp(library);
  const root = library.createRoot(container);
  const times: number[] = [];

  try {
    for (let i = 0; i < scenario.iterations; i++) {
      if (i % RENDERS_BETWEEN_PAUSES === 0) {
        await pause(SHORT_PAUSE_MS);
        await nextFrame();
      }

      const startedAt = performance.now();
      root.render(library.createElement(App));
      times.push(performance.now() - startedAt);

      // Every library must have rendered the whole tree by now, or the time would not be comparable
      const renderedItems = container.querySelectorAll('li').length;
      if (renderedItems !== scenario.items) {
        throw new Error(`Rendered ${renderedItems} list items instead of ${scenario.items}`);
      }

      root.clear();
    }
  } finally {
    root.unmount();
  }

  return median(times);
}

function updateRow(scenario: Scenario) {
  const scenarioResults = getScenarioResults(scenario);
  const baseline = scenarioResults.get(BASELINE);
  const finished = [...scenarioResults.values()].filter((value): value is number => value !== undefined);
  const best = finished.length ? Math.min(...finished) : undefined;

  for (const library of LIBRARIES) {
    if (!scenarioResults.has(library.id)) continue;

    const value = scenarioResults.get(library.id);
    if (value === undefined) {
      showResult(scenario, library, 'failed');
      continue;
    }

    const cell = getCell(scenario, library);
    cell.replaceChildren(`${formatTime(value)} ms`);
    cell.classList.toggle('best', value === best);
    cell.classList.remove('pending');

    if (library.id !== BASELINE && baseline !== undefined) {
      const relative = document.createElement('small');
      relative.textContent = formatRelative((value - baseline) / baseline);
      cell.append(' ', relative);
    }
  }
}

function showResult(scenario: Scenario, library: Library, state: 'running' | 'failed') {
  const cell = getCell(scenario, library);
  cell.classList.remove('best');
  cell.classList.toggle('pending', state === 'running');
  cell.textContent = state === 'running' ? 'running…' : 'failed (see the console)';
}

function getCell(scenario: Scenario, library: Library) {
  return table.querySelector<HTMLTableCellElement>(
    `tr[data-scenario="${scenario.id}"] td[data-library="${library.id}"]`,
  )!;
}

function getScenarioResults(scenario: Scenario) {
  let scenarioResults = results.get(scenario.id);
  if (!scenarioResults) {
    scenarioResults = new Map();
    results.set(scenario.id, scenarioResults);
  }

  return scenarioResults;
}

function formatTime(ms: number) {
  return ms < 100 ? ms.toFixed(1) : String(Math.round(ms));
}

function formatRelative(ratio: number) {
  const percent = Math.round(ratio * 100);
  if (percent === 0) return '±0%';

  return percent > 0 ? `+${percent}%` : `−${Math.abs(percent)}%`;
}

function setStatus(text: string) {
  statusElement.textContent = text;
}

function setButtonsDisabled(isDisabled: boolean) {
  for (const button of controls.querySelectorAll('button')) {
    button.disabled = isDisabled;
  }
}

function pause(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}
