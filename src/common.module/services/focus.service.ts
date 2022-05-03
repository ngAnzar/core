import { Injectable, Inject, Optional, SkipSelf } from "@angular/core"
import { FocusMonitor, FocusOrigin } from "@angular/cdk/a11y"
import { BehaviorSubject, Subject, tap } from "rxjs"

import { Destructible } from "../../util"


@Injectable()
export class FocusService {
    public constructor(@Inject(FocusMonitor) public readonly monitor: FocusMonitor) {

    }

    public newGroup(parent?: FocusGroup): FocusGroup {
        return new FocusGroup(this, parent)
    }
}


export interface FocusChangeEvent {
    el: HTMLElement
    prev: FocusOrigin
    curr: FocusOrigin
}


@Injectable()
export class FocusGroup extends Destructible {
    public readonly changes = new Subject<FocusChangeEvent>()

    private readonly watched: Map<HTMLElement, FocusOrigin> = new Map()
    private lastFocus: { el: HTMLElement, origin: FocusOrigin }

    public get currentOrigin(): FocusOrigin | null { return this.lastFocus?.origin || null }
    public get currentElement(): HTMLElement | null { return this.lastFocus?.el || null }

    public constructor(
        @Inject(FocusService) private readonly svc: FocusService,
        @Inject(FocusGroup) @Optional() @SkipSelf() private readonly parent?: FocusGroup) {
        super()
    }

    public watch(target: HTMLElement) {
        if (this.parent) {
            this.parent.watch(target)
        }

        if (!this.watched.has(target)) {
            this.watched.set(target, null)
            this.destruct.subscription(this.svc.monitor.monitor(target, true)).subscribe(origin => {
                let changed = false

                for (const [key, value] of this.watched) {
                    if (key === target) {
                        if (value !== origin) {
                            changed = true
                            this.watched.set(target, origin)
                        }
                    } else if (value !== null) {
                        changed = true
                        this.watched.set(key, null)
                    }
                }

                if (changed) {
                    const lastFocus = this.lastFocus
                    if (origin === null) {
                        if (this.isWatched(document.activeElement as HTMLElement)) {
                            return
                        }
                        this.lastFocus = null
                    } else {
                        this.lastFocus = { el: target, origin }
                    }
                    this.changes.next({
                        el: target,
                        curr: origin,
                        prev: lastFocus ? lastFocus.origin : null
                    })
                }
            })
        }
    }

    public unwatch(target: HTMLElement) {
        if (this.watched.has(target)) {
            this.watched.delete(target)
            this.svc.monitor.stopMonitoring(target)
        }
    }

    public isWatched(target: HTMLElement): boolean {
        if (this.watched.has(target)) {
            return true
        } else {
            for (const key of this.watched.keys()) {
                if (key.contains(target)) {
                    return true
                }
            }
        }
        return false
    }

    public focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions) {
        return this.svc.monitor.focusVia(element, origin, options)
    }

    public override ngOnDestroy(): void {
        for (const key of this.watched.keys()) {
            this.svc.monitor.stopMonitoring(key)
        }
        (this as any).watched = new Map()
        delete this.lastFocus
        super.ngOnDestroy()
    }
}
