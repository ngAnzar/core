import { EmbeddedViewRef, EventEmitter, Inject, Injectable, Injector, OnDestroy, TemplateRef } from "@angular/core"
import { NavigationEnd, Router } from "@angular/router"

import { BehaviorSubject, combineLatest, merge, Observable, of, Subject, timer } from "rxjs"
import { debounceTime, distinctUntilChanged, map, share, shareReplay, startWith, switchMap } from "rxjs/operators"

import { MediaQueryService, Shortcuts, ShortcutService } from "../common.module"
import { Destruct } from "../util"

export interface VPItem {
    area: string
    order: number
    tplRef: TemplateRef<any>
    viewRef: EmbeddedViewRef<any>
}

export const enum VPPanelStyle {
    SLIDE = 1,
    OVERLAY = 2
}

export interface VPCriticalMessage {
    id: any
    message: string
    expire: Date
}

export class VPPanel {
    public set width(val: number) {
        if (this._width !== val) {
            this._width = val
            this._changes.next()
        }
    }
    public get width(): number {
        return this._width
    }
    private _width: number = 300

    public set disabled(val: boolean) {
        if (this._disabled !== val) {
            this._disabled = val
            this._changes.next()
        }
    }
    public get disabled(): boolean {
        return this._disabled
    }
    private _disabled: boolean = false

    public set style(val: VPPanelStyle) {
        if (this._style !== val) {
            this._style = val
            this._updateAnimate()
            this._changes.next()
        }
    }
    public get style(): VPPanelStyle {
        return this._style
    }
    private _style: VPPanelStyle = VPPanelStyle.OVERLAY

    public set opened(val: boolean) {
        if (this._opened !== val) {
            this._opened = val
            this._updateAnimate()
            this._changes.next()
        }
    }
    public get opened(): boolean {
        return this._opened
    }
    private _opened: boolean = false

    public set animate(val: boolean) {
        if (this._animate !== val) {
            this._animate = val
        }
    }
    public get animate(): boolean {
        return this._animate
    }
    private _animate: boolean

    private readonly _changes = new Subject<void>()
    public readonly changes = this._changes.pipe(debounceTime(50), share())

    private _updateAnimate() {
        if (!this._opened) {
            if (this._animate == null) {
                this._animate = false
            }
        } else {
            this._animate = true
        }
    }
}

@Injectable()
export class ViewportService implements OnDestroy {
    public readonly destruct = new Destruct()

    public readonly menu = new VPPanel()
    public readonly right = new VPPanel()

    private _backShortcut: Shortcuts

    public set navbarCenterOverlap(val: boolean) {
        if (this._navbarCenterOverlap !== val) {
            this._navbarCenterOverlap = val

            if (val) {
                if (this.menu.style === VPPanelStyle.OVERLAY) {
                    this.menu.opened = false
                }
            }

            ;(this.navbarChanges as EventEmitter<boolean>).emit(val)
        }
    }
    public get navbarCenterOverlap(): boolean {
        return this._navbarCenterOverlap
    }
    private _navbarCenterOverlap: boolean = false

    public readonly navbarChanges: Observable<boolean> = new EventEmitter<boolean>()

    private items = new BehaviorSubject<VPItem[]>([])

    public query(area: string): Observable<Array<VPItem>> {
        return this.items.pipe(
            map(items => items.filter(item => item.area === area)),
            distinctUntilChanged((prev, curr) => {
                if (prev.length !== curr.length) {
                    return false
                }

                for (let i = 0; i < prev.length; i++) {
                    if (prev[i].tplRef !== curr[i].tplRef) {
                        return false
                    }
                }
                return true
            }),
            shareReplay(1)
        )
    }

    public set criticalMessage(val: VPCriticalMessage) {
        if (!this._criticalMessage || !val || this._criticalMessage.id !== val.id) {
            this._criticalMessage = val
            this._cmMessage.next(val)
        }
    }
    public get criticalMessage(): VPCriticalMessage {
        return this._criticalMessage
    }
    private _criticalMessage: VPCriticalMessage

    private readonly _cmMessage = new Subject<VPCriticalMessage>()

    public readonly cmMessage = this._cmMessage.pipe(
        startWith(null),
        map(_ => this._criticalMessage),
        shareReplay(1)
    )

    public readonly hasSidenav = this.query("sidenav").pipe(
        map(items => items.length > 0),
        shareReplay(1)
    )

    public constructor(
        @Inject(Router) router: Router,
        @Inject(Injector) protected readonly injector: Injector,
        @Inject(ShortcutService) protected readonly shortcutSvc: ShortcutService,
        @Inject(MediaQueryService) protected readonly mq: MediaQueryService
    ) {
        this._backShortcut = this.destruct.disposable(
            shortcutSvc.create({
                "sidepanel.close": {
                    shortcut: "escape, back",
                    handler: () => {
                        this.menu.opened = false
                        this.right.opened = false
                    }
                }
            })
        )
        this._backShortcut.on()

        this.destruct
            .subscription(merge(this.menu.changes, this.right.changes))
            .pipe(debounceTime(10))
            .subscribe(_ => {
                if (this.right.opened && this.right.style === VPPanelStyle.OVERLAY) {
                    if (this.menu.style === VPPanelStyle.OVERLAY) {
                        this.menu.opened = false
                    }
                    this._backShortcut.off()
                } else {
                    if (this.menu.opened && this.menu.style === VPPanelStyle.OVERLAY) {
                        if (this.right.style === VPPanelStyle.OVERLAY) {
                            this.right.opened = false
                        }
                        this._backShortcut.on()
                    } else {
                        this._backShortcut.off()
                    }
                }
            })

        this.destruct.subscription(router.events).subscribe(event => {
            if (event instanceof NavigationEnd) {
                if (!this.menu.disabled && this.menu.style !== VPPanelStyle.SLIDE) {
                    this.menu.opened = false
                }
            }
        })

        this.destruct.subscription(mq.watch("xs")).subscribe(event => {
            if (!event.matches) {
                this.navbarCenterOverlap = false
            }
        })

        let first = true
        this.destruct
            .subscription(combineLatest({ ltMd: mq.watch("lt-md"), hasSidenav: this.hasSidenav }))
            .pipe(switchMap(value => (first && !value.hasSidenav ? timer(200) : of(null)).pipe(map(() => value))))
            .subscribe(({ ltMd, hasSidenav }) => {
                if (ltMd.matches) {
                    this.menu.style = VPPanelStyle.OVERLAY
                    this.right.style = VPPanelStyle.OVERLAY
                } else {
                    this.menu.style = VPPanelStyle.SLIDE
                    this.right.style = VPPanelStyle.SLIDE
                    if (first) {
                        this.menu.opened = hasSidenav
                    }
                }
                first = false
            })
    }

    public addItem(area: string, order: number, tplRef: TemplateRef<any>): Readonly<VPItem> {
        const item: VPItem = { area, order, tplRef, viewRef: null }
        const items = [...this.items.value, item]
        items.sort((a, b) => a.order - b.order)
        this.items.next(items)
        return item
    }

    public delItem(item: VPItem): void {
        if (item.viewRef) {
            item.viewRef.destroy()
        }

        const items = [...this.items.value]
        const idx = items.indexOf(item)
        if (idx !== -1) {
            items.splice(idx, 1)
            this.items.next(items)
        }
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
