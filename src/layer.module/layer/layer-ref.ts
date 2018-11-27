import { EventEmitter, Injector, ComponentRef, TemplateRef, EmbeddedViewRef, ViewContainerRef } from "@angular/core"
import { ComponentPortal, TemplatePortal, ComponentType } from "@angular/cdk/portal"
import { Observable, Subscription } from "rxjs"
import { filter, mapTo } from "rxjs/operators"

import { Destruct, IDisposable } from "../../util"
import { PreventableEvent } from "../../util"
import { LayerOutletRef } from "./layer-container"
import { LayerBehavior } from "./layer-behavior"


export class LayerEvent<D> extends PreventableEvent {
    public readonly layer: LayerRef<this>

    public constructor(
        public readonly type: "showing" | "hiding" | "destroy" | "button" | string,
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

    public constructor(
        public readonly behavior: LayerBehavior,
        public readonly outlet: LayerOutletRef) {
        this.destruct.disposable(behavior)
        this.destruct.disposable(outlet)
    }

    public get onClose(): Observable<void> {
        return this.output.pipe(filter(v => v.type === "destroy"), mapTo(null))
    }

    public get container(): HTMLElement {
        return this.outlet.nativeElement
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
            this.attach()
            this.behavior.initShow(this)
            this.behavior.levitate.begin()
            this.emit(new LayerEvent("showing") as E)
            return Promise.all([
                // this.behavior.showBackdrop(this),
                this.behavior.animateShow(this)
            ])
        }
    }

    protected abstract attach(): void

    public hide(): Promise<any> {
        if (this.isVisible) {
            (this as any).isVisible = false
            this.behavior.initHide(this)
            this.behavior.levitate.suspend()
            this.emit(new LayerEvent("hiding") as E)
            return Promise.all([
                // this.behavior.hideBackdrop(this),
                this.behavior.animateHide(this).then(() => this.dispose())
            ])
        } else {
            return Promise.resolve()
        }
    }

    public dispose() {
        this.destruct.run()
    }
}


export class ComponentLayerRef<C, E extends LayerEvent<any> = LayerEvent<any>> extends LayerRef<E> {
    public readonly component: ComponentRef<C>

    protected get portal(): ComponentPortal<C> {
        if (!this._portal) {
            this._portal = new ComponentPortal(this.componentCls, this.vcr, this.injector)
        }
        return this._portal
    }
    protected _portal: ComponentPortal<C>

    public constructor(behavior: LayerBehavior, outlet: LayerOutletRef,
        public readonly opener: LayerRef,
        protected readonly vcr: ViewContainerRef,
        protected readonly componentCls: ComponentType<C>) {
        super(behavior, outlet)
    }

    protected attach(): void {
        if (!this.component) {
            (this as any).component = this.outlet.portal.attachComponentPortal(this.portal)
            this.component.location.nativeElement.classList.add("nz-layer-content")
            this.component.changeDetectorRef.detectChanges()
        }
    }
}


export class TemplateLayerRef<C, E extends LayerEvent<any> = LayerEvent<any>> extends LayerRef<E> {
    public readonly view: EmbeddedViewRef<C>
    protected readonly portal: TemplatePortal<C>

    public constructor(behavior: LayerBehavior, outlet: LayerOutletRef,
        public readonly opener: LayerRef,
        protected readonly vcr: ViewContainerRef,
        tpl: TemplateRef<C>,
        ctx: C) {
        super(behavior, outlet)
        this.portal = new TemplatePortal(tpl, vcr, ctx)
    }

    protected attach(): void {
        if (!this.view) {
            (this as any).view = this.outlet.portal.attachTemplatePortal(this.portal)
            for (let e of this.view.rootNodes) {
                if (e.classList) {
                    e.classList.add("nz-layer-content")
                }
            }
            this.view.detectChanges()
        }
    }
}