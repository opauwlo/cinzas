// O ZzFX cria um AudioContext ao ser importado; nos testes (Node) basta um stub, pois só usamos buildSamples (cálculo puro).
(globalThis as unknown as { AudioContext?: unknown }).AudioContext ??= class { close() { /* nada */ } };
export {};
