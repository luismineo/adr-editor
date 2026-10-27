<script lang="ts">
	import './layout.css';
	import { DarkMode } from 'flowbite-svelte';
	import { FileLinesOutline } from 'flowbite-svelte-icons';
	import SearchBox from '#lib/components/SearchBox.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<title>ADR Editor</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
>
	<header
		class="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-800/90"
	>
		<div class="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4">
			<a href="/" class="flex items-center gap-2 font-semibold whitespace-nowrap">
				<FileLinesOutline class="h-6 w-6 text-primary-600 dark:text-primary-400" />
				ADR Editor
			</a>
			<div class="ml-auto w-full max-w-sm">
				<SearchBox />
			</div>
			<DarkMode />
		</div>
	</header>

	<main class="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col px-4 py-6">
		{@render children()}
	</main>
</div>
