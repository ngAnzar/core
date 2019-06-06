import { Directive, Input, Output, Inject, ElementRef, EventEmitter, HostListener, OnDestroy, ViewContainerRef, Injector, ComponentFactoryResolver, ApplicationRef, ComponentRef } from "@angular/core"
import { UP_ARROW, DOWN_ARROW, ESCAPE, BACKSPACE } from "@angular/cdk/keycodes"
import { DomPortalOutlet, ComponentType, ComponentPortal } from "@angular/cdk/portal"
import { Observable, Subject } from "rxjs"

import { Destruct, IDisposable } from "../../../util"
import { LayerService } from "../../../layer.module"

import { RichtextService, RICHTEXT_COMPONENT_PARAMS } from "./richtext.service"
import { RichtextStream, Word, RT_AC_TAG_NAME, RT_PORTAL_TAG_NAME } from "./richtext-stream"
import { RichtextAcManager, RichtextAcProvider } from "./richtext-ac.component"

import { matchTagName, removeNode, uuidv4 } from "./util"


@Directive({
    selector: "[nzRichtext]",
    exportAs: "nzRichtext",
    providers: [RichtextService, RichtextStream]
})
export class RichtextDirective implements OnDestroy {
    @Input("nzRichtext")
    public set value(val: string) {
        if (this._value !== val) {
            this.stream.value = val

            let newValue = this.stream.value;
            if (this._value !== newValue) {
                (this.changes as EventEmitter<string>).emit(this._value = newValue)
            }
        }
    }
    public get value(): string { return this._value }
    private _value: string

    @Output("change")
    public readonly changes: Observable<string> = new EventEmitter<string>()

    private _components: { [key: string]: RichtextComponentManager<any> } = {}
    private _mutationObserver: MutationObserver

    public constructor(
        @Inject(ViewContainerRef) protected readonly vcr: ViewContainerRef,
        @Inject(Injector) protected readonly injector: Injector,
        @Inject(ComponentFactoryResolver) protected readonly cfr: ComponentFactoryResolver,
        @Inject(ApplicationRef) protected readonly appRef: ApplicationRef,
        @Inject(RichtextService) public readonly svc: RichtextService,
        @Inject(RichtextStream) public readonly stream: RichtextStream) {

        let mutation = new MutationObserver(this.onMuation)
        mutation.observe(stream.el, {
            childList: true,
            subtree: true
        })
    }

    public getCmp(el: HTMLElement): RichtextComponentManager<any> | null {
        return this._components[el.id]
    }

    public initCmp(el: HTMLElement): RichtextComponentManager<any> {
        let id = el.getAttribute("id")
        if (!id) {
            id = uuidv4()
            el.setAttribute("id", id)
        }

        let cmpType = this.svc.getComponentType(el.getAttribute("type"))
        if (!cmpType) {
            throw new Error("Runtime error: missing richtext component: " + el.getAttribute("type"))
        }

        let params = el.getAttribute("params")
        if (params) {
            params = JSON.parse(decodeURIComponent(params))
        } else {
            params = null
        }

        let injector = Injector.create([
            { provide: RICHTEXT_COMPONENT_PARAMS, useValue: params }
        ], this.injector)

        let outlet = new DomPortalOutlet(el, this.cfr, this.appRef, injector)
        let portal = new ComponentPortal(cmpType, this.vcr, injector, this.cfr)
        let mgr = new RichtextComponentManager(el, outlet, portal)
        return this._components[id] = mgr
    }

    public ngOnDestroy() {
        this.stream.value = ""
        if (this._mutationObserver) {
            this._mutationObserver.disconnect()
        }
    }

    protected onMuation = (mutations: MutationRecord[]) => {
        let nodes: NodeList
        let node: Node

        for (const record of mutations) {
            nodes = record.removedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                if (matchTagName(node, RT_PORTAL_TAG_NAME)) {
                    let cmp = this.getCmp(node as HTMLElement)
                    if (cmp) {
                        cmp.dispose()
                        delete this._components[(node as HTMLElement).id]
                    }
                }
            }

            nodes = record.addedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                if (matchTagName(node, RT_PORTAL_TAG_NAME)) {
                    let cmp = this.getCmp(node as HTMLElement)
                    if (!cmp) {
                        this.initCmp(node as HTMLElement)
                    }
                }
            }
        }
    }
}


@Directive({
    selector: "[nzRichtext][contenteditable='true']"
})
export class RichtextEditableDirective implements OnDestroy {
    public readonly destruct = new Destruct()

    @Output("cursorMove")
    public readonly cursorMove: Observable<any> = new EventEmitter()

    // public readonly inAutoComplete: boolean

    private _acManagers: { [key: string]: RichtextAcManager } = {}

    public constructor(
        @Inject(LayerService) public readonly layerSvc: LayerService,
        @Inject(RichtextDirective) public readonly rt: RichtextDirective) {

        let mutation = new MutationObserver(this.onMuation)
        this.destruct.any(mutation.disconnect.bind(mutation))
        mutation.observe(rt.stream.el, {
            childList: true,
            subtree: true
        })
    }

    public ngOnDestroy() {
        this.destruct.run()
        for (const k in this._acManagers) {
            this._acManagers[k].dispose()
        }
        delete this._acManagers
    }

    @HostListener("input", ["$event"])
    public onInput(event: Event) {
        this.triggerAutoComplete();
        let newValue = this.rt.stream.value
        if ((this.rt as any)._value !== newValue) {
            (this.rt.changes as EventEmitter<string>).emit((this.rt as any)._value = newValue)
        }
    }

    @HostListener("keydown", ["$event"])
    public onKeydown(event: KeyboardEvent) {
        if (this._handleKeyEvent(event) || event.defaultPrevented) {
            return
        }

        // http://jsfiddle.net/Sviatoslav/4d23y74j/
        if (event.keyCode === BACKSPACE) {
            let selection = window.getSelection()
            if (!selection.isCollapsed || !selection.rangeCount) {
                return
            }

            let curRange = selection.getRangeAt(selection.rangeCount - 1)
            if (curRange.commonAncestorContainer.nodeType == 3 && curRange.startOffset > 0) {
                // we are in child selection. The characters of the text node is being deleted
                return
            }

            let range = document.createRange()
            if (selection.anchorNode !== this.rt.stream.el) {
                // selection is in character mode. expand it to the whole editable field
                range.selectNodeContents(this.rt.stream.el)
                range.setEndBefore(selection.anchorNode)
            } else if (selection.anchorOffset > 0) {
                range.setEnd(this.rt.stream.el, selection.anchorOffset)
            } else {
                // reached the beginning of editable field
                return
            }
            range.setStart(this.rt.stream.el, range.endOffset - 1)


            let previousNode = range.cloneContents().lastChild as HTMLElement
            if (previousNode && previousNode.contentEditable == "false") {
                // this is some rich content, e.g. smile. We should help the user to delete it
                range.deleteContents()
                event.preventDefault()
            }
        }
    }

    @HostListener("keyup", ["$event"])
    public onKeyup(event: KeyboardEvent) {
        if (this._handleKeyEvent(event) || event.defaultPrevented) {
            return
        }

        (this.cursorMove as Subject<any>).next()
        // console.log("keyup", this.rt.stream.selection.native)
    }

    @HostListener("blur")
    public onBlur() {
        // this.rt.stream.el.querySelectorAll(RT_AC_TAG_NAME).forEach(removeNode)
    }

    protected _handleKeyEvent(event: KeyboardEvent): boolean {
        let handled = false
        for (const k in this._acManagers) {
            let manager = this._acManagers[k]
            if (manager.selection.keyboard.handleKeyEvent(event)) {
                handled = true
            }
        }

        if (event.type === "keyup" && event.keyCode === ESCAPE) {
            let ac = this.rt.stream.state.autocomplete
            if (ac.enabled) {
                removeNode(ac.value)
                handled = true
                event.stopImmediatePropagation()
                event.preventDefault()
            }
        }

        return handled
    }

    @HostListener("pointerup")
    public onPointerup() {
        (this.cursorMove as Subject<any>).next()
    }

    protected onMuation = (mutations: MutationRecord[]) => {
        let nodes: NodeList
        let node: Node

        for (const record of mutations) {
            nodes = record.removedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                // dispose autocomplete manager
                if (matchTagName(node, RT_AC_TAG_NAME)) {
                    let id = (node as HTMLElement).id
                    if (id in this._acManagers) {
                        this._acManagers[id].dispose()
                        delete this._acManagers[id]
                    }
                }
            }

            // remove empty ac anchor element
            if (matchTagName(record.target, RT_AC_TAG_NAME)) {
                let content = (record.target as HTMLElement).innerText
                if (content) {
                    content = content.replace(/^\s+|\s+$/, "")
                }

                if (!content) {
                    removeNode(record.target)
                }
            }
        }
    }

    protected triggerAutoComplete() {
        let selection = this.rt.stream.selection
        if (selection) {
            let acNode = selection.findElement(RT_AC_TAG_NAME)
            if (acNode) {
                let rtid = acNode.id
                let manager = this._acManagers[rtid]
                if (manager) {
                    manager.update(acNode.innerText)
                }
            } else {
                let word = selection.word
                if (word) {
                    let ac = this.rt.svc.getAcProviders(word.value)
                    if (ac.length) {
                        this.beginAc(ac, word)
                    }
                }
            }
        }
    }

    protected beginAc(providers: RichtextAcProvider[], word: Word) {
        let id = uuidv4()
        let html = `<${RT_AC_TAG_NAME} id="${id}">${word.value}</${RT_AC_TAG_NAME}>`
        word.select()
        this.rt.stream.command().insertHTML(html).exec()

        let acNode = this.rt.stream.state.autocomplete.value
        if (acNode) {
            this._acManagers[id] = new RichtextAcManager(this.rt.stream, acNode, providers, this.layerSvc)
            this._acManagers[id].update(word.value)
        } else {
            throw new Error("Runtime error")
        }
    }
}



export class RichtextComponentManager<T> implements IDisposable {
    public readonly component: ComponentRef<T>

    public constructor(
        public readonly el: HTMLElement,
        public readonly outlet: DomPortalOutlet,
        public readonly portal: ComponentPortal<T>) {
        this.component = outlet.attachComponentPortal(portal)
        this.component.changeDetectorRef.markForCheck()
    }

    public dispose() {
        if (this.outlet) {
            this.outlet.detach()
            delete (this as any).outlet
        }
        if (this.component) {
            this.component.destroy()
            delete (this as any).component
        }
        if (document.contains(this.el)) {
            removeNode(this.el)
        }
        delete (this as any).el
        delete (this as any).portal
    }
}
