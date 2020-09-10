import { Directive, Inject, ElementRef, Input, OnInit, OnChanges, SimpleChanges } from "@angular/core"

import { Destructible } from "../../util"
import { RectMutationService, Dimension } from "../../layout.module"
import { TabLabelsComponent } from "./tab-labels.component"


@Directive({
    selector: ".nz-tab-label"
})
export class TabLabelDirective extends Destructible implements OnInit, OnChanges {
    @Input() public index: number

    private width: number

    public constructor(
        @Inject(ElementRef) el: ElementRef,
        @Inject(RectMutationService) mutation: RectMutationService,
        @Inject(TabLabelsComponent) private readonly labels: TabLabelsComponent) {
        super()

        this.destruct.subscription(mutation.watchDimension(el.nativeElement))
            .subscribe(dim => {
                this.width = dim.width
                if (this.index != null) {
                    labels.updateLabelSize(this.index, dim.width)
                }
            })
    }

    public ngOnInit() {
        this.labels.updateLabelSize(this.index, this.width)
    }

    public ngOnChanges(changes: SimpleChanges) {
        if ("index" in changes) {
            this.labels.updateLabelSize(changes.index.currentValue, this.width)
        }
    }
}
