import { Component, Inject, InjectionToken } from "@angular/core"
import { Observable, Subject, forkJoin } from "rxjs"
import { take, map } from "rxjs/operators"

import { Destruct, IDisposable } from "../../../util"
import { Model, Field, SingleSelection, SelectionKeyboardHandler, ISelectionModel, SelectionModel } from "../../../data.module"
import { LayerService, LayerRef, DropdownLayer } from "../../../layer.module"


const AC_ITEMS = new InjectionToken<Observable<RichtextAcItem[]>>("AC_ITEMS")


export class RichtextAcItem extends Model {
    @Field() public label: string
}


export abstract class RichtextAcProvider {
    public abstract readonly trigger: RegExp
    public abstract readonly prevent: RegExp | null
    public abstract readonly mustSelect: boolean
    public abstract readonly minChars: number

    public abstract query(value: string): Observable<RichtextAcItem[]>
}



export class RichtextAcManager implements IDisposable {
    public readonly destruct = new Destruct()
    public readonly items: Observable<RichtextAcItem[]> = this.destruct.subject(new Subject())
    public readonly selection = new SingleSelection()

    protected _layerRef: LayerRef

    public constructor(
        public readonly anchorEl: HTMLElement,
        public readonly providers: RichtextAcProvider[],
        public readonly layerSvc: LayerService) {

        this.destruct.subscription(this.items).subscribe(items => {
            if (items.length) {
                if (!this._layerRef || !this._layerRef.isVisible) {
                    let behavior = new DropdownLayer({
                        backdrop: null,
                        elevation: 5,
                        position: {
                            anchor: {
                                ref: this.anchorEl,
                                align: "bottom left"
                            },
                            align: "top left"
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
        this.selection.changes.subscribe(x => {
            console.log("selection", x)
        })
    }


    // TODO: debounce...
    public update(query: string) {
        let queryFrom = this.providers.filter(p => p.minChars <= query.length)

        if (queryFrom.length) {
            this.destruct.subscription(forkJoin(queryFrom.map(p => p.query(query))))
                .pipe(take(1))
                .pipe(map(value => [].concat(...value)))
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
