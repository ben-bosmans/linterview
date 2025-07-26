<script lang="ts">
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { onDestroy, onMount } from 'svelte';

	interface CodeEditorProps {
		value: string;
		language: string;
		theme?: string;
	}

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;

	let { value = $bindable(), language, theme = 'vs-dark' }: CodeEditorProps = $props();

	// Load the editor
	onMount(async () => {
		monaco = await loader.init();

		editor = monaco.editor.create(editorContainer, {
			value,
			language,
			theme,
			automaticLayout: true,
			wordWrap: 'on'
		});

		editor.onDidChangeModelContent((e) => {
			// Skip updating because this means the event has come from us updating value
			// from outside the component - no update to value needed then.
			if (!e.isFlush) {
				const editorValue = editor.getValue();
				if (editorValue !== value) value = editorValue;
			}
		});
	});

	// Propogate updates to value externally to the value of the editor
	$effect(() => {
		if (editor?.getValue() !== value) editor?.setValue(value);
	});

	// Destroy the editor and the model open on this editor
	onDestroy(() => {
		editor?.getModel()?.dispose();
		editor?.dispose();
	});
</script>

<div class="h-100 w-full" bind:this={editorContainer}></div>

<style lang="postcss">
	/* Empty style tag keeps HMR working */
</style>
