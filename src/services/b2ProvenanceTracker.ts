export class ProvenanceTracker {
  span_to_addresses: Record<string, Set<string>> = {};
  address_to_spans: Record<string, Set<string>> = {};
  primitive_to_addresses: Record<string, Set<string>> = {};
  address_to_primitives: Record<string, Set<string>> = {};

  recordProvenance(address: string, primitiveId: string, spanIds: string[]) {
    if (primitiveId) {
      if (!this.primitive_to_addresses[primitiveId]) this.primitive_to_addresses[primitiveId] = new Set();
      this.primitive_to_addresses[primitiveId].add(address);
      if (!this.address_to_primitives[address]) this.address_to_primitives[address] = new Set();
      this.address_to_primitives[address].add(primitiveId);
    }
    for (const sid of spanIds) {
      if (sid) {
        if (!this.span_to_addresses[sid]) this.span_to_addresses[sid] = new Set();
        this.span_to_addresses[sid].add(address);
        if (!this.address_to_spans[address]) this.address_to_spans[address] = new Set();
        this.address_to_spans[address].add(sid);
      }
    }
  }

  getAddressesForPrimitive(primitiveId: string): string[] {
    const s = this.primitive_to_addresses[primitiveId];
    if (!s) return [];
    return Array.from(s).sort();
  }

  toDict() {
    const span_to_addresses: Record<string, string[]> = {};
    for (const k of Object.keys(this.span_to_addresses).sort()) {
      span_to_addresses[k] = Array.from(this.span_to_addresses[k]).sort();
    }
    const address_to_spans: Record<string, string[]> = {};
    for (const k of Object.keys(this.address_to_spans).sort()) {
      address_to_spans[k] = Array.from(this.address_to_spans[k]).sort();
    }
    const primitive_to_addresses: Record<string, string[]> = {};
    for (const k of Object.keys(this.primitive_to_addresses).sort()) {
      primitive_to_addresses[k] = Array.from(this.primitive_to_addresses[k]).sort();
    }
    return {
      span_to_addresses,
      address_to_spans,
      primitive_to_addresses
    };
  }
}
