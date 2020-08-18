import { OnDestroy, Directive } from "@angular/core"
import { Observable, Subject } from "rxjs"
import { share, takeUntil, take } from "rxjs/operators"


export interface IDisposable {
    dispose(): void
}


export class Destruct {
    public readonly on: Observable<void> = new Subject<void>().pipe(share())
    public get done(): boolean { return (this.on as Subject<void>).closed }

    public constructor(fn?: () => void) {
        if (fn) {
            this.any(fn)
        }
    }

    public subscription<T>(o: Observable<T>): Observable<T> {
        return o.pipe(takeUntil(this.on))
    }

    public subject<T extends Subject<any>>(s: T): T {
        this.on.subscribe(s.complete.bind(s))
        return s
    }

    public disposable<T extends IDisposable>(d: T): T {
        this.on.pipe(take(1)).subscribe(d.dispose.bind(d))
        return d
    }

    public element<T extends HTMLElement>(el: T): T {
        this.on.subscribe(() => {
            if (el.parentNode) {
                el.parentNode.removeChild(el)
            }
        })
        return el
    }

    public any(f: () => void): void {
        this.on.pipe(take(1)).subscribe(f)
    }

    public run() {
        if (!this.done) {
            (this.on as Subject<void>).next();
            (this.on as Subject<void>).complete()
        }
    }
}


@Directive()
export abstract class Destructible implements OnDestroy, IDisposable {
    public readonly destruct = new Destruct()

    public ngOnDestroy() {
        if (this.destruct) {
            this.destruct.run()
            delete (this as any).destruct
        }
    }

    public dispose() {
        this.ngOnDestroy()
    }
}
