import {
    Component, Input, Output, EventEmitter, Inject, Optional,
    AfterContentInit, OnDestroy, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef,
    TemplateRef, ViewChild, AfterViewInit, ViewContainerRef, NgZone, SkipSelf
} from "@angular/core"
import { DOCUMENT } from "@angular/common"
import { AnimationEvent } from "@angular/animations"

import { coerceBooleanProperty } from "@angular/cdk/coercion"
import { ESCAPE } from "@angular/cdk/keycodes"
import { FocusMonitor, FocusOrigin, FocusTrap, FocusTrapFactory } from "@angular/cdk/a11y"
import { Observable, timer, fromEvent } from "rxjs"
import { filter, debounce } from "rxjs/operators"

import { transitionAnimation } from "./panel.animation"
import { Destruct } from "../../util"


export type PanelPosition = "top" | "right" | "bottom" | "left"
export type PanelState = "opening" | "opened" | "closing" | "closed"
export type PanelAppear = "over" | "push"


export interface PanelStateEvent {
    source: PanelComponent
    state: PanelState
}


export interface PanelOpeningEvent {
    source: PanelComponent
    pendigValue: boolean
    finalValue?: boolean
}


export const OPEN_STATES: PanelState[] = ["opened", "opening"]


@Component({
    selector: ".nz-panel",
    template: `<ng-template><ng-content></ng-content></ng-template><ng-container #vc></ng-container>`,
    // template: `<ng-content></ng-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        transitionAnimation
    ],
    host: {
        "[@animation]": "_animationState",
        "(@animation.start)": "_onAnimationStart($event)",
        "(@animation.done)": "_onAnimationEnd($event)",

        "[attr.position]": "position",
        "[attr.appear]": "appear",
        "tabIndex": "-1",
        "[class.nz-panel-opened]": "opened",
        "[class.nz-panel-closed]": "!opened"
    }
})
export class PanelComponent implements AfterContentInit, AfterViewInit, OnDestroy {
    @Input()
    public set position(value: PanelPosition) {
        if (["top", "right", "bottom", "left"].indexOf(value) === -1) {
            throw new Error(`Invalid value of PanelComponent.position = '${value}'`)
        }
        if (this._position !== value) {
            this._position = value;
            (this.positionChange as EventEmitter<string>).emit(value)
        }
    }
    public get position(): PanelPosition {
        return this._position
    }
    protected _position: PanelPosition = "left"

    @Output() public readonly positionChange: Observable<string> = new EventEmitter(true)

    @Input()
    public set appear(value: PanelAppear) {
        if (["over", "push"].indexOf(value) === -1) {
            throw new Error(`Invalid value of PanelComponent.appear = '${value}'`)
        }
        if (this._appear !== value) {
            this._appear = value;
            (this.appearChange as EventEmitter<string>).emit(value)
            this.cdr.markForCheck()
        }
    }
    public get appear(): PanelAppear {
        return this._appear
    }
    protected _appear: PanelAppear = "over"

    @Output() public readonly appearChange: Observable<string> = new EventEmitter(true)

    @Output("focused") public readonly focusedChange: Observable<FocusOrigin | null> = new EventEmitter(true)
    public focused: FocusOrigin | null = null

    @Input()
    public set opened(value: boolean) {
        value = coerceBooleanProperty(value)
        if (this._opened !== value) {
            let event: PanelOpeningEvent = { source: this, pendigValue: value };
            (this.openedChanging as EventEmitter<PanelOpeningEvent>).emit(event);

            if (typeof event.finalValue === "boolean") {
                value = event.finalValue
                if (this._opened === value) {
                    return
                }
            }

            this._opened = value;
            this._animationState = (value ? "opened" : "closed");
            (this.stateChanges as EventEmitter<PanelStateEvent>).emit({ source: this, state: value ? "opening" : "closing" })
            this.cdr.markForCheck()
        }
    }
    public get opened(): boolean {
        return this._opened
    }
    protected _opened: boolean

    public readonly openedChanging: Observable<PanelOpeningEvent> = new EventEmitter(false)

    @Output("opened")
    public get onOpened(): Observable<PanelStateEvent> {
        return this.stateChanges.pipe(filter(o => o.state === "opened"))
    }

    @Output("openStart")
    public get onOpenStart(): Observable<PanelStateEvent> {
        return this.stateChanges.pipe(filter(o => o.state === "opening"))
    }

    @Output("closed")
    public get onClosed(): Observable<PanelStateEvent> {
        return this.stateChanges.pipe(filter(o => o.state === "closed"))
    }

    @Output("closeStart")
    public get onCloseStart(): Observable<PanelStateEvent> {
        return this.stateChanges.pipe(filter(o => o.state === "closing"))
    }

    public readonly stateChanges: Observable<PanelStateEvent> = new EventEmitter(true)

    protected _focusedBeforeOpen?: HTMLElement
    protected _focusTrap?: FocusTrap
    protected _animationState: "void" | "opened" | "closed" = "void"
    protected _contentRendered: boolean

    @ViewChild(TemplateRef) protected readonly tpl?: TemplateRef<any>
    @ViewChild("vc", { read: ViewContainerRef }) protected readonly vc?: ViewContainerRef

    public readonly destruct: Destruct = new Destruct(() => {
        if (this._focusTrap) {
            this._focusTrap.destroy()
            delete this._focusTrap
        }
        delete this.el
        delete this._document
    })

    constructor(@Inject(DOCUMENT) @Optional() protected _document: HTMLDocument,
        @Inject(FocusTrapFactory) protected _focusTrapFactory: FocusTrapFactory,
        @Inject(FocusMonitor) protected _focusMonitor: FocusMonitor,
        @Inject(ElementRef) protected el: ElementRef<HTMLElement>,
        @Inject(ChangeDetectorRef) protected cdr: ChangeDetectorRef,
        @Inject(NgZone) protected _ngZone: NgZone) {

        this.destruct.subscription(this.onOpenStart).subscribe(() => {
            this._renderContent()
            if (_document) {
                this._focusedBeforeOpen = _document.activeElement as HTMLElement
            }
        })

        this.destruct.subscription(this.onClosed).subscribe(() => {
            this._restoreFocus()
        })

        this.destruct.subscription(this._focusMonitor.monitor(this.el.nativeElement, true))
            .pipe(debounce(() => timer(20)))
            .subscribe((origin) => {
                this.focused = origin;
                (this.focusedChange as EventEmitter<any>).emit(origin)
            })

        this._ngZone.runOutsideAngular(() => {
            fromEvent<KeyboardEvent>(this.el.nativeElement, "keydown")
                .pipe(filter(event => event.keyCode === ESCAPE))
                .subscribe(event => this._ngZone.run(() => {
                    if (!event.defaultPrevented) {
                        this.opened = false
                        event.stopPropagation()
                    }
                }))
        })
    }

    protected _restoreFocus() {
        let activeEl = this._document && this._document.activeElement

        if (activeEl && this.el.nativeElement.contains(activeEl)) {
            if (this._focusedBeforeOpen) {
                this._focusMonitor.focusVia(this._focusedBeforeOpen, "program")
            }
        }
    }

    protected _onAnimationStart(event: AnimationEvent) {
    }

    protected _onAnimationEnd(event: AnimationEvent) {
        if (event.toState === "opened") {
            (this.stateChanges as EventEmitter<PanelStateEvent>).emit({ source: this, state: "opened" })
        } else if (event.toState === "closed") {
            (this.stateChanges as EventEmitter<PanelStateEvent>).emit({ source: this, state: "closed" })
        }
    }

    protected _renderContent() {
        if (this.opened && this.tpl && !this._contentRendered) {
            this._contentRendered = true
            this.vc.createEmbeddedView(this.tpl)
        }

        if (this._contentRendered) {
            let max = 100
            let wait = setInterval(() => {
                if ((max -= 5) >= 0) {
                    this._focusTrap.focusInitialElementWhenReady().then(focused => {
                        if (!focused && typeof this.el.nativeElement.focus === "function") {
                            this._focusMonitor.focusVia(this.el.nativeElement, "program")
                        }
                        if (this.focused) {
                            clearTimeout(wait)
                        }
                    })
                } else {
                    clearTimeout(wait)
                }
            }, 5)
        }
    }

    public ngAfterContentInit() {
        this._focusTrap = this._focusTrapFactory.create(this.el.nativeElement)
        this._focusTrap.enabled = true

        if (!this.opened) {
            this._animationState = "closed"
        }
    }

    public ngAfterViewInit() {
        this._renderContent()
    }

    public ngOnDestroy() {
        this.destruct.run()
    }
}
