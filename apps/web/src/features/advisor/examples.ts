export interface ExamplePrompt {
  id: string;
  name: string;
  /** One line under the name on the example button. */
  label: string;
  /** What gets typed into the box. */
  text: string;
}

/** The three personas from the demo plan (docs/DEMO.md). Declan is the one we demo. */
export const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    id: 'declan',
    name: 'Declan',
    label: '40 ha of beef · wet land by a river',
    text: 'I have a 40-hectare suckler beef farm in West Cork. About 3 hectares beside the river are too wet for the cattle. What grants could I get for that land?',
  },
  {
    id: 'aoife',
    name: 'Aoife',
    label: 'Young dairy farmer · solar panels',
    text: "I'm 29 and I took over the home farm last year: 60 hectares of dairy in Tipperary. I'd like to put solar panels on the milking parlour roof.",
  },
  {
    id: 'mary',
    name: 'Mary',
    label: 'Sheep farmer · planning a shed',
    text: 'I farm 35 hectares of sheep in Kerry with my husband, and I am planning to build a new slatted shed next year.',
  },
];
