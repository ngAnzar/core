

export class Time {
    public hours: number
    public minutes: number
    public seconds: number

    public constructor(value: string) {
        let parts = value.split(":")

        this.hours = parseInt(parts[0], 10) || 0
        this.minutes = parseInt(parts[1], 10) || 0
        this.seconds = parseInt(parts[2], 10) || 0
    }
}
