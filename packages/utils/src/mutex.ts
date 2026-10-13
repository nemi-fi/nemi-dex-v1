import mutexify from "mutexify";

export class Mutex<T> {
  private _value: T;
  private readonly _lock = mutexify();

  constructor(value: T) {
    this._value = value;
  }

  async update<R>(
    cb: (setValue: (newValue: T) => void, value: T) => R | Promise<R>,
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      this._lock(async (release) => {
        try {
          let valueToSet = this._value;
          const result = await cb((newValue) => {
            valueToSet = newValue;
          }, this._value);
          this._value = valueToSet;
          resolve(result);
        } catch (e) {
          reject(e);
        } finally {
          release();
        }
      });
    });
  }

  async read(): Promise<T> {
    return new Promise((resolve) => {
      this._lock((release) => {
        resolve(this._value);
        release();
      });
    });
  }
}
