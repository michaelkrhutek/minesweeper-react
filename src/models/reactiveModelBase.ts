import { BehaviorSubject, filter, map, Observable } from "rxjs";

export class ReactiveModelBase<Data extends {}> {
  constructor(initialData: Data) {
    this.reactiveDataSource.next(initialData);
  }

  private reactiveDataSource: BehaviorSubject<Data | null> =
    new BehaviorSubject<Data | null>(null);

  reactiveData$: Observable<Data> = this.reactiveDataSource.asObservable().pipe(
    filter((data) => data !== null),
    map((data) => data as Data)
  );

  patchReactiveData(patches: Partial<Data>) {
    const currentData = this.reactiveDataSource.getValue();
    if (!currentData) return;
    this.reactiveDataSource.next({ ...currentData, ...patches });
  }

  getReactiveDataValue(): Data | null {
    return this.reactiveDataSource.getValue();
  }
}
