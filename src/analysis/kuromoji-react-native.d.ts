// Ambient declaration for kuromoji-react-native — the package ships
// JS only and has no typings. We only ever touch it through tokenize.ts,
// so the surface here is intentionally minimal.

declare module "kuromoji-react-native" {
  interface Builder {
    build(callback: (err: Error | null, tokenizer: unknown) => void): void;
  }
  function builder(opts: { dicPath: Record<string, string> }): Builder;
  const _default: { builder: typeof builder } & Record<string, unknown>;
  export default _default;
  export { builder };
}

declare module "kuromoji-react-native/src/loader/ReactNativeDictionaryLoader" {
  // biome-ignore lint/suspicious/noExplicitAny: prototype-only access
  const x: any;
  export = x;
}

declare module "kuromoji-react-native/src/dict/TokenInfoDictionary" {
  // biome-ignore lint/suspicious/noExplicitAny: prototype-only access
  const x: any;
  export = x;
}

declare module "kuromoji-react-native/src/util/ByteBuffer" {
  // biome-ignore lint/suspicious/noExplicitAny: constructor-only access
  const x: any;
  export = x;
}

declare module "kuromoji-react-native/dict/base.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/check.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/tid.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/tid_pos.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/tid_map.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/cc.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/unk.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/unk_pos.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/unk_map.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/unk_char.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/unk_compat.dat.gz" {
  const id: number;
  export default id;
}
declare module "kuromoji-react-native/dict/unk_invoke.dat.gz" {
  const id: number;
  export default id;
}
