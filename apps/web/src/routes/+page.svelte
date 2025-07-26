<script>
	import CodeEditor from '$lib/components/CodeEditor.svelte';
	let value = $state('console.log("Hello World!");');

	$effect(() => {
		console.log(value);
		console.log('something else');
		console.log('again');
	});
</script>

<CodeEditor bind:value language="typescript" />
