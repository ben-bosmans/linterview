<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/Footer.svelte';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<div class="grid min-h-screen w-full grid-rows-[auto_1fr_auto]">
	<Header />
	<div class="min-w-0">
		{@render children()}
	</div>
	<Footer />
</div>
