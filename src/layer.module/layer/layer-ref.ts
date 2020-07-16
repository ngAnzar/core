import { EventEmitter, Injector, ComponentRef, TemplateRef, EmbeddedViewRef, ViewContainerRef } from "@angular/core"
import { ComponentPortal, TemplatePortal, ComponentType } from "@angular/cdk/portal"
import { FocusTrap, FocusTrapFactory } from "@angular/cdk/a11y"
import { Observable, Subscription } from "rxjs"
import { filter, mapTo } from "rxjs/operators"

import { Destruct, IDisposable, __zone_symbol__ } from "../../util"
import { PreventableEvent } from "../../util"
import { ShortcutService, Shortcuts } from "../../common.module"
import { LayerOutletRef } from "./layer-container"
import { LayerBehavior } from "./layer-behavior"


const setTimeout = __zone_symbol__("setTimeout")


export class LayerEvent<D> extends PreventableEvent {
    public readonly layer: LayerRef<this>

    public constructor(
        public readonly type: "showing" | "shown" | "hiding" | "destroy" | "button" | string,
        public data?: D) {
        super()
    }
}


export abstract class LayerRef<E extends LayerEvent<any> = LayerEvent<any>> implements IDisposable {
    public readonly injector: Injector
    public readonly isEmpty: boolean
    public readonly isVisible: boolean

    public readonly destruct = new Destruct(() => {
        this.emit(new LayerEvent("destroy") as E)
        let self = this as any
        delete self.behavior
        delete self.opener
        delete self.outlet
        delete self.vcr
    })

    // protected s = new Subscriptions()

    public readonly output: Observable<E> = this.destruct.subject(new EventEmitter())
    public readonly input: Observable<E> = this.destruct.subject(new EventEmitter())

    public abstract readonly opener: LayerRef
    protected abstract vcr: ViewContainerRef
    protected shortcuts: Shortcuts
    protected focusTrap: FocusTrap
    protected lastFocused: HTMLElement

    public constructor(
        public readonly behavior: LayerBehavior,
        public readonly outlet: LayerOutletRef,
        protected readonly shortcutSvc: ShortcutService,
        protected readonly focusTrapSvc: FocusTrapFactory) {
        this.destruct.disposable(behavior)
        this.destruct.disposable(outlet)

        this.shortcuts = this.destruct.disposable(this.shortcutSvc.create(outlet.nativeElement, {
            "layer.close": {
                shortcut: "escape, back", handler: () => {
                    this.close()
                }
            }
        }))
        this.shortcuts.enabled = false
    }

    public get onClose(): Observable<void> {
        return this.output.pipe(filter(v => v.type === "destroy"), mapTo(null))
    }

    public get container(): HTMLElement {
        return this.outlet.nativeElement
    }

    public set top(val: number) {

    }

    public set left(val: number) {

    }

    public emit(out: Partial<E>): void {
        (out as any).layer = this;
        (this.output as EventEmitter<E>).emit(out as E)
    }

    public subscribe(handler: (value: E) => void): Subscription {
        return this.destruct.subscription(this.output).subscribe(handler as any)
    }

    public push(inp: Partial<E>): void {
        (inp as any).layer = this;
        (this.input as EventEmitter<E>).emit(inp as E)
    }

    public pull(handler: (value: E) => void): Subscription {
        return this.destruct.subscription(this.input).subscribe(handler as any)
    }

    public close(): Promise<boolean> {
        return this.behavior.canClose(this)
            .then(val => {
                if (val === true) {
                    return this.hide().then(() => Promise.resolve(true))
                } else {
                    return Promise.resolve(false)
                }
            })
    }

    public show(): Promise<any> {
        if (this.isVisible) {
            return Promise.resolve()
        } else {
            (this as any).isVisible = true
            this.saveFocus()
            this.shortcuts.enabled = true
            this.attach()
            this.behavior.initShow(this)
            this.behavior.levitate.begin()

            this.emit(new LayerEvent("showing") as E)

            return this.behavior.animateShow(this).then(() => {
                // this.behavior.levitate.resume()
                if (this.behavior.options.trapFocus && !this.focusTrap) {
                    this.focusTrap = this.focusTrapSvc.create(this.outlet.nativeElement, false)
                    this.destruct.any(this.focusTrap.destroy.bind(this.focusTrap))
                }
                if (this.focusTrap) {
                    const initialFocus = this.container.querySelector("[cdkFocusInitial]") as HTMLElement
                    if (initialFocus) {
                        initialFocus.focus()
                    } else {
                        this.container.focus()
                    }
                }
                this.emit(new LayerEvent("shown") as E)
            })
        }
    }

    protected abstract attach(): void

    public hide(): Promise<any> {
        if (this.isVisible) {
            (this as any).isVisible = false
            this.restoreFocus()
            this.behavior.initHide(this)
            this.behavior.levitate.suspend()
            this.emit(new LayerEvent("hiding") as E)
            return Promise.all([
                // this.behavior.hideBackdrop(this),
                this.behavior.animateHide(this).then(() => {
                    this.emit(new LayerEvent("hidden") as E)
                    this.dispose()
                })
            ])
        } else {
            return Promise.resolve()
        }
    }

    public dispose() {
        this.destruct.run()
    }

    private saveFocus() {
        this.lastFocused = document.activeElement as HTMLElement
    }

    private restoreFocus() {
        if (this.lastFocused && document.contains(this.lastFocused) && typeof this.lastFocused.focus !== "undefined") {
            const rootEl = this.outlet.nativeElement
            const focusedEl = document.activeElement
            if (rootEl === focusedEl || rootEl.contains(focusedEl)) {
                this.lastFocused.focus()
            }
        }
    }
}


export class ComponentLayerRef<C, E extends LayerEvent<any> = LayerEvent<any>> extends LayerRef<E> {
    public readonly component: ComponentRef<C>
    protected portal: ComponentPortal<C>

    public constructor(behavior: LayerBehavior, outlet: LayerOutletRef, shortcutSvc: ShortcutService, focusTrap: FocusTrapFactory,
        public readonly opener: LayerRef,
        protected readonly vcr: ViewContainerRef,
        protected readonly componentCls: ComponentType<C>) {
        super(behavior, outlet, shortcutSvc, focusTrap)
        this.destruct.any(() => {
            if (this.portal && this.portal.isAttached) {
                this.portal.detach()
            }
            delete (this as any).portal
            if (this.component) {
                this.component.destroy()
                delete (this as any).component
            }
        })
    }

    protected attach(): void {
        if (!this.component) {
            this.portal = new ComponentPortal(this.componentCls, this.vcr, this.injector);
            (this as any).component = this.outlet.portal.attachComponentPortal(this.portal)
            this.component.location.nativeElement.classList.add("nz-layer-content")
            this.component.changeDetectorRef.detectChanges()
        }
    }
}


export class TemplateLayerRef<C, E extends LayerEvent<any> = LayerEvent<any>> extends LayerRef<E> {
    public readonly view: EmbeddedViewRef<C>
    protected readonly portal: TemplatePortal<C>

    public constructor(behavior: LayerBehavior, outlet: LayerOutletRef, shortcutSvc: ShortcutService, focusTrap: FocusTrapFactory,
        public readonly opener: LayerRef,
        protected readonly vcr: ViewContainerRef,
        tpl: TemplateRef<C>,
        ctx: C) {
        super(behavior, outlet, shortcutSvc, focusTrap)
        this.portal = new TemplatePortal(tpl, vcr, ctx)

        this.destruct.any(() => {
            if (this.portal && this.portal.isAttached) {
                this.portal.detach()
            }
            delete (this as any).portal
            if (this.view) {
                this.view.destroy()
                delete (this as any).view
            }
        })
    }

    protected attach(): void {
        if (!this.view) {
            (this as any).view = this.outlet.portal.attachTemplatePortal(this.portal)
            for (let e of this.view.rootNodes) {
                if (e.classList) {
                    e.classList.add("nz-layer-content")
                }
            }
            if (!this.view.destroy) {
                this.view.detectChanges()
            }
        }
    }
}
