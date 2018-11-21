import { Injectable, Inject } from "@angular/core"

import { RectMutationService } from "../../layout.module"

import { LevitateRef } from "./levitate-ref"
import { Levitating, Anchor, Constraint } from "./levitate-options"


@Injectable()
export class LevitateService {
    public constructor(
        @Inject(RectMutationService) protected rectMutation: RectMutationService) {
    }

    public levitate(levitate: Levitating, anchor?: Anchor, constraint?: Constraint): LevitateRef {
        return new LevitateRef(this.rectMutation, levitate, anchor, constraint)
    }
}
