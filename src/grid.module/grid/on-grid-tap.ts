import { Model } from "../../data.module"

export interface OnGridTap<T extends Model> {
    onGridTap(event: Event, model: T, row: number, col: number): void
}
