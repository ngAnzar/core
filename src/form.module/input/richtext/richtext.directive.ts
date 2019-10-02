import { Directive, Input, Output, Inject, ElementRef, EventEmitter, HostListener, OnDestroy, ViewContainerRef, Injector, ComponentFactoryResolver, ApplicationRef, ComponentRef, Optional } from "@angular/core"
import { DomSanitizer } from "@angular/platform-browser"
import { UP_ARROW, DOWN_ARROW, ESCAPE, BACKSPACE } from "@angular/cdk/keycodes"
import { DomPortalOutlet, ComponentPortal } from "@angular/cdk/portal"
import { Observable, Subject } from "rxjs"

import { Destruct } from "../../../util"
import { LayerService } from "../../../layer.module"
import { ScrollerService } from "../../../list.module"

import { RichtextService } from "./richtext.service"
import { RichtextStream, Word } from "./richtext-stream"
import { RichtextAcManager, RichtextAcProvider } from "./richtext-ac.component"

import { matchTagName, removeNode, uuidv4 } from "./util"
import { RichtextComponentRef } from "./richtext-component-ref"


@Directive({
    selector: "[nzRichtext]",
    host: {
        "[style.white-space]": "'normal'"
    },
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

    @Output("changed")
    public readonly changes: Observable<string> = new EventEmitter<string>()

    private _components: { [key: string]: RichtextComponentRef<any> } = {}
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

    public getCmp(el: HTMLElement): RichtextComponentRef<any> | null {
        return this._components[el.id]
    }

    public initCmp(el: HTMLElement): RichtextComponentRef<any> {
        let id = el.getAttribute("id")
        if (!id) {
            id = uuidv4()
            el.setAttribute("id", id)
        }

        let cmpType = this.svc.getComponentType(el.getAttribute("component"))
        if (!cmpType) {
            throw new Error("Runtime error: missing richtext component: " + el.getAttribute("component"))
        }

        let params = el.getAttribute("params") as any
        if (params) {
            params = JSON.parse(decodeURIComponent(params))
        } else {
            params = null
        }

        const ref = new RichtextComponentRef(el, params, this.onParamsChanged) as { -readonly [K in keyof RichtextComponentRef]: RichtextComponentRef[K] }
        const injector = Injector.create([
            { provide: RichtextComponentRef, useValue: ref }
        ], this.injector)

        ref.outlet = new DomPortalOutlet(el, this.cfr, this.appRef, injector)
        ref.portal = new ComponentPortal(cmpType, this.vcr, injector, this.cfr)
        ref.component = ref.outlet.attachComponentPortal(ref.portal)
        ref.component.changeDetectorRef.markForCheck()
        return this._components[id] = ref
    }

    public ngOnDestroy() {
        if (this._mutationObserver) {
            this._mutationObserver.disconnect()
        }
        for (const k in this._components) {
            const cmp = this._components[k]
            cmp.dispose()
        }
        delete this._components
    }

    protected onMuation = (mutations: MutationRecord[]) => {
        const isPortalEl = this.stream.portalEl.isMatch
        let nodes: NodeList
        let node: Node

        for (const record of mutations) {
            // nodes = record.removedNodes
            // for (let i = 0, l = nodes.length; i < l; i++) {
            //     node = nodes[i]

            //     if (isPortalEl(node)) {
            //         let cmp = this.getCmp(node as HTMLElement)
            //         if (cmp) {
            //             cmp.dispose()
            //             delete this._components[(node as HTMLElement).id]
            //         }
            //     }
            // }

            nodes = record.addedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                if (isPortalEl(node)) {
                    let cmp = this.getCmp(node as HTMLElement)
                    if (!cmp) {
                        this.initCmp(node as HTMLElement)
                    }
                } else if (node.nodeType === 1) {
                    const portals = (node as HTMLElement).querySelectorAll(this.stream.portalEl.selector)
                    for (let i = 0, l = portals.length; i < l; i++) {
                        const cmp = this.getCmp(portals[i] as HTMLElement)
                        if (!cmp) {
                            this.initCmp(portals[i] as HTMLElement)
                        }
                    }
                }
            }
        }
    }

    protected onParamsChanged = () => {
        (this.changes as EventEmitter<string>).emit(this._value = this.stream.value)
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
        @Inject(RichtextDirective) public readonly rt: RichtextDirective,
        @Inject(ScrollerService) @Optional() public readonly scroller: ScrollerService,
        @Inject(DomSanitizer) private readonly sanitizer: DomSanitizer) {

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
        this.scrollToCursor()

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
        this.scrollToCursor()
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
        const isAutocompleteEl = this.rt.stream.autoCompleteEl.isMatch
        let nodes: NodeList
        let node: Node

        for (const record of mutations) {
            nodes = record.removedNodes
            for (let i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i]

                // dispose autocomplete manager
                if (isAutocompleteEl(node)) {
                    let id = (node as HTMLElement).id
                    if (id in this._acManagers) {
                        this._acManagers[id].dispose()
                        delete this._acManagers[id]
                    }
                }
            }

            // remove empty ac anchor element
            if (isAutocompleteEl(record.target)) {
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
        const isAutocompleteEl = this.rt.stream.autoCompleteEl.isMatch

        let selection = this.rt.stream.selection
        if (selection) {
            let acNode = selection.findElement(isAutocompleteEl)
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
        let el = this.rt.stream.autoCompleteEl.create()
        el.setAttribute("id", id)
        el.innerHTML = word.value
        let html = el.outerHTML
        word.select()
        this.rt.stream.command().insertHTML(html).exec()

        let acNode = this.rt.stream.state.autocomplete.value
        if (acNode) {
            this._acManagers[id] = new RichtextAcManager(this.rt.stream, acNode, providers, this.layerSvc, this.sanitizer)
            this._acManagers[id].update(word.value)
        } else {
            throw new Error("Runtime error")
        }
    }

    protected scrollToCursor() {
        if (this.scroller) {
            let nodes = this.rt.stream.selection.nodes
            if (nodes && nodes.length) {
                this.scroller.scrollIntoViewport(nodes[nodes.length - 1])
            }
        }
    }
}
