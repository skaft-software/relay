/**
 * Minimal GGUF reader — just enough to size a model.
 *
 * Reads the header: metadata key/values and tensor infos (name + shape). It
 * never touches the multi-gigabyte tensor data, and it grows its read buffer
 * on demand so the huge tokenizer arrays don't force the whole file into
 * memory. Pure Node, no dependencies — this is what lets the sizing engine
 * live in the npm app instead of shelling out to python + the `gguf` package.
 *
 * Format reference: GGUF v2/v3 (little-endian).
 *   magic u32 "GGUF" · version u32 · tensor_count u64 · metadata_kv_count u64
 *   metadata: [ key(str) · value_type u32 · value ]
 *   tensors:  [ name(str) · n_dims u32 · dims(u64…) · ggml_type u32 · offset u64 ]
 */
import { closeSync, openSync, readSync, statSync } from 'node:fs';

export const GGUF_MAGIC = 0x46554747; // "GGUF" little-endian

// GGUF value-type tags. A const object (not a TS enum) so the file runs under
// node --experimental-strip-types, which rejects enums.
const VT = {
  UINT8: 0, INT8: 1, UINT16: 2, INT16: 3, UINT32: 4, INT32: 5,
  FLOAT32: 6, BOOL: 7, STRING: 8, ARRAY: 9, UINT64: 10, INT64: 11, FLOAT64: 12,
} as const;

export type MetaValue = number | bigint | boolean | string | number[] | bigint[] | string[] | boolean[];

export interface TensorInfo {
  name: string;
  dims: number[];
  /** GGML tensor type id from the GGUF tensor info table. */
  type?: number;
  /** Tensor data offset relative to the GGUF data section. */
  offset?: number;
  /** On-disk tensor payload bytes, including any alignment padding before the next tensor. */
  bytes?: number;
}

export interface GgufModel {
  version: number;
  fileSize: number;
  metadata: Map<string, MetaValue>;
  tensors: TensorInfo[];
  /** Look up a metadata value by exact key or `.suffix` match (mirrors size-model.py's `g()`). */
  get(suffix: string): MetaValue | undefined;
}

// Arrays we actually consume are small (per-layer). Everything else (tokenizer
// vocab, merges, scores) is skipped without materializing — we only advance past it.
const WANTED_ARRAY_SUFFIXES = ['attention.head_count_kv', 'attention.sliding_window_pattern'];

/** Forward-only reader over a file descriptor that grows its buffer as needed. */
class ByteReader {
  private fd: number;
  private buf: Buffer = Buffer.alloc(0);
  private pos = 0;
  private eof: number;

  constructor(fd: number, fileSize: number) {
    this.fd = fd;
    this.eof = fileSize;
  }

  private ensure(upto: number): void {
    if (upto <= this.buf.length) return;
    if (upto > this.eof) throw new Error('unexpected EOF while reading GGUF header');
    const chunk = Buffer.alloc(Math.max(upto - this.buf.length, 1 << 20));
    const n = readSync(this.fd, chunk, 0, chunk.length, this.buf.length);
    this.buf = this.buf.length === 0 ? chunk.subarray(0, n) : Buffer.concat([this.buf, chunk.subarray(0, n)]);
    if (upto > this.buf.length) throw new Error('unexpected EOF while reading GGUF header');
  }

  u32(): number { this.ensure(this.pos + 4); const v = this.buf.readUInt32LE(this.pos); this.pos += 4; return v; }
  i32(): number { this.ensure(this.pos + 4); const v = this.buf.readInt32LE(this.pos); this.pos += 4; return v; }
  u8(): number { this.ensure(this.pos + 1); const v = this.buf.readUInt8(this.pos); this.pos += 1; return v; }
  i8(): number { this.ensure(this.pos + 1); const v = this.buf.readInt8(this.pos); this.pos += 1; return v; }
  u16(): number { this.ensure(this.pos + 2); const v = this.buf.readUInt16LE(this.pos); this.pos += 2; return v; }
  i16(): number { this.ensure(this.pos + 2); const v = this.buf.readInt16LE(this.pos); this.pos += 2; return v; }
  f32(): number { this.ensure(this.pos + 4); const v = this.buf.readFloatLE(this.pos); this.pos += 4; return v; }
  f64(): number { this.ensure(this.pos + 8); const v = this.buf.readDoubleLE(this.pos); this.pos += 8; return v; }

  /** u64/i64 as Number — every value we read (counts, dims, lengths) is well under 2^53. */
  u64(): number { this.ensure(this.pos + 8); const v = this.buf.readBigUInt64LE(this.pos); this.pos += 8; return Number(v); }
  i64(): number { this.ensure(this.pos + 8); const v = this.buf.readBigInt64LE(this.pos); this.pos += 8; return Number(v); }

  str(): string {
    const len = this.u64();
    this.ensure(this.pos + len);
    const s = this.buf.toString('utf8', this.pos, this.pos + len);
    this.pos += len;
    return s;
  }

  /** Advance past a string without materializing it. */
  skipStr(): void {
    const len = this.u64();
    this.ensure(this.pos + len);
    this.pos += len;
  }

  position(): number { return this.pos; }
}

function readScalar(r: ByteReader, type: number): MetaValue {
  switch (type) {
    case VT.UINT8: return r.u8();
    case VT.INT8: return r.i8();
    case VT.UINT16: return r.u16();
    case VT.INT16: return r.i16();
    case VT.UINT32: return r.u32();
    case VT.INT32: return r.i32();
    case VT.FLOAT32: return r.f32();
    case VT.FLOAT64: return r.f64();
    case VT.UINT64: return r.u64();
    case VT.INT64: return r.i64();
    case VT.BOOL: return r.u8() !== 0;
    case VT.STRING: return r.str();
    default: throw new Error(`unsupported GGUF scalar type ${type}`);
  }
}

/** Read or skip a metadata value, advancing the cursor correctly either way. */
function readValue(r: ByteReader, type: number, collect: boolean): MetaValue | undefined {
  if (type !== VT.ARRAY) {
    const v = readScalar(r, type);
    return collect ? v : undefined;
  }
  const elemType = r.u32();
  const count = r.u64();
  if (!collect) {
    // Skip without materializing — used for tokenizer vocab and the like.
    for (let i = 0; i < count; i++) {
      if (elemType === VT.STRING) r.skipStr();
      else readScalar(r, elemType);
    }
    return undefined;
  }
  const arr: MetaValue[] = [];
  for (let i = 0; i < count; i++) arr.push(readScalar(r, elemType));
  return arr as MetaValue;
}

function alignOffset(offset: number, alignment: number): number {
  return Math.ceil(offset / alignment) * alignment;
}

export function readGguf(path: string): GgufModel {
  const fileSize = statSync(path).size;
  const fd = openSync(path, 'r');
  try {
    const r = new ByteReader(fd, fileSize);
    const magic = r.u32();
    if (magic !== GGUF_MAGIC) throw new Error(`not a GGUF file (magic ${magic.toString(16)})`);
    const version = r.u32();
    if (version < 2) throw new Error(`unsupported GGUF version ${version}`);
    const tensorCount = r.u64();
    const kvCount = r.u64();

    const metadata = new Map<string, MetaValue>();
    for (let i = 0; i < kvCount; i++) {
      const key = r.str();
      const type = r.u32();
      const wantArray = type === VT.ARRAY && WANTED_ARRAY_SUFFIXES.some((s) => key === s || key.endsWith('.' + s));
      const collect = type !== VT.ARRAY || wantArray;
      const value = readValue(r, type, collect);
      if (collect && value !== undefined) metadata.set(key, value);
    }

    const tensors: TensorInfo[] = [];
    for (let i = 0; i < tensorCount; i++) {
      const name = r.str();
      const nDims = r.u32();
      const dims: number[] = [];
      for (let d = 0; d < nDims; d++) dims.push(r.u64());
      const type = r.u32();
      const offset = r.u64();
      tensors.push({ name, dims, type, offset });
    }

    const alignmentValue = metadata.get('general.alignment');
    const alignment = typeof alignmentValue === 'number' && alignmentValue > 0 ? alignmentValue : 32;
    const dataStart = alignOffset(r.position(), alignment);
    const byOffset = tensors
      .map((t, index) => ({ t, index, offset: t.offset ?? 0 }))
      .sort((a, b) => a.offset - b.offset || a.index - b.index);
    for (let i = 0; i < byOffset.length; i++) {
      const cur = byOffset[i]!;
      const next = byOffset[i + 1];
      const end = next ? next.offset : Math.max(0, fileSize - dataStart);
      cur.t.bytes = Math.max(0, end - cur.offset);
    }

    const get = (suffix: string): MetaValue | undefined => {
      const exact = metadata.get(suffix);
      if (exact !== undefined) return exact;
      for (const [k, v] of metadata) if (k.endsWith('.' + suffix)) return v;
      return undefined;
    };

    return { version, fileSize, metadata, tensors, get };
  } finally {
    closeSync(fd);
  }
}
