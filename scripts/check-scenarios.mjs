import { scenarios } from '../lib/scenarios.ts';

if (scenarios.length < 20 || scenarios.length > 30) throw new Error(`Expected 20-30 scenarios, found ${scenarios.length}`);
if (new Set(scenarios.map(({ slug }) => slug)).size !== scenarios.length) throw new Error('Scenario slugs must be unique');

for (const scenario of scenarios) {
  if (!scenario.title.zh || !scenario.title.en || !scenario.summary.zh || !scenario.summary.en) throw new Error(`Missing bilingual copy: ${scenario.slug}`);
  if (scenario.flow.length !== 5 || scenario.flow.some((step) => !step.zh || !step.en)) throw new Error(`Expected five bilingual stages: ${scenario.slug}`);
  if (scenario.categories.length < 3) throw new Error(`Expected at least three capability categories: ${scenario.slug}`);
}

console.log(`Validated ${scenarios.length} bilingual solution scenarios.`);
