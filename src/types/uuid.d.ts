declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  // fallback any for other exports
  const _default: any;
  export default _default;
}
