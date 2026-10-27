<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import { STATUS_COLORS, STATUS_LABELS, type AdrStatus } from '#lib/adr.ts';

	let { status }: { status: AdrStatus } = $props();
</script>

<Badge color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Badge>
