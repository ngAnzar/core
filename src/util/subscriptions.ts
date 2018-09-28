import { Observable, Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"


export class Subscriptions {
    // private items: Observable<any>
    public readonly end: Subject<void> = new Subject()

    public get isClosed(): boolean {
        return this.end.closed
    }

    public add<T extends Observable<any>>(s: T): T {
        return s.pipe(takeUntil(this.end)) as T
    }

    public unsubscribe() {
        this.end.next()
        this.end.complete()
    }

}
