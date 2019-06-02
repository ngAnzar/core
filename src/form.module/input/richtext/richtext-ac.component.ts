import { Component, Inject, InjectionToken } from "@angular/core"
import { Observable, Subject, forkJoin } from "rxjs"
import { take, map } from "rxjs/operators"

import { Destruct, IDisposable } from "../../../util"
import { Model, Field, SingleSelection, ISelectionModel, SelectionModel } from "../../../data.module"
import { LayerService, LayerRef, DropdownLayer } from "../../../layer.module"
import { RichtextStream, RangeFactory, RT_PORTAL_TAG_NAME } from "./richtext-stream"
import { removeNode } from "./util"


const AC_ITEMS = new InjectionToken<Observable<RichtextAcItem[]>>("AC_ITEMS")
const PROVIDER = Symbol("@AcProvider")


export class RichtextAcItem extends Model {
    public [PROVIDER]: RichtextAcProvider
    @Field() public label: string
    @Field() public preview: string
}


export abstract class RichtextAcProvider {
    public abstract readonly trigger: RegExp
    public abstract readonly prevent: RegExp | null
    public abstract readonly mustSelect: boolean
    public abstract readonly minChars: number

    public abstract query(value: string): Observable<RichtextAcItem[]>
    public abstract onSelect(item: RichtextAcItem, rt: RichtextStream, anchor: HTMLElement): void
    public abstract onExit(rt: RichtextStream, anchor: HTMLElement): void

    protected replaceWithComponent(rt: RichtextStream, anchor: HTMLElement, name: string, params: { [key: string]: any }) {
        let cmp = this.createComponentNode(name, params)
        anchor.parentNode.insertBefore(cmp, anchor)

        let range = new RangeFactory(anchor, 0, anchor, 0)
        range.select()
        removeNode(anchor)
        rt.command().insertText(" ").exec()
    }

    protected createComponentNode(name: string, params: any): HTMLElement {
        let node = document.createElement(RT_PORTAL_TAG_NAME)
        node.setAttribute("contenteditable", "false")
        node.setAttribute("name", name)
        node.setAttribute("params", encodeURI(JSON.stringify(params)))
        return node
    }
}



export class RichtextAcManager implements IDisposable {
    public readonly destruct = new Destruct()
    public readonly items: Observable<RichtextAcItem[]> = this.destruct.subject(new Subject())
    public readonly selection = new SingleSelection<RichtextAcItem>()

    protected _layerRef: LayerRef

    public constructor(
        public readonly rt: RichtextStream,
        public readonly anchorEl: HTMLElement,
        public readonly providers: RichtextAcProvider[],
        public readonly layerSvc: LayerService) {

        this.selection.keyboard.instantSelection = false

        this.destruct.subscription(this.items).subscribe(items => {
            if (items.length) {
                if (!this._layerRef || !this._layerRef.isVisible) {
                    let behavior = new DropdownLayer({
                        backdrop: null,
                        elevation: 5,
                        position: {
                            anchor: {
                                ref: this.anchorEl,
                                align: "bottom left",
                                margin: "4 0"
                            },
                            align: "top left",
                        }
                    })
                    this._layerRef = this.layerSvc.createFromComponent(RichtextAcComponent, behavior, null, [
                        { provide: AC_ITEMS, useValue: this.items },
                        { provide: SelectionModel, useValue: this.selection }
                    ])
                    this._layerRef.show()
                }
            } else if (this._layerRef) {
                this._layerRef.hide()
                delete this._layerRef
            }
        })

        // this.selection.keyboard.connect(anchorEl)
        this.destruct.subscription(this.selection.changes).subscribe(selection => {
            let selected = selection[0]
            console.log({ selected })
            if (selected) {
                selected[PROVIDER].onSelect(selected, rt, anchorEl)
            }
        })

        // this.destruct.subscription(this.selection.focusing).subscribe(focusing => {
        //     if (focusing.origin) {
        //         if (focusing.item.preview) {
        //             anchorEl.innerText = focusing.item.preview
        //         } else {

        //         }
        //     }
        // })
    }


    // TODO: debounce...
    public update(query: string) {
        let queryFrom = this.providers.filter(p => p.minChars <= query.length)

        if (queryFrom.length) {
            this.destruct.subscription(forkJoin(queryFrom.map(p => p.query(query))))
                .pipe(take(1))
                .pipe(map(value => {
                    console.log(value, queryFrom)
                    let result: RichtextAcItem[] = []
                    for (let i = 0, l = value.length; i < l; i++) {
                        for (let v of value[i]) {
                            v[PROVIDER] = queryFrom[i]
                            result.push(v)
                        }
                    }
                    return result
                }))
                .subscribe(result => (this.items as Subject<RichtextAcItem[]>).next(result))
        } else {
            (this.items as Subject<RichtextAcItem[]>).next([])
        }
    }

    public dispose() {
        delete (this as any).anchorEl
        delete (this as any).providers
        if (this._layerRef) {
            this._layerRef.hide()
            delete this._layerRef
        }
        this.destruct.run()
        this.selection.ngOnDestroy()
        delete (this as any).selection
    }
}


@Component({
    selector: "nz-richtext-acpopup",
    templateUrl: "./richtext-ac.component.pug"
})
export class RichtextAcComponent {
    public constructor(
        @Inject(AC_ITEMS) protected readonly items: Observable<RichtextAcItem[]>,
        @Inject(SelectionModel) protected readonly selection: ISelectionModel<RichtextAcItem>) {
    }
}
