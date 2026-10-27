export interface AdrTemplate {
	id: string;
	name: string;
	description: string;
	body: string;
}

const nygard = `## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?
`;

const madr = `## Context and Problem Statement

Describe the context and problem statement in two or three sentences. You may articulate the problem as a question.

## Decision Drivers

- Driver 1
- Driver 2

## Considered Options

- Option 1
- Option 2
- Option 3

## Decision Outcome

Chosen option: "Option 1", because it is the only option that meets the key decision drivers.

### Consequences

- Good, because ...
- Bad, because ...

### Confirmation

How will the implementation of this decision be confirmed? (e.g. code review, an ArchUnit test)

## Pros and Cons of the Options

### Option 1

- Good, because ...
- Neutral, because ...
- Bad, because ...

### Option 2

- Good, because ...
- Bad, because ...

## More Information

Links, related decisions and any additional evidence.
`;

const yStatement = `## Decision

In the context of **<use case or component>**,
facing **<non-functional concern>**,
we decided for **<chosen option>**
and neglected **<other options>**,
to achieve **<desired qualities>**,
accepting **<downsides>**,
because **<additional rationale>**.

## Notes

Anything else worth recording.
`;

export const TEMPLATES: AdrTemplate[] = [
	{
		id: 'madr',
		name: 'MADR',
		description: 'Markdown Any Decision Records: options, drivers and trade-offs.',
		body: madr
	},
	{
		id: 'nygard',
		name: 'Nygard',
		description: 'The classic format: context, decision, consequences.',
		body: nygard
	},
	{
		id: 'y-statement',
		name: 'Y-Statement',
		description: 'A single structured sentence for small decisions.',
		body: yStatement
	},
	{ id: 'blank', name: 'Blank', description: 'Start from an empty document.', body: '' }
];

export const DEFAULT_TEMPLATE_ID = 'madr';

export function findTemplate(id: string): AdrTemplate {
	return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}
