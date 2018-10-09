import { ElementRef } from "@angular/core"


export type Watcher = (el: HTMLElement, width: number, height: number) => void


export class ResizeObserver {
    protected watched: HTMLElement[] = []
    protected watcher: Array<Watcher[]> = []
    protected dispose: Array<() => void> = []

    public watch(el: HTMLElement | ElementRef, cb: Watcher) {
        let e: HTMLElement = typeof (el as any).nativeElement !== "undefined" ? (el as any).nativeElement : el as HTMLElement
        let idx = this.watched.indexOf(e)
        if (idx === -1) {
            idx = this.watched.length
            this.watched.push(e)
            this.watcher[idx] = [cb]
            this.dispose[idx] = this._watchEl(e, idx)
        } else {
            this.watcher[idx].push(cb)
        }
    }

    public unwatch(el: HTMLElement | ElementRef, cb?: Watcher) {
        let e: HTMLElement = typeof (el as any).nativeElement !== "undefined" ? (el as any).nativeElement : el as HTMLElement
        let idx = this.watched.indexOf(e)
        if (idx !== -1) {
            if (cb) {
                let cbIdx = this.watcher[idx].indexOf(cb)
                if (cbIdx > -1) {
                    this.watcher[idx].splice(cbIdx, 1)
                }

                if (this.watcher[idx].length > 0) {
                    return
                }
            }

            this.watched.splice(idx, 1)
            this.watcher.splice(idx, 1)
            this.dispose.splice(idx, 1)[0]()
        }
    }

    // https://developers.google.com/web/updates/2016/10/resizeobserver
    protected _watchEl(el: HTMLElement, i: number) {
        // TODO: beautify + optimize

        let width = el.offsetWidth
        let height = el.offsetHeight
        let stopped = false
        let rafId: any

        let watch = () => {
            let nw = el.offsetWidth
            let nh = el.offsetWidth

            if (nw !== width || nh !== height) {
                width = nw
                height = nh
                for (let cb of this.watcher[i]) {
                    cb(el, width, height)
                }
            }
            if (!stopped) {
                rafId = requestAnimationFrame(watch)
            }
        }
        rafId = requestAnimationFrame(watch)

        return () => {
            stopped = true
            if (rafId) {
                cancelAnimationFrame(rafId)
            }
        }
    }
}
