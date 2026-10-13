export class DefaultMap<K, V> extends Map<K, V> {
  constructor(private defaultValue: (key: K) => V) {
    super();
  }

  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.defaultValue(key));
    }
    return super.get(key)!;
  }
}
