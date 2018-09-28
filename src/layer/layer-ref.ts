import { EventEmitter, Injector, ComponentRef, TemplateRef, EmbeddedViewRef, ViewContainerRef } from "@angular/core"
import { ComponentPortal, TemplatePortal, ComponentType } from "@angular/cdk/portal"
import { Observable, Subscription } from "rxjs"

import { Subscriptions } from "../util/subscriptions"
import { AnzarEvent } from "../util/event"
import { LayerOutlet } from "./layer-container"
import { LayerService } from "./layer.service"
import { LayerBehavior } from "./layer-behavior"



export class LayerEvent<D> extends AnzarEvent {
    public readonly layer: LayerRef<this>

    public constructor(
        public readonly type: string,
        public data?: D) {
        super()
    }
}


export abstract class LayerRef<E extends LayerEvent<any> = LayerEvent<any>> {
    public readonly injector: Injector
    public readonly isEmpty: boolean
    public readonly isVisible: boolean

    protected s = new Subscriptions()

    public readonly output: Observable<E> = new EventEmitter()
    public readonly input: Observable<E> = new EventEmitter()

    public abstract readonly service: LayerService
    public abstract readonly behavior: LayerBehavior
    public abstract readonly opener: LayerRef
    public abstract outlet: LayerOutlet
    protected abstract vcr: ViewContainerRef

    public get container(): HTMLElement {
        return this.outlet.nativeElement
    }

    public emit(out: E): void {
        (out as any).layer = this;
        (this.output as EventEmitter<E>).emit(out)
    }

    public subscribe(handler: (value: E) => void): Subscription {
        return this.s.add(this.output).subscribe(handler as any)
    }

    public push(inp: E): void {
        (inp as any).layer = this;
        (this.input as EventEmitter<E>).emit(inp)
    }

    public pull(handler: (value: E) => void): Subscription {
        return this.s.add(this.input).subscribe(handler as any)
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
            this.behavior.levitate.update()
            return Promise.all([
                this.behavior.showBackdrop(this),
                this.behavior.animateShow(this)
            ])
        }
    }

    protected abstract attach(): void

    public hide(): Promise<any> {
        if (this.isVisible) {
            (this as any).isVisible = false
            return Promise.all([
                this.behavior.hideBackdrop(this),
                this.behavior.animateHide(this).then(() => this.dispose())
            ])
        } else {
            return Promise.resolve()
        }
    }

    public dispose() {
        if (!this.s.isClosed) {
            this.emit(new LayerEvent("destroy") as E)
            if (this.outlet) {
                this.outlet.dispose()
            }
            this.s.unsubscribe()
            this.behavior.dispose()

            let x = this as any
            delete x.service
            delete x.behavior
            delete x.opener
            delete x.outlet
            delete x.vcr
        }
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

    public constructor(public readonly service: LayerService,
        public readonly behavior: LayerBehavior,
        public outlet: LayerOutlet,
        public readonly opener: LayerRef,
        protected readonly vcr: ViewContainerRef,
        protected readonly componentCls: ComponentType<C>) {
        super()
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

    public constructor(public readonly service: LayerService,
        public readonly behavior: LayerBehavior,
        public outlet: LayerOutlet,
        public readonly opener: LayerRef,
        protected readonly vcr: ViewContainerRef,
        tpl: TemplateRef<C>,
        ctx: C) {
        super()
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
