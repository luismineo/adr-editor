import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const markdownStyle = HighlightStyle.define([
	{ tag: tags.heading, class: 'cm-md-heading' },
	{ tag: tags.strong, fontWeight: '700' },
	{ tag: tags.emphasis, fontStyle: 'italic' },
	{ tag: tags.strikethrough, textDecoration: 'line-through' },
	{ tag: [tags.link, tags.url], class: 'cm-md-link' },
	{ tag: tags.monospace, class: 'cm-md-code' },
	{ tag: tags.quote, class: 'cm-md-muted' },
	{ tag: [tags.processingInstruction, tags.contentSeparator], class: 'cm-md-muted' },
	{ tag: [tags.keyword, tags.operatorKeyword], class: 'cm-code-keyword' },
	{ tag: [tags.string, tags.regexp], class: 'cm-code-string' },
	{ tag: [tags.number, tags.bool, tags.null], class: 'cm-code-literal' },
	{ tag: tags.comment, class: 'cm-md-muted' }
]);

export const markdownHighlighting = syntaxHighlighting(markdownStyle);
