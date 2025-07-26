<script>
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	let value = $state('console.log("Hello World!");');

	$effect(() => {
		// console.log(value);
	});
</script>

<div class="h-screen w-screen">
	<CodeEditor bind:value language="typescript" />
</div>

<style lang="postcss">
	/* Empty style tag keeps HMR working */
</style>
