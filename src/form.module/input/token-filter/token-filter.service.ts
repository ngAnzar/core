import { Injectable, Inject } from "@angular/core"

import { TokenFilterComparator } from "./token-filter-comparator"
import { TFSuggestions } from "./suggestions"
// TODO: valamai közös hely a modelleknek
import type { TokenFilterModel } from "./token-filter-input.component"


@Injectable()
export class TokenFilterService {
    public readonly filterSuggestions: TFSuggestions<TokenFilterModel>

    public constructor(
        @Inject(TokenFilterComparator) public readonly comparators: TokenFilterComparator[]) {
        this.comparators.sort((a, b) => b.priority - a.priority)
    }

    public getComparator(name: string): TokenFilterComparator | null {
        return this.comparators.filter(v => v.name === name)[0] || null
    }

    public determineComparator(value: any): TokenFilterComparator {
        let def: TokenFilterComparator
        for (const cmp of this.comparators) {
            if (cmp.isDefault) {
                def = cmp
            }
            if (cmp.canHandle(value)) {
                return cmp
            }
        }
        return def
    }
}
