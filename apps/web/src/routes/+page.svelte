<script>
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	let value = $state('console.log("Hello World!");');
</script>

<CodeEditor bind:value language="typescript" />

<style lang="postcss">
	/* Empty style tag keeps HMR working */
</style>
