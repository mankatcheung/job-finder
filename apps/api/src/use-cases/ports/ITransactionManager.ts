export interface ITransactionManager {
  run<T>(fn: () => Promise<T>): Promise<T>;
}
