

export abstract class AnzarEvent {
    private _prevented: boolean

    public preventDefault(): void {
        this._prevented = true
    }

    public isDefaultPrevented(): boolean {
        return !!this._prevented
    }
}
