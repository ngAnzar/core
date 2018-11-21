import { Injectable, ElementRef, Inject, Optional, Renderer2, RendererFactory2, RendererStyleFlags2 } from "@angular/core"

import { memoize } from "../util"


@Injectable()
export class Renderer extends Renderer2 {
    @memoize()
    public get renderer(): Renderer2 {
        if (this._renderer) {
            const r = this._renderer
            delete this._renderer
            return this._renderer
        } else {
            return this._factory.createRenderer(this._elRef ? this._elRef.nativeElement : null, null)
        }
    }

    private _renderer: any

    public constructor(
        @Inject(ElementRef) @Optional() private _elRef: ElementRef,
        // @Inject(Renderer2) @Optional() private _renderer: Renderer2,
        @Inject(RendererFactory2) private _factory: RendererFactory2) {
        super()
    }

    public get data(): { [key: string]: any; } { return this.renderer.data }
    public destroy(): void { this.renderer.destroy() }
    public createElement(name: string, namespace?: string): any { return this.renderer.createElement(name, namespace) }
    public createComment(value: string): any { return this.renderer.createComment(value) }
    public createText(value: string): any { return this.renderer.createText(value) }
    public appendChild(parent: any, newChild: any): void { this.renderer.appendChild(parent, newChild) }
    public insertBefore(parent: any, newChild: any, refChild: any): void { this.renderer.insertBefore(parent, newChild, refChild) }
    public removeChild(parent: any, oldChild: any): void { this.renderer.removeChild(parent, oldChild) }
    public selectRootElement(selectorOrNode: any): any { return this.renderer.selectRootElement(selectorOrNode) }
    public parentNode(node: any): any { return this.renderer.parentNode(node) }
    public nextSibling(node: any): any { return this.renderer.nextSibling(node) }
    public setAttribute(el: any, name: string, value: string, namespace?: string): void { this.renderer.setAttribute(el, name, value, namespace) }
    public removeAttribute(el: any, name: string, namespace?: string): void { this.renderer.removeAttribute(el, name, namespace) }
    public addClass(el: any, name: string): void { this.renderer.addClass(el, name) }
    public removeClass(el: any, name: string): void { this.renderer.removeClass(el, name) }
    public setStyle(el: any, style: string, value: any, flags?: RendererStyleFlags2): void { this.renderer.setStyle(el, style, value, flags) }
    public removeStyle(el: any, style: string, flags?: RendererStyleFlags2): void { this.renderer.removeStyle(el, style, flags) }
    public setProperty(el: any, name: string, value: any): void { this.renderer.setProperty(el, name, value) }
    public setValue(node: any, value: string): void { this.renderer.setValue(node, value) }
    public listen(target: any, eventName: string, callback: (event: any) => boolean | void): () => void { return this.renderer.listen(target, eventName, callback) }
}
