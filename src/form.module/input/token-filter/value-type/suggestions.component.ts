import { Component, Inject, Input } from "@angular/core"
import { AbstractControl } from "@angular/forms"

import { DataSourceDirective } from "../../../../data.module"
import { AutocompleteComponent } from "../../../../list.module"
import { FocusChangeEvent } from "../../../../common.module"
import { TokenFilterValue, TokenFilterValueInputCtx } from "./abstract"


@Component({
    selector: "nz-token-filter-suggestions",
    templateUrl: "./suggestions.component.pug",
    providers: [
        { provide: TokenFilterValue, useExisting: TokenFilterSuggestionsValue }
    ]
})
export class TokenFilterSuggestionsValue extends TokenFilterValue {
    @Input() public displayField: string
    @Input() public valueField: string
    @Input() public queryField: string

    public readonly acComponent = AutocompleteComponent

    public constructor(@Inject(DataSourceDirective) private readonly dataSource: DataSourceDirective) {
        super()
    }

    public createDsFilter(control: AbstractControl, values: any[]) {
        let notIn = values ? values.filter(v => v !== control.value) : null
        if (notIn) {
            return { [this.valueField]: { "not in": notIn } }
        } else {
            return null
        }
    }

    public updateContext(ctx: TokenFilterValueInputCtx) {
        ctx.filter = this.createDsFilter(ctx.$implicit, ctx.values)
        ctx.sorter = { [this.displayField]: "asc" }
        if (!ctx.source) {
            ctx.source = this.dataSource.clone()
        }
        return ctx
    }

    public removeOnFocusChange(forigin: FocusChangeEvent, control: AbstractControl, remove: () => void, focused: (forigin: FocusChangeEvent) => void) {
        focused(forigin)
        if (!forigin.curr && control.value == null) {
            remove()
        }
    }

    public removeOnKey(event: KeyboardEvent, control: AbstractControl, remove: () => void) {
        if (event.key === "Backspace" && control.value == null) {
            remove()
        }
    }
}
