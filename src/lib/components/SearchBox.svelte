<script lang="ts">
	import { page } from '$app/state';
	import { Search } from 'flowbite-svelte';

	let query = $derived(
		page.url.pathname === '/search' ? (page.url.searchParams.get('q') ?? '') : ''
	);
	let input: HTMLInputElement | undefined = $state();

	function focusOnShortcut(event: KeyboardEvent) {
		if (event.key === '/' && !isTyping(event.target)) {
			event.preventDefault();
			input?.focus();
		}
	}

	function isTyping(target: EventTarget | null) {
		return (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			(target instanceof HTMLElement && target.isContentEditable)
		);
	}
</script>

<svelte:window onkeydown={focusOnShortcut} />

<form action="/search" method="GET" role="search">
	<Search
		name="q"
		size="md"
		placeholder="Search ADRs  ( / )"
		bind:value={query}
		bind:elementRef={input}
	/>
</form>
