<script lang="ts">
	import { onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { keymap } from '@codemirror/view';
	import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
	import { languages } from '@codemirror/language-data';
	import { markdownHighlighting } from '#lib/editor-theme.ts';

	let { value = $bindable(), onsave }: { value: string; onsave?: () => void } = $props();

	let container: HTMLDivElement;
	let view: EditorView | undefined;

	onMount(() => {
		view = new EditorView({
			parent: container,
			doc: value,
			extensions: [
				keymap.of([{ key: 'Mod-s', preventDefault: true, run: () => (onsave?.(), true) }]),
				basicSetup,
				markdown({ base: markdownLanguage, codeLanguages: languages }),
				markdownHighlighting,
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					if (update.docChanged) value = update.state.doc.toString();
				})
			]
		});
		return () => view?.destroy();
	});

	$effect(() => {
		if (view && value !== view.state.doc.toString()) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
		}
	});
</script>

<div bind:this={container} class="h-full overflow-hidden"></div>
